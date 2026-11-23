// team-layer: planning a project from the app (team/PLANNING_FEATURE_PLAN.md slices 4 and 5). Runs
// the writer + review method on the person's connected AIs, publishes each run's progress for the
// plan page, answers the team on each decision, and saves a finished plan once every decision is
// settled. Every run is kept in Elbo's data folder (planRunStore.ts), so a restart loses nothing.
import {
  EnvironmentId,
  type ProjectId,
  type TeamPlanDecideInput,
  type TeamPlanLatestInput,
  type TeamPlanRunInput,
  type TeamPlanRunState,
  type TeamPlanSaveInput,
  type TeamPlanSavePreview,
  type TeamPlanStartInput,
  TeamPlanningError,
  ThreadId,
} from "@t3tools/contracts";
import * as Context from "effect/Context";
import * as DateTime from "effect/DateTime";
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

import * as ServerConfig from "../../config.ts";
import { openProjectTeam } from "../../mcp/toolkits/team/resolve.ts";
import * as ProjectService from "../../project/ProjectService.ts";
import * as ProviderRegistry from "../../provider/ProviderRegistry.ts";
import { TeamService } from "../TeamService.ts";
import {
  AGENTS_FILE,
  CLAUDE_FILE,
  ownInstructionLines,
  projectRulesForBrief,
} from "./planAgentFiles.ts";
import { agreed, type DecisionAsk, openDecisions, withDecision } from "./planChallenge.ts";
import { pickPlanSeats, planView, savePreviewView, stepOf } from "./planRun.ts";
import { KEPT_RUNS, makePlanRuns, type Run } from "./planRuns.ts";
import { TeamPlanSave } from "./planSaveService.ts";
import { makePlanTurns } from "./planTurns.ts";

export class TeamPlanning extends Context.Service<
  TeamPlanning,
  {
    readonly start: (
      input: TeamPlanStartInput,
    ) => Effect.Effect<TeamPlanRunInput, TeamPlanningError>;
    /** The run's state now, then each change, ending when nothing is running. */
    readonly subscribe: (
      input: TeamPlanRunInput,
    ) => Stream.Stream<TeamPlanRunState, TeamPlanningError>;
    readonly stop: (input: TeamPlanRunInput) => Effect.Effect<{}, TeamPlanningError>;
    readonly previewSave: (
      input: TeamPlanSaveInput,
    ) => Effect.Effect<TeamPlanSavePreview, TeamPlanningError>;
    readonly save: (
      input: TeamPlanSaveInput,
    ) => Effect.Effect<TeamPlanSavePreview, TeamPlanningError>;
    /** Agree, pick another option, or push back; a pick or push-back waits for the writer. */
    readonly decide: (
      input: TeamPlanDecideInput,
    ) => Effect.Effect<TeamPlanRunState, TeamPlanningError>;
    /** Starts again what a restart cut off: the writing, or the answer on one decision. */
    readonly retry: (input: TeamPlanRunInput) => Effect.Effect<TeamPlanRunState, TeamPlanningError>;
    readonly latest: (
      input: TeamPlanLatestInput,
    ) => Effect.Effect<{ readonly runId: string | null }, TeamPlanningError>;
  }
>()("t3/team/planning/TeamPlanning") {}

const errorText = (error: unknown) =>
  String((error as { message?: unknown } | null)?.message ?? error);

const fail = (detail: string) => new TeamPlanningError({ detail });

