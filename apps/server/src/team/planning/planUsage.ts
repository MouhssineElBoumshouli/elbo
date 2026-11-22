import type { TokenUsage } from "@t3tools/provider-core/server/textGenerationOperations";

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

/** e.g. "codex: 3 turns, input 41.2k (55% cached), output 6.1k". */
export function usageLine(who: string, rows: ReadonlyArray<TokenUsage>): string {
  const usage = totalUsage(rows);
  const cached =
    usage.inputTokens > 0 ? Math.round((usage.cachedInputTokens / usage.inputTokens) * 100) : 0;
  return `${who}: ${rows.length} turn${rows.length === 1 ? "" : "s"}, input ${k(usage.inputTokens)} (${cached}% cached), output ${k(usage.outputTokens)}`;
}
