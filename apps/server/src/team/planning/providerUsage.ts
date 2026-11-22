import type { TokenUsage } from "@t3tools/provider-core/server/textGenerationOperations";
import * as Option from "effect/Option";
import * as Schema from "effect/Schema";

// Token counts for the planning runner, read from output the provider CLIs print.
// Both report total input tokens, cached ones included, so runs compare across providers.

const ClaudeUsage = Schema.Struct({
  input_tokens: Schema.Number,
  output_tokens: Schema.Number,
  cache_read_input_tokens: Schema.optionalKey(Schema.Number),
  cache_creation_input_tokens: Schema.optionalKey(Schema.Number),
});
const isClaudeUsageCarrier = Schema.is(Schema.Struct({ type: Schema.String, usage: ClaudeUsage }));
const decodeJsonOption = Schema.decodeUnknownOption(Schema.fromJsonString(Schema.Unknown));

/** From `claude -p --output-format json`: one result object, or a message list ending in one. */
export function claudeUsage(stdout: string): TokenUsage | undefined {
  const output = Option.getOrUndefined(decodeJsonOption(stdout));
  const messages: ReadonlyArray<unknown> = Array.isArray(output) ? output : [output];
  const usage = messages.filter(isClaudeUsageCarrier).findLast((m) => m.type === "result")?.usage;
  if (usage === undefined) return undefined;
  const cached = usage.cache_read_input_tokens ?? 0;
  // Claude's input_tokens leaves out both cache counts.
  return {
    inputTokens: usage.input_tokens + cached + (usage.cache_creation_input_tokens ?? 0),
    cachedInputTokens: cached,
    outputTokens: usage.output_tokens,
  };
}

const decodeCodexTurn = Schema.decodeUnknownOption(
  Schema.fromJsonString(
    Schema.Struct({
      type: Schema.Literal("turn.completed"),
      usage: Schema.Struct({
        input_tokens: Schema.Number,
        output_tokens: Schema.Number,
        cached_input_tokens: Schema.optionalKey(Schema.Number),
      }),
    }),
  ),
);

/** From `codex exec --json`: one `turn.completed` event per turn, one JSON object per line. */
export function codexUsage(stdout: string): TokenUsage | undefined {
  const turns = stdout.split("\n").flatMap((line) => Option.toArray(decodeCodexTurn(line)));
  if (turns.length === 0) return undefined;
  return turns.reduce(
    (sum, { usage }) => ({
      inputTokens: sum.inputTokens + usage.input_tokens,
      cachedInputTokens: sum.cachedInputTokens + (usage.cached_input_tokens ?? 0),
      outputTokens: sum.outputTokens + usage.output_tokens,
    }),
    { inputTokens: 0, cachedInputTokens: 0, outputTokens: 0 },
  );
}
