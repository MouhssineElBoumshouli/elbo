import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import type { UsageRow } from "./planProvider.ts";
import { renderDecisionLog, renderPlan } from "./planRender.ts";
import { PlanResult } from "./planSchemas.ts";
import { totalUsage, usageLine } from "./planUsage.ts";

const encodePlan = Schema.encodeEffect(Schema.fromJsonString(PlanResult));
const encodeJson = Schema.encodeEffect(Schema.fromJsonString(Schema.Unknown));
export const decodePlan = Schema.decodeEffect(Schema.fromJsonString(PlanResult));

/** A plan.json the runner wrote, for the agent's tool and the runner's --save-to. */
export const readPlanFile = Effect.fn("planning.readPlanFile")(function* (file: string) {
  const fs = yield* FileSystem.FileSystem;
  return yield* fs.readFileString(file).pipe(Effect.flatMap(decodePlan));
});

export interface ProviderUsage {
  /** e.g. "codex gpt-6-astra (writer)". */
  readonly who: string;
  readonly turns: ReadonlyArray<UsageRow>;
}

/** Writes plan.md, decision-log.md, plan.json (to reopen for a push-back) and usage.json. */
export const writePlanFiles = Effect.fn("planning.writePlanFiles")(function* (input: {
  readonly outDir: string;
  readonly plan: PlanResult;
  readonly usage: ReadonlyArray<ProviderUsage>;
}) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  yield* fs.makeDirectory(input.outDir, { recursive: true });
  yield* fs.writeFileString(
    path.join(input.outDir, "plan.md"),
    renderPlan(input.plan.plan, input.plan.decisions),
  );
  yield* fs.writeFileString(
    path.join(input.outDir, "decision-log.md"),
    renderDecisionLog(input.plan),
  );
  yield* fs.writeFileString(path.join(input.outDir, "plan.json"), yield* encodePlan(input.plan));
  const summary = input.usage.map(({ who, turns }) => usageLine(who, turns)).join(" · ");
  yield* fs.writeFileString(
    path.join(input.outDir, "usage.json"),
    yield* encodeJson({
      summary,
      providers: input.usage.map(({ who, turns }) => ({ who, total: totalUsage(turns), turns })),
    }),
  );
  return summary;
});
