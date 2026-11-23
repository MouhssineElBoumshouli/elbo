// team-layer: the shell around planSave.ts. Reads the saved plan and what the project already has,
// shows the preview, and on save writes the files and the team tasks. The agent's team tool and the
// planning runner both call it, so the rules live in one place.
import {
  TEAM_DECISIONS_DIRECTORY_NAME,
  TEAM_DIRECTORY_NAME,
  TEAM_RULEBOOK_FILE_NAME,
  type TeamId,
  type TeamMember,
} from "@t3tools/contracts";
import * as Context from "effect/Context";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import { currentCommit } from "../../mcp/toolkits/team/memory.ts";
import * as GitVcsDriver from "../../vcs/GitVcsDriver.ts";
import { TeamService } from "../TeamService.ts";
import type { PlanResult } from "./planSchemas.ts";
import { renderPlan } from "./planRender.ts";
import { describePlanSave, PLAN_FILE, type PlanSavePreview, previewPlanSave } from "./planSave.ts";

export class TeamPlanSaveError extends Schema.TaggedError<TeamPlanSaveError>()(
  "TeamPlanSaveError",
  { detail: Schema.String },
) {
  override get message(): string {
    return this.detail;
  }
}

export interface PlanSaveTarget {
  /** The folder that holds `.team/`. */
  readonly teamRoot: string;
  readonly teamId: TeamId;
  readonly member: TeamMember;
  readonly plan: PlanResult;
}

export interface PlanSaveOutcome {
  readonly preview: PlanSavePreview;
  /** The preview as plain lines. */
  readonly text: string;
}

export class TeamPlanSave extends Context.Service<
  TeamPlanSave,
  {
    /** What a save would write; writes nothing. */
    readonly preview: (target: PlanSaveTarget) => Effect.Effect<PlanSaveOutcome, TeamPlanSaveError>;
    /** Writes the plan, its decisions and rulebook lines, and its tasks; saving again changes nothing. */
    readonly save: (target: PlanSaveTarget) => Effect.Effect<PlanSaveOutcome, TeamPlanSaveError>;
  }
>()("t3/team/planning/planSaveService/TeamPlanSave") {}

const failed = (what: string) => (cause: unknown) =>
  new TeamPlanSaveError({
    detail: `${what}: ${cause instanceof Error ? cause.message : String(cause)}`,
  });

const make = Effect.gen(function* () {
  const teams = yield* TeamService;
  const git = yield* GitVcsDriver.GitVcsDriver;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;

  const readOptional = (file: string) =>
    fs.readFileString(file).pipe(Effect.orElseSucceed(() => null));

  const preview = Effect.fn("TeamPlanSave.preview")(function* (target: PlanSaveTarget) {
    const { plan } = target;
    const team = path.join(target.teamRoot, TEAM_DIRECTORY_NAME);
    const decisionsFolder = path.join(team, TEAM_DECISIONS_DIRECTORY_NAME);
    const names = yield* fs.readDirectory(decisionsFolder).pipe(Effect.orElseSucceed(() => []));
    const decisions = yield* Effect.forEach(
      names.filter((name) => name.toLowerCase().endsWith(".md")).toSorted(),
      (fileName) =>
        readOptional(path.join(decisionsFolder, fileName)).pipe(
          Effect.map((raw) => (raw === null ? [] : [{ fileName, raw }])),
        ),
    );
    const tasks = yield* teams
      .listTasks(target.teamId)
      .pipe(Effect.mapError(failed("Could not read the team's tasks")));
    const members = yield* teams
      .listMembers(target.teamId)
      .pipe(Effect.mapError(failed("Could not read the team's members")));
    const result = previewPlanSave({
      plan,
      planText: renderPlan(plan.plan, plan.decisions),
      existingPlanText: yield* readOptional(path.join(target.teamRoot, PLAN_FILE)),
      rulebook: yield* readOptional(path.join(team, TEAM_RULEBOOK_FILE_NAME)),
      decisions: decisions.flat(),
      tasks,
      members,
      author: target.member.displayName,
      date: DateTime.formatIsoDateUtc(yield* DateTime.now),
      commit: (yield* currentCommit(git, target.teamRoot)) ?? "",
    });
    return { preview: result, text: describePlanSave(result) };
  });

  const save = Effect.fn("TeamPlanSave.save")(function* (target: PlanSaveTarget) {
    const outcome = yield* preview(target);
    for (const file of outcome.preview.files) {
      if (file.status === "unchanged") continue;
      const full = path.join(target.teamRoot, file.path);
      yield* fs
        .makeDirectory(path.dirname(full), { recursive: true })
        .pipe(
          Effect.andThen(fs.writeFileString(full, file.content)),
          Effect.mapError(failed(`Could not write ${file.path}`)),
        );
    }
    for (const task of outcome.preview.tasks) {
      if (task.action === "create") {
        yield* teams
          .createTask({
            teamId: target.teamId,
            actorMemberId: target.member.memberId,
            title: task.title,
            paths: task.paths,
            note: task.note,
            ...(task.ownerMemberId === null ? {} : { ownerMemberId: task.ownerMemberId }),
          })
          .pipe(Effect.mapError(failed(`Could not add the task "${task.title}"`)));
      } else if (task.action === "update" && task.taskId !== null) {
        yield* teams
          .updateTask({
            teamId: target.teamId,
            taskId: task.taskId,
            actorMemberId: target.member.memberId,
            note: task.note,
            ownerMemberId: task.ownerMemberId,
          })
          .pipe(Effect.mapError(failed(`Could not update the task "${task.title}"`)));
      }
    }
    return outcome;
  });

  return TeamPlanSave.of({ preview, save });
});

export const layer = Layer.effect(TeamPlanSave, make);
