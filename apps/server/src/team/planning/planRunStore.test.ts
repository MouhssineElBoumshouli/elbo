import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, describe, it } from "@effect/vitest";
import { ProjectId, ProviderInstanceId } from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";

import { weekendBrief } from "./planFixtures.testkit.ts";
import {
  readStoredRuns,
  restoredState,
  runsToKeep,
  type StoredPlanRun,
  writeStoredRun,
} from "./planRunStore.ts";

const seat = {
  provider: "codex" as const,
  instanceId: ProviderInstanceId.make("codex"),
  model: "gpt-6-astra",
  effort: "medium",
  agent: { driver: "codex", name: "Codex", model: "gpt-6-astra" },
};

const stored = (
  overrides: Partial<StoredPlanRun["state"]> = {},
  updatedAt = "2026-11-23T10:00:00Z",
): StoredPlanRun => ({
  runId: `run-${updatedAt}`,
  brief: weekendBrief,
  size: "small",
  writer: seat,
  reviewer: seat,
  state: {
    runId: "run-1",
    projectId: ProjectId.make("project-1"),
    status: "running",
    step: "reviewing",
    round: 1,
    points: 0,
    writer: seat.agent,
    reviewer: seat.agent,
    sameProvider: true,
    view: null,
    error: null,
    answering: null,
    version: 4,
    interrupted: null,
    answers: '{"what":"A to-do list"}',
    ...overrides,
  },
  result: null,
  pending: { number: "0001", ask: { kind: "push-back", message: "Why not React?" } },
  saved: false,
  updatedAt,
});

describe("plan runs across a restart", () => {
  it("brings a cut-off turn back as interrupted, never as running forever", () => {
    const writing = restoredState(stored());
    assert.deepStrictEqual(
      [writing.status, writing.step, writing.interrupted],
      ["interrupted", null, { kind: "run", number: "" }],
    );
    const answering = restoredState(
      stored({ status: "done", step: null, answering: { number: "0002", kind: "pick" } }),
    );
    assert.deepStrictEqual(
      [answering.status, answering.answering, answering.interrupted],
      ["done", null, { kind: "decision", number: "0002" }],
    );
    const done = stored({ status: "done", step: null });
    assert.strictEqual(restoredState(done), done.state);
  });

  it("keeps the newest runs", () => {
    const runs = ["2026-11-01", "2026-11-03", "2026-11-02"].map((day) =>
      stored({}, `${day}T00:00:00Z`),
    );
    const { kept, dropped } = runsToKeep(runs, 2);
    assert.deepStrictEqual(
      kept.map((run) => run.updatedAt.slice(0, 10)),
      ["2026-11-03", "2026-11-02"],
    );
    assert.deepStrictEqual(
      dropped.map((run) => run.updatedAt.slice(0, 10)),
      ["2026-11-01"],
    );
  });

  it.effect("reads back exactly what it wrote, and skips a file it can't read", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const folder = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-runs-" });
      const run = stored();
      yield* writeStoredRun(folder, run);
      yield* fs.writeFileString(`${folder}/broken.json`, "{not json");
      assert.deepStrictEqual(yield* readStoredRuns(folder), [run]);
    }).pipe(Effect.scoped, Effect.provide(NodeServices.layer)),
  );
});
