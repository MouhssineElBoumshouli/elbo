import * as Effect from "effect/Effect";

import type { PlanBrief } from "./planBrief.ts";
import type { Ask } from "./planMethod.ts";
import { pushBackPrompt } from "./planPrompts.ts";
import { type DecisionRecord, PushBackReply } from "./planSchemas.ts";

/** The team pushes back on a decision; the writer defends or changes it, and the record keeps both. */
export const pushBack = Effect.fn("planning.pushBack")(function* <E>(input: {
  readonly brief: PlanBrief;
  readonly record: DecisionRecord;
  readonly message: string;
  readonly by: string;
  readonly ask: Ask<E>;
}) {
  const reply = yield* input.ask({
    step: `push-back:${input.record.number}`,
    prompt: pushBackPrompt({
      brief: input.brief,
      decision: input.record.decision,
      message: input.message,
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
  const changed = reply.verdict === "change";
  return {
    ...record,
    decision: changed ? reply.decision : record.decision,
    history: [
      ...record.history,
      `${by} pushed back: "${message}"`,
      `${changed ? "Changed" : "Kept"}: ${reply.answer}`,
    ],
  };
}
