import type { TokenUsage } from "@t3tools/provider-core/server/textGenerationOperations";

import type { PlanSize } from "./planExperts.ts";

interface Range {
  readonly min: number;
  readonly max: number;
}

/** team/PLANNING_FEATURE_PLAN.md section 5, estimated before any run (characters / 4). @public */
export const ESTIMATES: Record<PlanSize, { turns: Range; input: Range; output: Range }> = {
  small: {
    turns: { min: 3, max: 4 },
    input: { min: 15_000, max: 30_000 },
    output: { min: 3_000, max: 6_000 },
  },
  medium: {
    turns: { min: 7, max: 10 },
    input: { min: 60_000, max: 120_000 },
    output: { min: 12_000, max: 20_000 },
  },
  large: {
    turns: { min: 12, max: 18 },
    input: { min: 150_000, max: 300_000 },
    output: { min: 30_000, max: 50_000 },
  },
};

export const totalUsage = (rows: ReadonlyArray<TokenUsage>): TokenUsage =>
  rows.reduce(
    (sum, row) => ({
      inputTokens: sum.inputTokens + row.inputTokens,
      cachedInputTokens: sum.cachedInputTokens + row.cachedInputTokens,
      outputTokens: sum.outputTokens + row.outputTokens,
    }),
    { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 },
  );

const k = (n: number) => `${Math.round(n / 100) / 10}k`;
const against = (value: number, range: Range, show: (n: number) => string) =>
  `${show(value)} (estimate ${show(range.min)} to ${show(range.max)}${value > range.max ? ", over" : value < range.min ? ", under" : ""})`;

/** One line per run: measured turns and tokens next to section 5's estimate for its size. */
export function usageLine(size: PlanSize, turns: number, usage: TokenUsage): string {
  const estimate = ESTIMATES[size];
  const cached =
    usage.inputTokens > 0 ? Math.round((usage.cachedInputTokens / usage.inputTokens) * 100) : 0;
  return `turns ${against(turns, estimate.turns, String)} · input ${against(usage.inputTokens, estimate.input, k)}, ${cached}% cached · output ${against(usage.outputTokens, estimate.output, k)}`;
}
