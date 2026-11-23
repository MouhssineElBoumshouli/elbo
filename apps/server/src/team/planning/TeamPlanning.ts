// team-layer: planning a project from the app (team/PLANNING_FEATURE_PLAN.md slices 4 and 5). Runs
// the writer + review method on the person's connected AIs, publishes each run's progress for the
// plan page, stops a run by interrupting its turns, answers the team on each decision, and saves a
// finished plan into the project once every decision is settled.
import {
  EnvironmentId,
  type ProjectId,
  type TeamPlanDecideInput,
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
import type { PlanBrief } from "./planBrief.ts";
import { agreed, openDecisions, withDecision } from "./planChallenge.ts";
import { readPlanFile } from "./planFiles.ts";
import { fixtureAsk, replayFixture } from "./planFixtureRun.ts";
import { type Ask, runMethod, type StepRequest } from "./planMethod.ts";
import { askFromRunner } from "./planProvider.ts";
import { answerDecision } from "./planPushBack.ts";
import {
  changed,
  type PlanSeat,
  pickPlanSeats,
  planView,
  savePreviewView,
  stepOf,
} from "./planRun.ts";
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
    /** Agree, pick another option, or push back; a pick or push-back waits for the writer. */
    readonly decide: (
      input: TeamPlanDecideInput,
    ) => Effect.Effect<TeamPlanRunState, TeamPlanningError>;
  }
>()("t3/team/planning/TeamPlanning") {}

interface Run {
  readonly projectId: ProjectId;
  readonly brief: PlanBrief;
  readonly writer: PlanSeat;
  readonly state: SubscriptionRef.SubscriptionRef<TeamPlanRunState>;
  fiber: Fiber.Fiber<unknown, unknown> | null;
  result: PlanResult | null;
  /** The writer's turn on one decision; one at a time, since two could rewrite the same part. */
  answering: Fiber.Fiber<unknown, unknown> | null;
}

/** Finished runs kept for the plan page and saving; older ones go first. */
const KEPT_RUNS = 20;

