// team-layer: the plan runs the app knows, in memory and in Elbo's data folder (planRunStore.ts).
// Every state change is published to the plan page and written to disk, so a restart loses nothing.
import type { TeamPlanRunState } from "@t3tools/contracts";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import type * as Fiber from "effect/Fiber";
import type * as FileSystem from "effect/FileSystem";
import type * as Path from "effect/Path";
import * as SubscriptionRef from "effect/SubscriptionRef";

import { changed } from "./planRun.ts";
import {
  readStoredRuns,
  removeStoredRun,
  restoredState,
  runsToKeep,
  type StoredPlanRun,
  writeStoredRun,
} from "./planRunStore.ts";

/** Runs kept for the plan page and saving; older ones go first, from memory and from disk. */
export const KEPT_RUNS = 20;

export interface Run extends Omit<
  StoredPlanRun,
  "state" | "result" | "pending" | "saved" | "updatedAt"
> {
  readonly state: SubscriptionRef.SubscriptionRef<TeamPlanRunState>;
  result: StoredPlanRun["result"];
  pending: StoredPlanRun["pending"];
  saved: boolean;
  updatedAt: string;
  fiber: Fiber.Fiber<unknown, unknown> | null;
  /** The person pressed Stop; any other interruption is the app shutting down. */
  stopRequested: boolean;
  /** The writer's turn on one decision; one at a time, since two could rewrite the same part. */
  answering: Fiber.Fiber<unknown, unknown> | null;
}

export const makePlanRuns = Effect.fn("planning.makePlanRuns")(function* (folder: string) {
  const fileContext = yield* Effect.context<FileSystem.FileSystem | Path.Path>();
  const onDisk = <A, E>(effect: Effect.Effect<A, E, FileSystem.FileSystem | Path.Path>) =>
    effect.pipe(Effect.provide(fileContext));
  const runs = new Map<string, Run>();

  const persist = Effect.fn("planning.persistRun")(
    function* (run: Run) {
      run.updatedAt = DateTime.formatIso(yield* DateTime.now);
      yield* writeStoredRun(folder, {
        runId: run.runId,
        brief: run.brief,
        size: run.size,
        writer: run.writer,
        reviewer: run.reviewer,
        state: yield* SubscriptionRef.get(run.state),
        result: run.result,
        pending: run.pending,
        saved: run.saved,
        updatedAt: run.updatedAt,
      });
    },
    onDisk,
    Effect.catch((cause) => Effect.logWarning("planning: could not keep the plan", { cause })),
  );

  const setState = (run: Run, change: Parameters<typeof changed>[0]) =>
    SubscriptionRef.updateAndGet(run.state, changed(change)).pipe(Effect.tap(() => persist(run)));

  const remember = Effect.fn("planning.rememberRun")(function* (run: Run) {
    runs.set(run.runId, run);
    const order = [...runs.values()].toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    for (const old of order.slice(KEPT_RUNS)) {
      runs.delete(old.runId);
      yield* onDisk(removeStoredRun(folder, old.runId));
    }
  });

  const restore = Effect.fn("planning.restoreRun")(function* (stored: StoredPlanRun) {
    const { state, result, pending, saved, updatedAt, ...fixed } = stored;
    const restored = restoredState(stored);
    const run: Run = {
      ...fixed,
      state: yield* SubscriptionRef.make(restored),
      result,
      pending,
      saved,
      updatedAt,
      fiber: null,
      stopRequested: false,
      answering: null,
    };
    runs.set(run.runId, run);
    if (restored !== state) yield* persist(run);
  });

  const loaded = yield* onDisk(readStoredRuns(folder)).pipe(Effect.orElseSucceed(() => []));
  const { kept, dropped } = runsToKeep(loaded, KEPT_RUNS);
  yield* Effect.forEach(kept, restore);
  yield* Effect.forEach(dropped, (run) => onDisk(removeStoredRun(folder, run.runId)));

  return { runs, persist, setState, remember };
});
