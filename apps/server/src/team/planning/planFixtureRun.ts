// team-layer: dev only. With ELBO_PLAN_FIXTURE set, the plan page replays a saved plan.json and
// answers decisions with canned replies, so the screens can be built without AI turns.
import * as Effect from "effect/Effect";
import type * as Schema from "effect/Schema";

import { planParts, touchedBy } from "./planChallenge.ts";
import type { Ask, StepRequest } from "./planMethod.ts";
import type { DecisionRecord, PlanResult, PushBackReply } from "./planSchemas.ts";

/** The steps of a run with one fix round, then the saved plan. */
export const replayFixture = Effect.fn("planning.replayFixture")(function* <E>(
  read: Effect.Effect<PlanResult, E>,
  update: (step: string, points?: number) => Effect.Effect<void>,
  stepMs: number,
) {
  for (const [step, points] of [["write"], ["review:1"], ["fix:1", 2]] as const) {
    yield* update(step, points);
    yield* Effect.sleep(stepMs);
  }
  return yield* read;
});

/** A push-back is defended; a pick swaps the old pick for the new one in the parts that use it. */
export function fixtureAsk(result: PlanResult, record: DecisionRecord, stepMs: number): Ask<never> {
  return <S extends Schema.Top>(request: StepRequest<S>) => {
    const option = /^pick:/u.test(request.step)
      ? (/They picked "([^"]+)"/u.exec(request.prompt)?.[1] ?? null)
      : null;
    const parts = planParts(result.plan.plan);
    const reply: PushBackReply =
      option === null
        ? {
            verdict: "defend",
            answer: `${record.decision.picked} still fits this team best: ${record.decision.why}`,
            decision: record.decision,
            parts: [],
            tasks: [],
            risk: "",
          }
        : {
            verdict: "change",
            answer: `Fine: the plan now uses ${option}.`,
            decision: { ...record.decision, picked: option, why: `The team chose ${option}.` },
            parts: touchedBy(record.decision, result.plan).parts.map((index) => ({
              index,
              text: (parts[index] ?? "").replaceAll(record.decision.picked, option),
            })),
            tasks: [],
            risk: `${option} was not the plan's pick; check it early in week 1.`,
          };
    return Effect.sleep(stepMs).pipe(Effect.as(reply as S["Type"]));
  };
}