const errorText = (error: unknown) =>
  String((error as { message?: unknown } | null)?.message ?? error);

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
    return askFromRunner({ ...seat, run: instance.textGeneration.run, cwd });
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
      answering: null,
      version: 0,
    });
    const run: Run = {
      projectId: input.projectId,
      brief: input.brief,
      writer: seats.writer,
      state,
      fiber: null,
      result: null,
      answering: null,
    };
    runs.set(runId, run);
    for (const old of [...runs.keys()].slice(0, Math.max(0, runs.size - KEPT_RUNS))) {
      runs.delete(old);
    }

    const update = (step: string, points?: number) =>
      SubscriptionRef.update(
        state,
        changed(() => ({ ...stepOf(step), points: points ?? 0 })),
      );
    const tracked =
      (ask: Ask<TextGenerationError>): Ask<TextGenerationError> =>
      <S extends Schema.Top>(request: StepRequest<S>) =>
        update(request.step, request.points).pipe(Effect.andThen(ask(request)));

    const work = Option.isSome(fixture)
      ? replayFixture(
          readPlanFile(fixture.value).pipe(Effect.provide(fileContext), Effect.orDie),
          update,
        )
      : Effect.scoped(
          Effect.gen(function* () {
            // Outside any repo, so the provider reads no project's CLAUDE.md or AGENTS.md.
            const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-" });
            const write = (yield* askFor(seats.writer, cwd)).ask;
            const review = (yield* askFor(seats.reviewer, cwd)).ask;
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
          return SubscriptionRef.update(
            state,
            changed(() => ({ status: "done" as const, step: null, view: planView(exit.value) })),
          );
        }
        const stopped = Exit.hasInterrupts(exit) && Exit.findErrorOption(exit)._tag === "None";
        const error = Exit.findErrorOption(exit);
        return SubscriptionRef.update(
          state,
          changed((current) => ({
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
          })),
        );
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
            Stream.takeUntil((state) => state.status !== "running" && state.answering === null),
          ),
        ),
      ),
    );

  const stop = Effect.fn("TeamPlanning.stop")(function* (input: TeamPlanRunInput) {
    const run = yield* runOf(input.runId);
    if (run.fiber !== null) yield* Fiber.interrupt(run.fiber);
    return {};
  });

  const teamOf = Effect.fn("TeamPlanning.teamOf")(function* (run: Run) {
    const project = yield* projectOf(run.projectId);
    return yield* openProjectTeam({
      workingFolder: project.workspaceRoot,
      projectRoot: project.workspaceRoot,
      projectName: project.title,
      // Planning acts for no chat; claims are not touched.
      thread: { environmentId: EnvironmentId.make("plan"), threadId: ThreadId.make("plan") },
    }).pipe(
      Effect.provideService(TeamService, teams),
      Effect.provide(fileContext),
      Effect.mapError((error) => fail(error.message)),
    );
  });

  const saveTarget = Effect.fn("TeamPlanning.saveTarget")(function* (input: TeamPlanRunInput) {
    const run = yield* runOf(input.runId);
    if (run.result === null) return yield* fail("This plan is not finished yet.");
    const open = openDecisions(run.result.decisions).length;
    if (open > 0) {
      return yield* fail(
        `${open === 1 ? "1 decision still needs" : `${open} decisions still need`} your answer.`,
      );
    }
    const opened = yield* teamOf(run);
    if (opened._tag === "NotInTeam") return yield* fail(opened.result.message);
    return {
      teamRoot: opened.context.teamRoot,
      teamId: opened.context.teamFile.teamId,
      member: opened.context.member,
      plan: run.result,
    };
  });

  const previewSave = Effect.fn("TeamPlanning.previewSave")(function* (input: TeamPlanRunInput) {
    const target = yield* saveTarget(input);
    const outcome = yield* planSave.preview(target).pipe(Effect.mapError((e) => fail(e.detail)));
    return savePreviewView(target.teamRoot, false, outcome.preview);
  });

  const save = Effect.fn("TeamPlanning.save")(function* (input: TeamPlanRunInput) {
    const target = yield* saveTarget(input);
    const outcome = yield* planSave.save(target).pipe(Effect.mapError((e) => fail(e.detail)));
    return savePreviewView(target.teamRoot, true, outcome.preview);
  });

  const showResult = (run: Run, result: PlanResult) => {
    run.result = result;
    return SubscriptionRef.updateAndGet(
      run.state,
      changed(() => ({ view: planView(result), answering: null })),
    );
  };

  const decide = Effect.fn("TeamPlanning.decide")(function* (input: TeamPlanDecideInput) {
    const run = yield* runOf(input.runId);
    const result = run.result;
    const record = result?.decisions.find((candidate) => candidate.number === input.number);
    if (result == null || record === undefined) {
      return yield* fail("This decision is not in a finished plan.");
    }
    const { ask } = input;
    if (ask.kind === "agree") return yield* showResult(run, withDecision(result, agreed(record)));
    if (run.answering !== null) {
      return yield* fail("Wait for the answer on the other decision first.");
    }
    if (
      ask.kind === "pick" &&
      (!record.decision.options.includes(ask.option) || ask.option === record.decision.picked)
    ) {
      return yield* fail("Pick one of the other options the plan looked at.");
    }
    const opened = yield* teamOf(run).pipe(Effect.orElseSucceed(() => null));
    const by = opened?._tag === "InTeam" ? opened.context.member.displayName : "You";
    const answer = (askWriter: Ask<TextGenerationError>) =>
      answerDecision({
        brief: run.brief,
        result,
        number: record.number,
        ask: ask.kind === "pick" ? ask : { kind: "push-back", message: ask.message.trim() },
        by,
        writer: run.writer.agent.name,
        askWriter,
      });
    const work = Option.isSome(fixture)
      ? answer(fixtureAsk(result, record))
      : Effect.scoped(
          Effect.gen(function* () {
            const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-" });
            const writer = yield* askFor(run.writer, cwd);
            const answered = yield* answer(writer.ask);
            yield* Effect.logInfo("planning: decision answered", {
              number: record.number,
              kind: ask.kind,
              sentParts: answered.sent.parts.length,
              sentTasks: answered.sent.tasks.length,
              usage: writer.usage,
            });
            return answered;
          }),
        );
    yield* SubscriptionRef.update(
      run.state,
      changed(() => ({ answering: { number: record.number, kind: ask.kind } })),
    );
    // In the layer's scope, so a reload or a dropped connection doesn't lose the answer.
    const fiber = yield* work.pipe(
      Effect.onExit((exit) => {
        run.answering = null;
        return Exit.isSuccess(exit)
          ? showResult(run, exit.value.result)
          : SubscriptionRef.update(
              run.state,
              changed(() => ({ answering: null })),
            );
      }),
      Effect.forkIn(scope),
    );
    run.answering = fiber;
    yield* Fiber.join(fiber).pipe(Effect.mapError((error) => fail(errorText(error))));
    return yield* SubscriptionRef.get(run.state);
  });

  return TeamPlanning.of({ start, subscribe, stop, previewSave, save, decide });
});

export const layer = Layer.effect(TeamPlanning, make);
