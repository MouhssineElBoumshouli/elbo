import { wordCount } from "./planCaps.ts";
import { EXPERTS, type ExpertId, type PlanSize } from "./planExperts.ts";
import type { DecisionRecord, ExpertDraft } from "./planSchemas.ts";

/** Hard limits per plan size, counted on the final plan.md. */
export const PLAN_LIMITS: Record<PlanSize, { readonly decisions: number; readonly words: number }> =
  {
    small: { decisions: 2, words: 500 },
    medium: { decisions: 6, words: 1_500 },
    large: { decisions: 10, words: 3_000 },
  };

export const overWordLimit = (markdown: string, size: PlanSize) =>
  wordCount(markdown) > PLAN_LIMITS[size].words;

const sameTitle = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/**
 * Numbers every decision and marks which stay as cards: the ones the project manager ranked, most
 * important first, up to the size's limit. The rest become one-line "smaller choices". When no
 * ranked title matches, the first decisions in plan order stay.
 */
export function budgetDecisions(
  drafts: ReadonlyArray<{ readonly expert: ExpertId; readonly draft: ExpertDraft }>,
  size: PlanSize,
  ranking: ReadonlyArray<string>,
): ReadonlyArray<DecisionRecord> {
  const all = drafts.flatMap(({ expert, draft }) =>
    draft.decisions.map((decision) => ({ expert, decision })),
  );
  const limit = PLAN_LIMITS[size].decisions;
  const ranked = ranking
    .map((title) => all.find((entry) => sameTitle(entry.decision.title, title)))
    .filter((entry) => entry !== undefined)
    .filter((entry, index, list) => list.indexOf(entry) === index)
    .slice(0, limit);
  const main = ranked.length > 0 ? ranked : all.slice(0, limit);
  const ordered = [...main, ...all.filter((entry) => !main.includes(entry))];
  return ordered.map(({ expert, decision }, index) => ({
    number: String(index + 1).padStart(4, "0"),
    owner: expert,
    decidedBy: `${EXPERTS[expert].name}, proposed`,
    status: "proposed",
    decision,
    history: [],
    main: main.some((entry) => entry.decision === decision),
  }));
}