const make = Effect.gen(function* () {
  const scope = yield* Effect.scope;
  const random = yield* SecureRandom.SecureRandom;
  const projects = yield* ProjectService.ProjectService;
  const providers = yield* ProviderRegistry.ProviderRegistry;
  const teams = yield* TeamService;
  const planSave = yield* TeamPlanSave;
  const config = yield* ServerConfig.ServerConfig;
  const path = yield* Path.Path;
  const fileContext = yield* Effect.context<FileSystem.FileSystem | Path.Path>();
  const turns = yield* makePlanTurns;
  const { runs, persist, setState, remember } = yield* makePlanRuns(
    path.join(config.stateDir, "planning"),
  );

  const runOf = (runId: string): Effect.Effect<Run, TeamPlanningError> => {
    const run = runs.get(runId);
    return run === undefined
      ? Effect.fail(
          fail(`This plan is gone: only the ${KEPT_RUNS} newest plans are kept. Plan it again.`),
        )
      : Effect.succeed(run);
  };

  const projectOf = (projectId: ProjectId) =>
    projects.getById(projectId).pipe(
      Effect.mapError(() => fail("Could not read the project.")),
      Effect.flatMap((project) =>
        Effect.fromOption(project).pipe(Effect.mapError(() => fail("This project was not found."))),
      ),
    );

  /** Writes the plan in the background; the run's state tells the page how far it got. */
  const launch = Effect.fn("TeamPlanning.launch")(function* (run: Run) {
    const update = (step: string, points?: number) =>
      setState(run, () => ({ ...stepOf(step), points: points ?? 0 })).pipe(Effect.asVoid);
    const { sameProvider } = yield* SubscriptionRef.get(run.state);
    run.fiber = yield* turns.writePlan({ ...run, sameProvider, update }).pipe(
      Effect.onExit((exit) => {
        if (Exit.isSuccess(exit)) {
          run.result = exit.value;
          return setState(run, () => ({
            status: "done" as const,
            step: null,
            view: planView(exit.value),
          }));
        }
        const error = Exit.findErrorOption(exit);
        const stopped = Exit.hasInterrupts(exit) && Option.isNone(error);
        // Shutting down (an update or a restart): keep "running" on disk, so the run comes back
        // as interrupted with Try again instead of looking stopped by the person.
        if (stopped && !run.stopRequested) return Effect.void;
        return setState(run, (current) => ({
          status: stopped ? ("stopped" as const) : ("failed" as const),
          step: null,
          error: stopped
            ? null
            : {
                message: Option.isSome(error)
                  ? errorText(error.value)
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
  });

  /** The project's own AGENTS.md / CLAUDE.md lines: the plan is written to follow them. */
  const projectRulesOf = Effect.fn("TeamPlanning.projectRulesOf")(function* (root: string) {
    const fs = yield* FileSystem.FileSystem;
    const read = (file: string) =>
      fs.readFileString(path.join(root, file)).pipe(Effect.orElseSucceed(() => null));
    return projectRulesForBrief(
      ownInstructionLines([yield* read(AGENTS_FILE), yield* read(CLAUDE_FILE)]),
    );
  }, Effect.provide(fileContext));

  const start = Effect.fn("TeamPlanning.start")(function* (input: TeamPlanStartInput) {
    const project = yield* projectOf(input.projectId);
    const projectRules = yield* projectRulesOf(project.workspaceRoot);
    const brief = projectRules.length > 0 ? { ...input.brief, projectRules } : input.brief;
    const seats = pickPlanSeats(yield* providers.getProviders);
    if (seats === null) {
      return yield* fail("Connect Codex or Claude first: open Setup and sign in to one of them.");
    }
    const runId = yield* random.uuidV4();
    const run: Run = {
      runId,
      brief,
      size: input.size,
      writer: seats.writer,
      reviewer: seats.reviewer,
      state: yield* SubscriptionRef.make<TeamPlanRunState>({
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
        interrupted: null,
        answers: input.answers,
      }),
      result: null,
      pending: null,
      saved: false,
      updatedAt: DateTime.formatIso(yield* DateTime.now),
      fiber: null,
      stopRequested: false,
      answering: null,
    };
    yield* remember(run);
    yield* persist(run);
    yield* launch(run);
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
    run.stopRequested = true;
    if (run.fiber !== null) yield* Fiber.interrupt(run.fiber);
    return {};
  });

  const teamOf = Effect.fn("TeamPlanning.teamOf")(function* (projectId: ProjectId) {
    const project = yield* projectOf(projectId);
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

  const saveTarget = Effect.fn("TeamPlanning.saveTarget")(function* (input: TeamPlanSaveInput) {
    const run = yield* runOf(input.runId);
    if (run.result === null) return yield* fail("This plan is not finished yet.");
    const open = openDecisions(run.result.decisions).length;
    if (open > 0) {
      return yield* fail(
        `${open === 1 ? "1 decision still needs" : `${open} decisions still need`} your answer.`,
      );
    }
    const opened = yield* teamOf((yield* SubscriptionRef.get(run.state)).projectId);
    if (opened._tag === "NotInTeam") return yield* fail(opened.result.message);
    return {
      run,
      target: {
        teamRoot: opened.context.teamRoot,
        teamId: opened.context.teamFile.teamId,
        member: opened.context.member,
        plan: run.result,
        tellAgents: input.tellAgents,
      },
    };
  });

  const previewSave = Effect.fn("TeamPlanning.previewSave")(function* (input: TeamPlanSaveInput) {
    const { target } = yield* saveTarget(input);
    const outcome = yield* planSave.preview(target).pipe(Effect.mapError((e) => fail(e.detail)));
    return savePreviewView(target.teamRoot, false, outcome.preview);
  });

  const save = Effect.fn("TeamPlanning.save")(function* (input: TeamPlanSaveInput) {
    const { run, target } = yield* saveTarget(input);
    const outcome = yield* planSave.save(target).pipe(Effect.mapError((e) => fail(e.detail)));
    run.saved = true;
    yield* persist(run);
    return savePreviewView(target.teamRoot, true, outcome.preview);
  });

  /** The writer's answer on one decision, kept even if the page that asked goes away. */
  const answerOn = Effect.fn("TeamPlanning.answerOn")(function* (
    run: Run,
    number: string,
    ask: DecisionAsk,
  ) {
    const result = run.result;
    const record = result?.decisions.find((candidate) => candidate.number === number);
    if (result == null || record === undefined) {
      return yield* fail("This decision is not in a finished plan.");
    }
    if (run.answering !== null) {
      return yield* fail("Wait for the answer on the other decision first.");
    }
    const projectId = (yield* SubscriptionRef.get(run.state)).projectId;
    const opened = yield* teamOf(projectId).pipe(Effect.orElseSucceed(() => null));
    run.pending = { number, ask };
    yield* setState(run, () => ({ answering: { number, kind: ask.kind }, interrupted: null }));
    // In the layer's scope, so a reload or a dropped connection doesn't lose the answer.
    const fiber = yield* turns
      .answer({
        brief: run.brief,
        result,
        record,
        ask,
        by: opened?._tag === "InTeam" ? opened.context.member.displayName : "You",
        writer: run.writer,
      })
      .pipe(
        Effect.onExit((exit) => {
          run.answering = null;
          // Shutting down: keep the pending answer on disk, so it comes back with Try again.
          if (Exit.isFailure(exit) && Exit.hasInterrupts(exit)) return Effect.void;
          run.pending = null;
          if (Exit.isFailure(exit)) return setState(run, () => ({ answering: null }));
          run.result = exit.value.result;
          return setState(run, () => ({ view: planView(exit.value.result), answering: null }));
        }),
        Effect.forkIn(scope),
      );
    run.answering = fiber;
    yield* Fiber.join(fiber).pipe(Effect.mapError((error) => fail(errorText(error))));
    return yield* SubscriptionRef.get(run.state);
  });

  const decide = Effect.fn("TeamPlanning.decide")(function* (input: TeamPlanDecideInput) {
    const run = yield* runOf(input.runId);
    const result = run.result;
    const { ask } = input;
    const record = result?.decisions.find((candidate) => candidate.number === input.number);
    if (result == null || record === undefined) {
      return yield* fail("This decision is not in a finished plan.");
    }
    if (ask.kind === "agree") {
      const next = withDecision(result, agreed(record));
      run.result = next;
      return yield* setState(run, () => ({ view: planView(next) }));
    }
    if (
      ask.kind === "pick" &&
      (!record.decision.options.includes(ask.option) || ask.option === record.decision.picked)
    ) {
      return yield* fail("Pick one of the other options the plan looked at.");
    }
    return yield* answerOn(
      run,
      record.number,
      ask.kind === "pick" ? ask : { kind: "push-back", message: ask.message.trim() },
    );
  });

  const retry = Effect.fn("TeamPlanning.retry")(function* (input: TeamPlanRunInput) {
    const run = yield* runOf(input.runId);
    const { interrupted } = yield* SubscriptionRef.get(run.state);
    if (interrupted?.kind === "decision" && run.pending !== null) {
      return yield* answerOn(run, run.pending.number, run.pending.ask);
    }
    if (interrupted?.kind !== "run") return yield* fail("Nothing here was interrupted.");
    run.stopRequested = false;
    yield* setState(run, () => ({
      status: "running" as const,
      step: "writing" as const,
      error: null,
      view: null,
      interrupted: null,
    }));
    yield* launch(run);
    return yield* SubscriptionRef.get(run.state);
  });

  const latest = Effect.fn("TeamPlanning.latest")(function* (input: TeamPlanLatestInput) {
    const own = yield* Effect.forEach([...runs.values()], (run) =>
      SubscriptionRef.get(run.state).pipe(
        Effect.map((state) => (state.projectId === input.projectId && !run.saved ? [run] : [])),
      ),
    );
    const newest = own.flat().toSorted((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    return { runId: newest?.runId ?? null };
  });

  return TeamPlanning.of({ start, subscribe, stop, previewSave, save, decide, retry, latest });
});

export const layer = Layer.effect(TeamPlanning, make);
