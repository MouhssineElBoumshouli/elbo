import * as Effect from "effect/Effect";
import type * as Schema from "effect/Schema";

import type { PlanBrief } from "./planBrief.ts";
import { budgetDecisions, overWordLimit } from "./planBudget.ts";
import { capDraft, capMerge, wordCount } from "./planCaps.ts";
import {
  EXPERTS,
  type ExpertId,
  normalizePanel,
  type PlanSize,
  REVIEW_ROUNDS,
  sectionsFor,
  type SectionId,
} from "./planExperts.ts";
import { fixAllPrompt, mergePrompt, reviewPrompt, shortenPrompt } from "./planMergePrompts.ts";
import {
  type Checklists,
  checklistFor,
  draftPrompt,
  SHORT_DEADLINE_DAYS,
  sizePrompt,
} from "./planPrompts.ts";
import { renderPlan } from "./planRender.ts";
import {
  type ExpertDraft,
  ExpertDraft as ExpertDraftSchema,
  FixedDrafts,
  Merge,
  type OpenChoice,
  type PlanResult,
  Review,
  type ReviewProblem,
  SizeAndPanel,
} from "./planSchemas.ts";

export interface StepRequest<S extends Schema.Top> {
  /** e.g. `draft:architect`; names the turn in logs, usage rows and test fakes. */
  readonly step: string;
  readonly prompt: string;
  readonly schema: S;
}

/** One model turn. The runner backs it with a provider; tests back it with fixed outputs. */
export type Ask<E> = <S extends Schema.Top>(
  request: StepRequest<S>,
) => Effect.Effect<S["Type"], E, S["DecodingServices"]>;

interface Drafted {
  readonly expert: ExpertId;
  readonly draft: ExpertDraft;
}

const ownedSections = (expert: ExpertId, sections: ReadonlyArray<SectionId>) =>
  EXPERTS[expert].sections.filter((section) => sections.includes(section));

/** Experts that own no section of this size's plan still review, but write nothing. */
const writers = (panel: ReadonlyArray<ExpertId>, sections: ReadonlyArray<SectionId>) =>
  panel.filter(
    (expert) => expert === "project-manager" || ownedSections(expert, sections).length > 0,
  );

export const runMethod = Effect.fn("planning.runMethod")(function* <E>(input: {
  readonly brief: PlanBrief;
  readonly checklists: Checklists;
  readonly ask: Ask<E>;
  /** Every turn goes to one provider chat, so later prompts need not repeat the brief or parts. */
  readonly sharedChat?: boolean | undefined;
  readonly size?: PlanSize | undefined;
}) {
  const { brief, checklists, ask } = input;
  const inChat = input.sharedChat === true;
  const overruns: string[] = [];

  const picked = yield* ask({ step: "size", prompt: sizePrompt(brief), schema: SizeAndPanel });
  const size = input.size ?? picked.size;
  const panel = normalizePanel({
    size,
    kind: picked.kind,
    isSoftware: picked.isSoftware,
    deadlineDays: brief.deadlineDays,
    requested: picked.panel,
  });
  const quickSecurity = picked.isSoftware && !panel.includes("security");
  const sections = sectionsFor(panel, size);

  let drafts: Drafted[] = [];
  for (const expert of writers(panel, sections)) {
    const raw = yield* ask({
      step: `draft:${expert}`,
      prompt: draftPrompt({
        brief,
        expert,
        size,
        panel,
        sections: ownedSections(expert, sections),
        checklist: checklistFor(expert, checklists, quickSecurity),
        inChat,
      }),
      schema: ExpertDraftSchema,
    });
    const capped = capDraft(raw, expert);
    overruns.push(...capped.overruns);
    drafts.push({ expert, draft: capped.value });
  }

  const problems: ReviewProblem[] = [];
  const choices: OpenChoice[] = [];
  for (let round = 1; round <= REVIEW_ROUNDS[size]; round++) {
    const review = yield* ask({
      step: `review:${round}`,
      prompt: reviewPrompt({ brief, drafts, checklists, inChat }),
      schema: Review,
    });
    // A reviewer cannot file against itself or an expert that wrote nothing.
    const found = review.problems.filter(
      (problem) => problem.from !== problem.to && drafts.some((d) => d.expert === problem.to),
    );
    if (found.length === 0) break;
    problems.push(...found);
    const fixed = yield* ask({
      step: `fix:${round}`,
      prompt: fixAllPrompt({ brief, drafts, problems: found, inChat }),
      schema: FixedDrafts,
    });
    choices.push(...fixed.unresolved);
    drafts = drafts.map((drafted) => {
      const fix = found.some((p) => p.to === drafted.expert)
        ? fixed.fixes.find((entry) => entry.expert === drafted.expert)
        : undefined;
      if (!fix) return drafted;
      const capped = capDraft(fix.draft, drafted.expert);
      overruns.push(...capped.overruns);
      return { expert: drafted.expert, draft: capped.value };
    });
  }

  const merged = capMerge(
    yield* ask({
      step: "merge",
      prompt: mergePrompt({ brief, size, sections, drafts, choices, inChat }),
      schema: Merge,
    }),
  );
  overruns.push(...merged.overruns);

  const result = (merge: Merge, wordsBeforeShorten: number): PlanResult => ({
    size,
    schedule: brief.deadlineDays <= SHORT_DEADLINE_DAYS ? "blocks" : "weeks",
    sizeReason: input.size
      ? `set by the person (the panel suggested ${picked.size})`
      : picked.sizeReason,
    panel,
    drafts,
    problems,
    choices,
    merge,
    decisions: budgetDecisions(drafts, size, merge.mainDecisions),
    overruns,
    wordsBeforeShorten,
  });

  const first = result(merged.value, 0);
  const markdown = renderPlan(first);
  if (!overWordLimit(markdown, size)) return first;
  const shorter = yield* ask({
    step: "shorten",
    prompt: shortenPrompt({ brief, size, merge: merged.value, words: wordCount(markdown), inChat }),
    schema: Merge,
  });
  return result(shorter, wordCount(markdown));
});
