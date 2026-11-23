// team-layer: planning a project from the app (team/PLANNING_FEATURE_PLAN.md slice 4). Runs the
// writer + review method on the person's connected AIs, publishes each run's progress for the plan
// page, stops a run by interrupting its turns, and saves a finished plan into the project.
import {
  EnvironmentId,
  type ProjectId,
  type TeamPlanRunInput,
  type TeamPlanRunState,
  type TeamPlanSavePreview,
  type TeamPlanStartInput,
  TeamPlanningError,
  type TextGenerationError,
  ThreadId,
} from "@t3tools/contracts";
import type * as Schema from "effect/Schema";
import type * as TextGenerationOperations from "@t3tools/provider-core/server/textGenerationOperations";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Exit from "effect/Exit";
import * as Fiber from "effect/Fiber";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Path from "effect/Path";
import * as Stream from "effect/Stream";
import * as SubscriptionRef from "effect/SubscriptionRef";
import * as SecureRandom from "effect/crypto/SecureRandom";

import { openProjectTeam } from "../../mcp/toolkits/team/resolve.ts";
import * as ProjectService from "../../project/ProjectService.ts";
import * as ProviderInstanceRegistry from "../../provider/ProviderInstanceRegistry.ts";
import * as ProviderRegistry from "../../provider/ProviderRegistry.ts";
import { TeamService } from "../TeamService.ts";
import { readPlanFile } from "./planFiles.ts";
import { type Ask, runMethod, type StepRequest } from "./planMethod.ts";
import { askFromRunner } from "./planProvider.ts";
import { type PlanSeat, pickPlanSeats, planView, stepOf } from "./planRun.ts";
import type { PlanSavePreview } from "./planSave.ts";
import { TeamPlanSave } from "./planSaveService.ts";
import type { PlanResult } from "./planSchemas.ts";

export class TeamPlanning extends Context.Service<
  TeamPlanning,
  {
    readonly start: (
      input: TeamPlanStartInput,
    ) => Effect.Effect<TeamPlanRunInput, TeamPlanningError>;
    /** The run's state now, then each change, ending with the finished, failed or stopped state. */
    readonly subscribe: (
      input: TeamPlanRunInput,
    ) => Stream.Stream<TeamPlanRunState, TeamPlanningError>;
    readonly stop: (input: TeamPlanRunInput) => Effect.Effect<{}, TeamPlanningError>;
    readonly previewSave: (
      input: TeamPlanRunInput,
    ) => Effect.Effect<TeamPlanSavePreview, TeamPlanningError>;
    readonly save: (
      input: TeamPlanRunInput,
    ) => Effect.Effect<TeamPlanSavePreview, TeamPlanningError>;
  }
>()("t3/team/planning/TeamPlanning") {}

interface Run {
  readonly projectId: ProjectId;
  readonly state: SubscriptionRef.SubscriptionRef<TeamPlanRunState>;
  fiber: Fiber.Fiber<unknown, unknown> | null;
  result: PlanResult | null;
}

/** Finished runs kept for the plan page and saving; older ones go first. */
const KEPT_RUNS = 20;
const FIXTURE_STEP_MS = 1_500;

const fail = (detail: string) => new TeamPlanningError({ detail });

const hasRunner = (
  generation: unknown,
): generation is { readonly run: TextGenerationOperations.Runner } =>
  typeof generation === "object" &&
  generation !== null &&
  typeof (generation as { run?: unknown }).run === "function";

