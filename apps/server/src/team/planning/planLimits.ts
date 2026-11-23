import { suggestTeamPlanSize, TeamPlanSize } from "@t3tools/contracts";

export const PlanSize = TeamPlanSize;
export type PlanSize = TeamPlanSize;

/** Hard limits per plan size, counted on the plan the team reads. */
export const PLAN_LIMITS: Record<PlanSize, { readonly decisions: number; readonly words: number }> =
  {
    small: { decisions: 2, words: 500 },
    medium: { decisions: 6, words: 1_500 },
    large: { decisions: 10, words: 3_000 },
  };

/** At or under this many days, the schedule goes in time blocks and storage stays simple. */
export const SHORT_DEADLINE_DAYS = 7;

export const suggestSize = suggestTeamPlanSize;

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

/** Up to 10% over the limit is not worth a turn: a plan only counts as too long past this. */
const wordCeiling = (size: PlanSize) => Math.floor(PLAN_LIMITS[size].words * 1.1);

export const overWordLimit = (markdown: string, size: PlanSize) =>
  wordCount(markdown) > wordCeiling(size);
