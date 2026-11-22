import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import { ExpertId } from "./planExperts.ts";
import type { Checklists } from "./planPrompts.ts";
import type { UsageRow } from "./planProvider.ts";
import { decisionFileName, renderDecision, renderPlan } from "./planRender.ts";
import { PlanResult } from "./planSchemas.ts";
import { totalUsage, usageLine } from "./planUsage.ts";

const CHECKLIST_DIR = new URL("./checklists/", import.meta.url);

export const loadChecklists = Effect.fn("planning.loadChecklists")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const dir = yield* path.fromFileUrl(CHECKLIST_DIR);
  const entries = yield* Effect.forEach(ExpertId.literals, (id) =>
    fs.readFileString(path.join(dir, `${id}.md`)).pipe(Effect.map((text) => [id, text] as const)),
  );
  return Object.fromEntries(entries) as Checklists;
});

const encodePlan = Schema.encodeEffect(Schema.fromJsonString(PlanResult));
const encodeJson = Schema.encodeEffect(Schema.fromJsonString(Schema.Unknown));
export const decodePlan = Schema.decodeEffect(Schema.fromJsonString(PlanResult));

/** Writes plan.md, one file per decision, plan.json (to reopen for a push-back) and usage.json. */
export const writePlanFiles = Effect.fn("planning.writePlanFiles")(function* (input: {
  readonly outDir: string;
  readonly plan: PlanResult;
  readonly usage: ReadonlyArray<UsageRow>;
  readonly date: string;
}) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const decisionsDir = path.join(input.outDir, "decisions");
  yield* fs.makeDirectory(decisionsDir, { recursive: true });
  yield* fs.writeFileString(path.join(input.outDir, "plan.md"), renderPlan(input.plan));
  yield* Effect.forEach(input.plan.decisions, (record) =>
    fs.writeFileString(
      path.join(decisionsDir, decisionFileName(record)),
      renderDecision(record, input.date),
    ),
  );
  yield* fs.writeFileString(path.join(input.outDir, "plan.json"), yield* encodePlan(input.plan));
  const total = totalUsage(input.usage);
  const summary = usageLine(input.plan.size, input.usage.length, total);
  yield* fs.writeFileString(
    path.join(input.outDir, "usage.json"),
    yield* encodeJson({ size: input.plan.size, summary, total, turns: input.usage }),
  );
  return summary;
});
