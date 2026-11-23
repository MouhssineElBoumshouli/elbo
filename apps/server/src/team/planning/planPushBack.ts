import * as Effect from "effect/Effect";

import type { PlanBrief } from "./planBrief.ts";
import {
  answered,
  applyAnswer,
  type DecisionAsk,
  planParts,
  touchedBy,
  withDecision,
} from "./planChallenge.ts";
import type { Ask } from "./planMethod.ts";
import { answerPrompt } from "./planPrompts.ts";
import { type PlanResult, PushBackReply } from "./planSchemas.ts";

/**
 * One writer turn on one decision: the team pushed back on it or picked another option. The turn
 * sees the decision, the plan parts and tasks that use it, and the brief; only those can change.
 */
export const answerDecision = Effect.fn("planning.answerDecision")(function* <E>(input: {
  readonly brief: PlanBrief;
  readonly result: PlanResult;
  readonly number: string;
  readonly ask: DecisionAsk;
  readonly by: string;
  readonly writer: string;
  readonly askWriter: Ask<E>;
}) {
  const record = input.result.decisions.find((candidate) => candidate.number === input.number);
  if (record === undefined) return yield* Effect.die(`No decision ${input.number} in this plan.`);
  const sent = touchedBy(record.decision, input.result.plan);
  const parts = planParts(input.result.plan.plan);
  const reply = yield* input.askWriter({
    step: `${input.ask.kind}:${record.number}`,
    prompt: answerPrompt({
      brief: input.brief,
      decision: record.decision,
      parts: sent.parts.map((index) => ({ index, value: parts[index] ?? "" })),
      tasks: sent.tasks.flatMap((index) => {
        const task = input.result.plan.tasks[index];
        return task === undefined ? [] : [{ index, value: task }];
      }),
      ask: input.ask,
    }),
    schema: PushBackReply,
  });
  const defended = input.ask.kind === "push-back" && reply.verdict === "defend";
  const applied = defended
    ? { written: input.result.plan, updated: [] }
    : applyAnswer(input.result.plan, sent, reply);
  const next = answered({
    record,
    ask: input.ask,
    reply,
    by: input.by,
    writer: input.writer,
    updated: applied.updated,
  });
  return { result: withDecision(input.result, next, applied.written), record: next, sent };
});
