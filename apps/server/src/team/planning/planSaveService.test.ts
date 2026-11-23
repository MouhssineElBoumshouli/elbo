import * as NodeServices from "@effect/platform-node/NodeServices";
import { assert, describe, it } from "@effect/vitest";
import { TeamId, TeamMemberId, type TeamMember } from "@t3tools/contracts";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";

import * as GitVcsDriver from "../../vcs/GitVcsDriver.ts";
import { TeamStorageError } from "../TeamErrors.ts";
import { TeamService } from "../TeamService.ts";
import { decision, written } from "./planFixtures.testkit.ts";
import { numberDecisions } from "./planReview.ts";
import * as PlanSaveService from "./planSaveService.ts";
import type { PlanResult } from "./planSchemas.ts";

const teamId = TeamId.make("team-1");
const member: TeamMember = {
  memberId: TeamMemberId.make("sara"),
  teamId,
  displayName: "Sara",
  role: "member",
  lastSeenAt: "2026-11-23T08:00:00.000Z",
};

const task = (title: string) => ({
  title,
  owner: "Sara",
  hours: 2,
  area: "Pages",
  folders: ["app/"],
  when: "Week 1",
});

const plan = (): PlanResult => {
  const text = written("## Steps\n\nWeek 1: pages.", {
    decisions: [{ ...decision("Server"), rule: "Use Django for the server." }],
    tasks: [task("Build the list page"), task("Build the order page")],
  });
  return {
    size: "small",
    writer: "codex",
    reviewer: "claude",
    sameProvider: false,
    plan: text,
    decisions: numberDecisions(text.decisions, "small"),
    rounds: [],
    log: [],
    stopReason: "",
    wordsBeforeShorten: 0,
  };
};

/** A team whose second new task fails, like a storage error halfway through a save. */
const teamFailingOnSecondTask = () => {
  let calls = 0;
  return Layer.mock(TeamService)({
    listTasks: () => Effect.succeed([]),
    listMembers: () => Effect.succeed([member]),
    createTask: () => {
      calls += 1;
      return calls === 1
        ? Effect.succeed({} as never)
        : Effect.fail(new TeamStorageError({ operation: "createTask", cause: "disk full" }));
    },
  });
};

const layer = PlanSaveService.layer.pipe(
  Layer.provide(
    Layer.mergeAll(
      teamFailingOnSecondTask(),
      Layer.mock(GitVcsDriver.GitVcsDriver)({
        execute: () => Effect.succeed({ stdout: "", stderr: "", exitCode: 1 } as never),
      }),
    ),
  ),
  Layer.provideMerge(NodeServices.layer),
);

describe("TeamPlanSave.save", () => {
  it.effect("puts every file back and names the task already added when a task fails", () =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const root = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-save-" });
      const own = "# Shop\n\nRun `npm test` before committing.\n";
      yield* fs.writeFileString(path.join(root, "AGENTS.md"), own);

      const planSave = yield* PlanSaveService.TeamPlanSave;
      const error = yield* Effect.flip(
        planSave.save({ teamRoot: root, teamId, member, plan: plan(), tellAgents: true }),
      );

      assert.include(error.detail, 'Could not add the task "Build the order page"');
      assert.include(error.detail, "Every file was put back as it was.");
      assert.include(error.detail, 'These tasks were already added: "Build the list page".');
      assert.strictEqual(yield* fs.readFileString(path.join(root, "AGENTS.md")), own);
      assert.isFalse(yield* fs.exists(path.join(root, "CLAUDE.md")));
      assert.isFalse(yield* fs.exists(path.join(root, ".team", "plan.md")));
    }).pipe(Effect.scoped, Effect.provide(layer)),
  );
});
