// team-layer: how a plan's AI turns run in the app: on the person's provider instances, in an empty
// folder, or replayed from ELBO_PLAN_FIXTURE in dev. TeamPlanning.ts decides when they run.
import { TeamPlanningError, type TextGenerationError } from "@t3tools/contracts";
import type * as TextGenerationOperations from "@t3tools/provider-core/server/textGenerationOperations";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Option from "effect/Option";
import type * as Path from "effect/Path";
import type * as Schema from "effect/Schema";

import * as ProviderInstanceRegistry from "../../provider/ProviderInstanceRegistry.ts";
import type { PlanBrief } from "./planBrief.ts";
import type { DecisionAsk } from "./planChallenge.ts";
import { readPlanFile } from "./planFiles.ts";
import { fixtureAsk, replayFixture } from "./planFixtureRun.ts";
import type { PlanSize } from "./planLimits.ts";
import { type Ask, runMethod, type StepRequest } from "./planMethod.ts";
import { askFromRunner } from "./planProvider.ts";
import { answerDecision } from "./planPushBack.ts";
import type { PlanSeat } from "./planRun.ts";
import type { DecisionRecord, PlanResult } from "./planSchemas.ts";

const hasRunner = (
  generation: unknown,
): generation is { readonly run: TextGenerationOperations.Runner } =>
  typeof generation === "object" &&
  generation !== null &&
  typeof (generation as { run?: unknown }).run === "function";

export const makePlanTurns = Effect.gen(function* () {
  const fs = yield* FileSystem.FileSystem;
  const instances = yield* ProviderInstanceRegistry.ProviderInstanceRegistry;
  const fileContext = yield* Effect.context<FileSystem.FileSystem | Path.Path>();
  // Dev only: a saved plan.json replayed with short pauses, to build the screens without AI turns.
  const fixture = yield* Config.String("ELBO_PLAN_FIXTURE").pipe(Config.option);
  // Long enough steps let a manual test restart the server mid-run.
  const fixtureStepMs = yield* Config.Number("ELBO_PLAN_FIXTURE_STEP_MS").pipe(
    Config.withDefault(1_500),
  );

  const askFor = Effect.fn("TeamPlanning.askFor")(function* (seat: PlanSeat, cwd: string) {
    const instance = yield* instances.getInstance(seat.instanceId);
    if (instance === undefined || !hasRunner(instance.textGeneration)) {
      return yield* new TeamPlanningError({
        detail: `${seat.agent.name} cannot write plans here.`,
      });
    }
    return askFromRunner({ ...seat, run: instance.textGeneration.run, cwd });
  });

  // Outside any repo, so the provider reads no project's CLAUDE.md or AGENTS.md.
  const inEmptyFolder = <A, E, R>(use: (cwd: string) => Effect.Effect<A, E, R>) =>
    Effect.scoped(
      fs.makeTempDirectoryScoped({ prefix: "elbo-plan-" }).pipe(Effect.orDie, Effect.flatMap(use)),
    );

  /** Writes and reviews a plan; `update` hears each step for the progress line. */
  const writePlan = (input: {
    readonly brief: PlanBrief;
    readonly size: PlanSize;
    readonly writer: PlanSeat;
    readonly reviewer: PlanSeat;
    readonly sameProvider: boolean;
    readonly update: (step: string, points?: number) => Effect.Effect<void>;
  }) => {
    if (Option.isSome(fixture)) {
      return replayFixture(
        readPlanFile(fixture.value).pipe(Effect.provide(fileContext), Effect.orDie),
        input.update,
        fixtureStepMs,
      );
    }
    const tracked =
      (ask: Ask<TextGenerationError>): Ask<TextGenerationError> =>
      <S extends Schema.Top>(request: StepRequest<S>) =>
        input.update(request.step, request.points).pipe(Effect.andThen(ask(request)));
    return inEmptyFolder((cwd) =>
      Effect.gen(function* () {
        const write = (yield* askFor(input.writer, cwd)).ask;
        const review = (yield* askFor(input.reviewer, cwd)).ask;
        return yield* runMethod({
          brief: input.brief,
          size: input.size,
          write: tracked(write),
          review: tracked(review),
          writer: `${input.writer.agent.name} ${input.writer.model}`,
          reviewer: `${input.reviewer.agent.name} ${input.reviewer.model}`,
          sameProvider: input.sameProvider,
        });
      }),
    );
  };

  /** One writer turn on one decision: a push-back or a pick. */
  const answer = (input: {
    readonly brief: PlanBrief;
    readonly result: PlanResult;
    readonly record: DecisionRecord;
    readonly ask: DecisionAsk;
    readonly by: string;
    readonly writer: PlanSeat;
  }) => {
    const run = (askWriter: Ask<TextGenerationError>) =>
      answerDecision({
        brief: input.brief,
        result: input.result,
        number: input.record.number,
        ask: input.ask,
        by: input.by,
        writer: input.writer.agent.name,
        askWriter,
      });
    if (Option.isSome(fixture)) {
      return run(fixtureAsk(input.result, input.record, fixtureStepMs));
    }
    return inEmptyFolder((cwd) =>
      Effect.gen(function* () {
        const writer = yield* askFor(input.writer, cwd);
        const answered = yield* run(writer.ask);
        yield* Effect.logInfo("planning: decision answered", {
          number: input.record.number,
          kind: input.ask.kind,
          sentParts: answered.sent.parts.length,
          sentTasks: answered.sent.tasks.length,
          usage: writer.usage,
        });
        return answered;
      }),
    );
  };

  return { writePlan, answer };
});
