// team-layer: plans survive a restart (the Update button restarts the app). Each run is kept as
// one JSON file in Elbo's data folder, rewritten after every step; a turn a restart cut off comes
// back as "interrupted" with the means to try it again.
import {
  ProviderInstanceId,
  TeamPlanAgent,
  TeamPlanBrief,
  TeamPlanRunState,
  TeamPlanSize,
} from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import { PlanResult } from "./planSchemas.ts";

const StoredSeat = Schema.Struct({
  provider: Schema.Literals(["codex", "claude"]),
  instanceId: ProviderInstanceId,
  model: Schema.String,
  effort: Schema.String,
  agent: TeamPlanAgent,
});

export const StoredPlanRun = Schema.Struct({
  runId: Schema.String,
  brief: TeamPlanBrief,
  size: TeamPlanSize,
  writer: StoredSeat,
  reviewer: StoredSeat,
  state: TeamPlanRunState,
  result: Schema.NullOr(PlanResult),
  /** The push-back or pick the writer was answering, so "Try again" can send it again. */
  pending: Schema.NullOr(
    Schema.Struct({
      number: Schema.String,
      ask: Schema.Union([
        Schema.Struct({ kind: Schema.Literal("pick"), option: Schema.String }),
        Schema.Struct({ kind: Schema.Literal("push-back"), message: Schema.String }),
      ]),
    }),
  ),
  saved: Schema.Boolean,
  updatedAt: Schema.String,
});
export type StoredPlanRun = typeof StoredPlanRun.Type;

/** The run as a restart leaves it: a turn that was running is now interrupted, not running forever. */
export function restoredState(stored: StoredPlanRun): TeamPlanRunState {
  const { state } = stored;
  if (state.status === "running") {
    return {
      ...state,
      status: "interrupted",
      step: null,
      interrupted: { kind: "run", number: "" },
    };
  }
  if (state.answering !== null) {
    return {
      ...state,
      answering: null,
      interrupted: { kind: "decision", number: state.answering.number },
    };
  }
  return state;
}

/** Newest first; the rest are deleted so the folder stays small. */
export function runsToKeep(runs: ReadonlyArray<StoredPlanRun>, keep: number) {
  const sorted = runs.toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return { kept: sorted.slice(0, keep), dropped: sorted.slice(keep) };
}

const encode = Schema.encodeEffect(Schema.fromJsonString(StoredPlanRun));
const decode = Schema.decodeUnknownEffect(Schema.fromJsonString(StoredPlanRun));

/** Writes through a temporary file, so a restart mid-write never leaves half a plan. */
export const writeStoredRun = Effect.fn("planning.writeStoredRun")(function* (
  folder: string,
  run: StoredPlanRun,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const file = path.join(folder, `${run.runId}.json`);
  yield* fs.makeDirectory(folder, { recursive: true });
  yield* fs.writeFileString(`${file}.tmp`, yield* encode(run));
  yield* fs.rename(`${file}.tmp`, file);
});

export const removeStoredRun = Effect.fn("planning.removeStoredRun")(function* (
  folder: string,
  runId: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  yield* fs.remove(path.join(folder, `${runId}.json`)).pipe(Effect.ignore);
});

/** Every readable run in the folder; a file that no longer decodes is skipped, not fatal. */
export const readStoredRuns = Effect.fn("planning.readStoredRuns")(function* (folder: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const names = yield* fs.readDirectory(folder).pipe(Effect.orElseSucceed(() => []));
  const runs = yield* Effect.forEach(
    names.filter((name) => name.endsWith(".json")),
    (name) =>
      fs.readFileString(path.join(folder, name)).pipe(
        Effect.flatMap(decode),
        Effect.map((run) => [run]),
        Effect.catch((cause) =>
          Effect.logWarning("planning: skipped a saved plan that could not be read", {
            file: name,
            cause,
          }).pipe(Effect.as([])),
        ),
      ),
  );
  return runs.flat();
});
