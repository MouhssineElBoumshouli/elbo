import {
  ClaudeSettings,
  CodexSettings,
  ProviderInstanceId,
  type TextGenerationError,
} from "@t3tools/contracts";
import type { TokenUsage } from "@t3tools/provider-core/server/textGenerationOperations";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

import { mergeClaudeProcessEnvironment } from "../../provider/Drivers/ClaudeHome.ts";
import { makeClaudeTextGeneration } from "../../textGeneration/ClaudeTextGeneration.ts";
import { makeCodexTextGeneration } from "../../textGeneration/CodexTextGeneration.ts";
import type { Ask } from "./planMethod.ts";

export type PlanProvider = "codex" | "claude";

export interface UsageRow extends TokenUsage {
  readonly step: string;
}

// The runner must use the person's Claude or Codex subscription, like a chat, never a billed key.
const API_KEY_VARIABLES = [
  "ANTHROPIC_API_KEY",
  "ANTHROPIC_AUTH_TOKEN",
  "OPENAI_API_KEY",
  "CODEX_API_KEY",
];

export const withoutApiKeys = (env: NodeJS.ProcessEnv): NodeJS.ProcessEnv =>
  Object.fromEntries(Object.entries(env).filter(([name]) => !API_KEY_VARIABLES.includes(name)));

const STEP_TIMEOUT_MS = 10 * 60_000;
const decodeClaudeSettings = Schema.decodeEffect(ClaudeSettings);
const decodeCodexSettings = Schema.decodeEffect(CodexSettings);

/**
 * An `Ask` on Elbo's own text-generation path (the code that writes titles and PR texts), so it
 * runs the provider CLI on the person's login. Each turn's tokens land in `usage`.
 */
export const makeProviderAsk = Effect.fn("planning.makeProviderAsk")(function* (options: {
  readonly provider: PlanProvider;
  readonly model: string;
  readonly effort: string;
  readonly cwd: string;
}) {
  const env = withoutApiKeys(process.env);
  const generation =
    options.provider === "claude"
      ? yield* makeClaudeTextGeneration(
          yield* decodeClaudeSettings({}),
          yield* mergeClaudeProcessEnvironment({ homePath: "" }, undefined, env),
        )
      : yield* makeCodexTextGeneration(yield* decodeCodexSettings({}), env);
  const usage: UsageRow[] = [];
  const effortOption = options.provider === "claude" ? "effort" : "reasoningEffort";
  const ask: Ask<TextGenerationError> = (request) =>
    generation
      .run({
        // The runner names its operation in errors only; planning has none of its own.
        operation: "generatePrContent",
        cwd: options.cwd,
        prompt: request.prompt,
        outputSchema: request.schema,
        modelSelection: {
          instanceId: ProviderInstanceId.make(
            options.provider === "claude" ? "claudeAgent" : "codex",
          ),
          model: options.model,
          options: [{ id: effortOption, value: options.effort }],
        },
        timeoutMs: STEP_TIMEOUT_MS,
        onUsage: (tokens) => usage.push({ step: request.step, ...tokens }),
      })
      .pipe(Effect.tap(() => Effect.logInfo(`planning: ${request.step} done`)));
  return { ask, usage };
});
