#!/usr/bin/env node
/**
 * Planning runner, dev only. One provider writes the plan; the other signed-in provider reviews
 * it (the same one in a fresh session when only one is signed in). Uses the person's own Claude
 * or Codex login:
 *
 *   node apps/server/scripts/team-plan.ts --brief brief.json --out plan-out
 *     [--writer codex|claude] [--reviewer codex|claude] [--writer-model id] [--effort medium]
 *     [--review-model id] [--review-effort high] [--size small|medium|large]
 *
 * The review defaults to the reviewer's strongest model at high effort (REVIEW_DEFAULTS).
 *
 * Save a plan written before into a project (.team/plan.md, decisions, rulebook lines, tasks),
 * or with --dry-run only list what would be written. The team state is a dev home's:
 *
 *   node apps/server/scripts/team-plan.ts --out plan-out --save-to ~/code/team-demo6 [--dry-run]
 *     [--home-dir ~/.t3-dev]
 *
 * Push back on a decision of a plan written before (the writer answers):
 *
 *   node apps/server/scripts/team-plan.ts --brief brief.json --out plan-out
 *     --push-back 0002 --message "We don't know React, why not plain HTML?" [--by name]
 */
import * as NodeUtil from "node:util";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import * as ServerConfig from "../src/config.ts";
import * as ProcessRunner from "../src/processRunner.ts";
import { decodeBrief } from "../src/team/planning/planBrief.ts";
import { decodePlan, writePlanFiles } from "../src/team/planning/planFiles.ts";
import { PlanSize } from "../src/team/planning/planLimits.ts";
import { runMethod } from "../src/team/planning/planMethod.ts";
import {
  DEFAULT_MODELS,
  REVIEW_DEFAULTS,
  makeProviderAsk,
  signedInProviders,
} from "../src/team/planning/planProvider.ts";
import { answerDecision } from "../src/team/planning/planPushBack.ts";
import { pickReviewer } from "../src/team/planning/planReview.ts";
import { DEV_HOME, saveToProject } from "./teamPlanSave.ts";

const { values } = NodeUtil.parseArgs({
  options: {
    brief: { type: "string" },
    out: { type: "string" },
    writer: { type: "string", default: "codex" },
    reviewer: { type: "string" },
    "writer-model": { type: "string" },
    "review-model": { type: "string" },
    "review-effort": { type: "string" },
    effort: { type: "string", default: "medium" },
    size: { type: "string" },
    "push-back": { type: "string" },
    message: { type: "string" },
    by: { type: "string", default: "the team" },
    "save-to": { type: "string" },
    "dry-run": { type: "boolean", default: false },
    "home-dir": { type: "string" },
  },
});

class PlanRunError extends Schema.TaggedError<PlanRunError>()("PlanRunError", {
  detail: Schema.String,
}) {
  override get message(): string {
    return this.detail;
  }
}

const decodeSize = Schema.decodeUnknownEffect(PlanSize);
const decodeProvider = Schema.decodeUnknownEffect(Schema.Literals(["codex", "claude"]));

const program = Effect.gen(function* () {
  if (values["save-to"] && values.out && !values.brief) {
    const path = yield* Path.Path;
    const text = yield* saveToProject({
      planFile: path.join(path.resolve(values.out), "plan.json"),
      projectFolder: values["save-to"],
      homeDir: values["home-dir"] ?? DEV_HOME,
      dryRun: values["dry-run"],
    });
    return yield* Console.log(text);
  }
  if (!values.brief || !values.out) {
    return yield* new PlanRunError({ detail: "Pass --brief <file> and --out <dir>." });
  }
  const writer = yield* decodeProvider(values.writer);
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const outDir = path.resolve(values.out);
  const brief = yield* decodeBrief(yield* fs.readFileString(values.brief));
  // Outside any repo, so the provider reads no project's CLAUDE.md or AGENTS.md.
  const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-" });
  const writerModel = values["writer-model"] ?? DEFAULT_MODELS[writer];
  const write = yield* makeProviderAsk({
    provider: writer,
    model: writerModel,
    effort: values.effort,
    cwd,
  });

  if (values["push-back"]) {
    const number = values["push-back"];
    const earlier = yield* decodePlan(yield* fs.readFileString(path.join(outDir, "plan.json")));
    const record = earlier.decisions.find((candidate) => candidate.number === number);
    if (!record || !values.message) {
      return yield* new PlanRunError({
        detail: `Pass --message, and a decision number from plan.json (${number} not found).`,
      });
    }
    const answered = yield* answerDecision({
      brief,
      result: earlier,
      number,
      ask: { kind: "push-back", message: values.message },
      by: values.by,
      writer: `${writer} ${writerModel}`,
      askWriter: write.ask,
    });
    const plan = answered.result;
    const summary = yield* writePlanFiles({
      outDir,
      plan,
      usage: [{ who: `${writer} ${writerModel} (writer)`, turns: write.usage }],
    });
    return yield* Effect.logInfo(`Push-back answered in ${outDir}: ${summary}`);
  }

  const picked = values.reviewer
    ? { provider: yield* decodeProvider(values.reviewer), sameProvider: values.reviewer === writer }
    : pickReviewer(writer, yield* signedInProviders());
  const reviewerModel = values["review-model"] ?? REVIEW_DEFAULTS[picked.provider].model;
  const reviewEffort = values["review-effort"] ?? REVIEW_DEFAULTS[picked.provider].effort;
  const review = yield* makeProviderAsk({
    provider: picked.provider,
    model: reviewerModel,
    effort: reviewEffort,
    cwd,
  });
  const size = values.size ? yield* decodeSize(values.size) : undefined;
  const plan = yield* runMethod({
    brief,
    write: write.ask,
    review: review.ask,
    writer: `${writer} ${writerModel}`,
    reviewer: `${picked.provider} ${reviewerModel} (effort ${reviewEffort})`,
    sameProvider: picked.sameProvider,
    size,
  });
  const summary = yield* writePlanFiles({
    outDir,
    plan,
    usage: [
      { who: `${writer} ${writerModel} (writer)`, turns: write.usage },
      { who: `${picked.provider} ${reviewerModel} (reviewer)`, turns: review.usage },
    ],
  });
  yield* Effect.logInfo(`Plan written to ${outDir}: ${summary}`);
});

program.pipe(
  Effect.scoped,
  Effect.provide(
    Layer.mergeAll(
      ServerConfig.layerTest(process.cwd(), { prefix: "elbo-plan-state-" }),
      ProcessRunner.layer,
    ).pipe(Layer.provideMerge(NodeServices.layer)),
  ),
  NodeRuntime.runMain,
);
