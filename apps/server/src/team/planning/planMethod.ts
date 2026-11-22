import * as Effect from "effect/Effect";
import type * as Schema from "effect/Schema";

import type { PlanBrief } from "./planBrief.ts";
import { capDraft, capMerge } from "./planCaps.ts";
import {
  EXPERTS,
  type ExpertId,
  normalizePanel,
  type PlanSize,
  REVIEW_ROUNDS,
  sectionsFor,
  type SectionId,
} from "./planExperts.ts";
import {
  type Checklists,
  draftPrompt,
  fixPrompt,
  mergePrompt,
  pushBackPrompt,
  reviewPrompt,
  SHORT_DEADLINE_DAYS,
  sizePrompt,
} from "./planPrompts.ts";
import {
  type DecisionRecord,
  type ExpertDraft,
  FixedDraft,
  ExpertDraft as ExpertDraftSchema,
  Merge,
  type OpenChoice,
  type PlanResult,
  PushBackReply,
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

/** Numbers decisions in plan order; each starts as a proposal by the expert that made it. */
function numberDecisions(drafts: ReadonlyArray<Drafted>): ReadonlyArray<DecisionRecord> {
  return drafts
    .flatMap(({ expert, draft }) => draft.decisions.map((decision) => ({ expert, decision })))
    .map(({ expert, decision }, index) => ({
      number: String(index + 1).padStart(4, "0"),
      owner: expert,
      decidedBy: `${EXPERTS[expert].name}, proposed`,
      status: "proposed",
      decision,
      history: [],
    }));
}

export const runMethod = Effect.fn("planning.runMethod")(function* <E>(input: {
  readonly brief: PlanBrief;
  readonly checklists: Checklists;
  readonly ask: Ask<E>;
  readonly size?: PlanSize | undefined;
}) {
  const { brief, checklists, ask } = input;
  const checklist = (expert: ExpertId) => checklists[expert] ?? "";
  const overruns: string[] = [];

  const picked = yield* ask({ step: "size", prompt: sizePrompt(brief), schema: SizeAndPanel });
  const size = input.size ?? picked.size;
  const panel = normalizePanel(size, picked.isSoftware, picked.panel);
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
        checklist: checklist(expert),
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
      prompt: reviewPrompt({ brief, drafts, checklists }),
      schema: Review,
    });
    // A reviewer cannot file against itself or an expert that wrote nothing.
    const found = review.problems.filter(
      (problem) => problem.from !== problem.to && drafts.some((d) => d.expert === problem.to),
    );
    if (found.length === 0) break;
    problems.push(...found);
    const next: Drafted[] = [];
    for (const drafted of drafts) {
      const mine = found.filter((problem) => problem.to === drafted.expert);
      if (mine.length === 0) {
        next.push(drafted);
        continue;
      }
      const fixed = yield* ask({
        step: `fix:${round}:${drafted.expert}`,
        prompt: fixPrompt({
          brief,
          expert: drafted.expert,
          draft: drafted.draft,
          problems: mine,
          checklist: checklist(drafted.expert),
        }),
        schema: FixedDraft,
      });
      const capped = capDraft(fixed.draft, drafted.expert);
      overruns.push(...capped.overruns);
      choices.push(...fixed.unresolved);
      next.push({ expert: drafted.expert, draft: capped.value });
    }
    drafts = next;
  }

  const merged = capMerge(
    yield* ask({
      step: "merge",
      prompt: mergePrompt({ brief, size, sections, drafts, choices }),
      schema: Merge,
    }),
  );
  overruns.push(...merged.overruns);

  return {
    size,
    schedule: brief.deadlineDays <= SHORT_DEADLINE_DAYS ? "blocks" : "weeks",
    sizeReason: input.size
      ? `set by the person (the panel suggested ${picked.size})`
      : picked.sizeReason,
    panel,
    drafts,
    problems,
    choices,
    merge: merged.value,
    decisions: numberDecisions(drafts),
    overruns,
  } satisfies PlanResult;
});

/** Step 6: the decision's owner defends or changes it; the record keeps the exchange. */
export const pushBack = Effect.fn("planning.pushBack")(function* <E>(input: {
  readonly brief: PlanBrief;
  readonly record: DecisionRecord;
  readonly message: string;
  readonly by: string;
  readonly checklists: Checklists;
  readonly ask: Ask<E>;
}) {
  const reply = yield* input.ask({
    step: `push-back:${input.record.number}`,
    prompt: pushBackPrompt({
      brief: input.brief,
      expert: input.record.owner,
      decision: input.record.decision,
      message: input.message,
      checklist: input.checklists[input.record.owner] ?? "",
    }),
    schema: PushBackReply,
  });
  return applyPushBack(input.record, input.by, input.message, reply);
});

export function applyPushBack(
  record: DecisionRecord,
  by: string,
  message: string,
  reply: PushBackReply,
): DecisionRecord {
  const expert = EXPERTS[record.owner].name;
  const changed = reply.verdict === "change";
  return {
    ...record,
    decision: changed ? reply.decision : record.decision,
    history: [
      ...record.history,
      `${by} pushed back: "${message}"`,
      `The ${expert} ${changed ? "changed it" : "defended it"}: ${reply.answer}`,
    ],
  };
}
