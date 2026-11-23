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
import { AGENTS_FILE, CLAUDE_FILE } from "./planAgentFiles.ts";
import {
  describePlanSave,
  PLAN_FILE,
  type PlanSavePreview,
  planSaveProblems,
  previewPlanSave,
} from "./planSave.ts";

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
  /** Also write Elbo's section in AGENTS.md and the import in CLAUDE.md. */
  readonly tellAgents: boolean;
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
    /**
     * Writes the plan, its decisions, rule lines and tasks, all or nothing: everything is checked
     * first, and a write that still fails puts the files back and names any tasks already added
     * (tasks can't be deleted). Saving again changes nothing.
     */
    readonly save: (target: PlanSaveTarget) => Effect.Effect<PlanSaveOutcome, TeamPlanSaveError>;
  }
>()("t3/team/planning/planSaveService/TeamPlanSave") {}

const failed = (what: string) => (cause: unknown) =>
  new TeamPlanSaveError({
    detail: `${what}: ${cause instanceof Error ? cause.message : String(cause)}`,
  });

interface Written {
  readonly full: string;
  readonly file: string;
  /** null: the file did not exist, so undoing removes it. */
  readonly before: string | null;
}

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
      agentFiles: target.tellAgents
        ? {
            agents: yield* readOptional(path.join(target.teamRoot, AGENTS_FILE)),
            claude: yield* readOptional(path.join(target.teamRoot, CLAUDE_FILE)),
          }
        : null,
    });
    return { preview: result, text: describePlanSave(result) };
  });

  /** Puts every written file back as it was; returns the ones that could not be. */
  const undoFiles = (written: ReadonlyArray<Written>) =>
    Effect.forEach(written.toReversed(), ({ full, file, before }) =>
      (before === null ? fs.remove(full) : fs.writeFileString(full, before)).pipe(
        Effect.as<ReadonlyArray<string>>([]),
        Effect.orElseSucceed(() => [file]),
      ),
    ).pipe(Effect.map((left) => left.flat()));

  const save = Effect.fn("TeamPlanSave.save")(function* (target: PlanSaveTarget) {
    const outcome = yield* preview(target);
    // Everything is checked first, so a bad path never leaves a half-saved plan.
    const problems = planSaveProblems(outcome.preview);
    if (problems.length > 0) {
      return yield* new TeamPlanSaveError({
        detail: `Nothing was saved. ${problems.join(" ")}`,
      });
    }
    const written: Array<Written> = [];
    const added: string[] = [];
    const stopped = (what: string) => (cause: unknown) =>
      Effect.gen(function* () {
        const left = yield* undoFiles(written);
        const files =
          left.length === 0
            ? "Every file was put back as it was."
            : `These files could not be put back: ${left.join(", ")}.`;
        const tasks =
          added.length === 0
            ? ""
            : ` These tasks were already added: ${added.map((title) => `"${title}"`).join(", ")}.`;
        return yield* new TeamPlanSaveError({
          detail: `${failed(what)(cause).detail} ${files}${tasks}`,
        });
      });

    for (const file of outcome.preview.files) {
      if (file.status === "unchanged") continue;
      const full = path.join(target.teamRoot, file.path);
      const before = yield* readOptional(full);
      yield* fs.makeDirectory(path.dirname(full), { recursive: true }).pipe(
        Effect.andThen(fs.writeFileString(full, file.content)),
        Effect.tap(() => Effect.sync(() => written.push({ full, file: file.path, before }))),
        Effect.catch(stopped(`Could not write ${file.path}`)),
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
          .pipe(
            Effect.tap(() => Effect.sync(() => added.push(task.title))),
            Effect.catch(stopped(`Could not add the task "${task.title}"`)),
          );
      } else if (task.action === "update" && task.taskId !== null) {
        yield* teams
          .updateTask({
            teamId: target.teamId,
            taskId: task.taskId,
            actorMemberId: target.member.memberId,
            note: task.note,
            ownerMemberId: task.ownerMemberId,
          })
          .pipe(
            Effect.tap(() => Effect.sync(() => added.push(`${task.title} (updated)`))),
            Effect.catch(stopped(`Could not update the task "${task.title}"`)),
          );
      }
    }
    return outcome;
  });

  return TeamPlanSave.of({ preview, save });
});

export const layer = Layer.effect(TeamPlanSave, make);
