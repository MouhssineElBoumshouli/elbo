import * as Effect from "effect/Effect";

import type { PlanBrief } from "./planBrief.ts";
import { EXPERTS } from "./planExperts.ts";
import type { Ask } from "./planMethod.ts";
import { type Checklists, pushBackPrompt } from "./planPrompts.ts";
import { type DecisionRecord, PushBackReply } from "./planSchemas.ts";

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