const make = Effect.gen(function* () {
  const scope = yield* Effect.scope;
  const fs = yield* FileSystem.FileSystem;
  const random = yield* SecureRandom.SecureRandom;
  const projects = yield* ProjectService.ProjectService;
  const providers = yield* ProviderRegistry.ProviderRegistry;
  const instances = yield* ProviderInstanceRegistry.ProviderInstanceRegistry;
  const teams = yield* TeamService;
  const planSave = yield* TeamPlanSave;
  const fileContext = yield* Effect.context<FileSystem.FileSystem | Path.Path>();
  // Dev only: a saved plan.json replayed with short pauses, to build the screens without AI turns.
  const fixture = yield* Config.String("ELBO_PLAN_FIXTURE").pipe(Config.option);
  const runs = new Map<string, Run>();

  const runOf = (runId: string): Effect.Effect<Run, TeamPlanningError> => {
    const run = runs.get(runId);
    return run === undefined
      ? Effect.fail(fail("This plan is gone; the app was restarted. Plan it again."))
      : Effect.succeed(run);
  };

  const projectOf = (projectId: ProjectId) =>
    projects.getById(projectId).pipe(
      Effect.mapError(() => fail("Could not read the project.")),
      Effect.flatMap((project) =>
        Effect.fromOption(project).pipe(Effect.mapError(() => fail("This project was not found."))),
      ),
    );

  const askFor = Effect.fn("TeamPlanning.askFor")(function* (seat: PlanSeat, cwd: string) {
    const instance = yield* instances.getInstance(seat.instanceId);
    if (instance === undefined || !hasRunner(instance.textGeneration)) {
      return yield* fail(`${seat.agent.name} cannot write plans here.`);
    }
    return askFromRunner({ ...seat, run: instance.textGeneration.run, cwd }).ask;
  });

  const replay = Effect.fn("TeamPlanning.replay")(function* (
    file: string,
    update: (step: string, points?: number) => Effect.Effect<void>,
  ) {
    for (const [step, points] of [["write"], ["review:1"], ["fix:1", 2]] as const) {
      yield* update(step, points);
      yield* Effect.sleep(FIXTURE_STEP_MS);
    }
    return yield* readPlanFile(file).pipe(Effect.provide(fileContext), Effect.orDie);
  });

  const start = Effect.fn("TeamPlanning.start")(function* (input: TeamPlanStartInput) {
    yield* projectOf(input.projectId);
    const seats = pickPlanSeats(yield* providers.getProviders);
    if (seats === null) {
      return yield* fail("Connect Codex or Claude first: open Setup and sign in to one of them.");
    }
    const runId = yield* random.uuidV4();
    const state = yield* SubscriptionRef.make<TeamPlanRunState>({
      runId,
      projectId: input.projectId,
      status: "running",
      step: "writing",
      round: 0,
      points: 0,
      writer: seats.writer.agent,
      reviewer: seats.reviewer.agent,
      sameProvider: seats.sameProvider,
      view: null,
      error: null,
    });
    const run: Run = { projectId: input.projectId, state, fiber: null, result: null };
    runs.set(runId, run);
    for (const old of [...runs.keys()].slice(0, Math.max(0, runs.size - KEPT_RUNS))) {
      runs.delete(old);
    }

    const update = (step: string, points?: number) =>
      SubscriptionRef.update(state, (current) => ({
        ...current,
        ...stepOf(step),
        points: points ?? 0,
      }));
    const tracked =
      (ask: Ask<TextGenerationError>): Ask<TextGenerationError> =>
      <S extends Schema.Top>(request: StepRequest<S>) =>
        update(request.step, request.points).pipe(Effect.andThen(ask(request)));

    const work = Option.isSome(fixture)
      ? replay(fixture.value, update)
      : Effect.scoped(
          Effect.gen(function* () {
            // Outside any repo, so the provider reads no project's CLAUDE.md or AGENTS.md.
            const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-" });
            const write = yield* askFor(seats.writer, cwd);
            const review = yield* askFor(seats.reviewer, cwd);
            return yield* runMethod({
              brief: input.brief,
              size: input.size,
              write: tracked(write),
              review: tracked(review),
              writer: `${seats.writer.agent.name} ${seats.writer.model}`,
              reviewer: `${seats.reviewer.agent.name} ${seats.reviewer.model}`,
              sameProvider: seats.sameProvider,
            });
          }),
        );

    run.fiber = yield* work.pipe(
      Effect.onExit((exit) => {
        if (Exit.isSuccess(exit)) {
          run.result = exit.value;
          return SubscriptionRef.update(state, (current) => ({
            ...current,
            status: "done" as const,
            step: null,
            view: planView(exit.value),
          }));
        }
        const stopped = Exit.hasInterrupts(exit) && Exit.findErrorOption(exit)._tag === "None";
        const error = Exit.findErrorOption(exit);
        return SubscriptionRef.update(state, (current) => ({
          ...current,
          status: stopped ? ("stopped" as const) : ("failed" as const),
          step: null,
          error: stopped
            ? null
            : {
                message: Option.isSome(error)
                  ? String((error.value as { message?: unknown }).message ?? error.value)
                  : "The plan could not be written.",
                failureClass: null,
                code: null,
                driver:
                  current.step === "reviewing" ? current.reviewer.driver : current.writer.driver,
              },
        }));
      }),
      Effect.forkIn(scope),
    );
    return { runId };
  });

  const subscribe = (input: TeamPlanRunInput) =>
    Stream.unwrap(
      runOf(input.runId).pipe(
        Effect.map((run) =>
          SubscriptionRef.changes(run.state).pipe(
            Stream.takeUntil((state) => state.status !== "running"),
          ),
        ),
      ),
    );

  const stop = Effect.fn("TeamPlanning.stop")(function* (input: TeamPlanRunInput) {
    const run = yield* runOf(input.runId);
    if (run.fiber !== null) yield* Fiber.interrupt(run.fiber);
    return {};
  });

  const saveTarget = Effect.fn("TeamPlanning.saveTarget")(function* (input: TeamPlanRunInput) {
    const run = yield* runOf(input.runId);
    if (run.result === null) return yield* fail("This plan is not finished yet.");
    const project = yield* projectOf(run.projectId);
    const opened = yield* openProjectTeam({
      workingFolder: project.workspaceRoot,
      projectRoot: project.workspaceRoot,
      projectName: project.title,
      // Saving acts for no chat; claims are not touched.
      thread: { environmentId: EnvironmentId.make("plan"), threadId: ThreadId.make("plan") },
    }).pipe(
      Effect.provideService(TeamService, teams),
      Effect.provide(fileContext),
      Effect.mapError((error) => fail(error.message)),
    );
    if (opened._tag === "NotInTeam") return yield* fail(opened.result.message);
    return {
      teamRoot: opened.context.teamRoot,
      teamId: opened.context.teamFile.teamId,
      member: opened.context.member,
      plan: run.result,
    };
  });

  const shown = (
    folder: string,
    saved: boolean,
    preview: PlanSavePreview,
  ): TeamPlanSavePreview => ({
    folder,
    saved,
    files: preview.files.map(({ path: file, status, detail }) => ({ path: file, status, detail })),
    rules: preview.rules,
    tasks: preview.tasks.map(({ action, title, owner, paths, note }) => ({
      action,
      title,
      owner,
      paths,
      note,
    })),
  });

  const previewSave = Effect.fn("TeamPlanning.previewSave")(function* (input: TeamPlanRunInput) {
    const target = yield* saveTarget(input);
    const outcome = yield* planSave.preview(target).pipe(Effect.mapError((e) => fail(e.detail)));
    return shown(target.teamRoot, false, outcome.preview);
  });

  const save = Effect.fn("TeamPlanning.save")(function* (input: TeamPlanRunInput) {
    const target = yield* saveTarget(input);
    const outcome = yield* planSave.save(target).pipe(Effect.mapError((e) => fail(e.detail)));
    return shown(target.teamRoot, true, outcome.preview);
  });

  return TeamPlanning.of({ start, subscribe, stop, previewSave, save });
});

export const layer = Layer.effect(TeamPlanning, make);
