#!/usr/bin/env node
/**
 * Planning runner, dev only (team/PLANNING_FEATURE_PLAN.md slice 1). Runs the whole planning
 * method on one provider, on the person's own Claude or Codex login, and writes the plan:
 *
 *   node apps/server/scripts/team-plan.ts --brief brief.json --out plan-out
 *     [--provider codex|claude] [--model id] [--effort medium] [--size small|medium|large]
 *
 * Push back on a decision of a plan written before (step 6):
 *
 *   node apps/server/scripts/team-plan.ts --brief brief.json --out plan-out
 *     --push-back 0002 --message "We don't know React, why not plain HTML?" [--by name]
 */
import * as NodeUtil from "node:util";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import * as ServerConfig from "../src/config.ts";
import { decodeBrief } from "../src/team/planning/planBrief.ts";
import { PlanSize } from "../src/team/planning/planExperts.ts";
import { decodePlan, loadChecklists, writePlanFiles } from "../src/team/planning/planFiles.ts";
import { pushBack, runMethod } from "../src/team/planning/planMethod.ts";
import { makeProviderAsk } from "../src/team/planning/planProvider.ts";

const { values } = NodeUtil.parseArgs({
  options: {
    brief: { type: "string" },
    out: { type: "string" },
    provider: { type: "string", default: "codex" },
    model: { type: "string" },
    effort: { type: "string", default: "medium" },
    size: { type: "string" },
    "push-back": { type: "string" },
    message: { type: "string" },
    by: { type: "string", default: "the team" },
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

const DEFAULT_MODELS = { codex: "gpt-6-astra", claude: "claude-sonnet-5-5" } as const;

const program = Effect.gen(function* () {
  if (!values.brief || !values.out) {
    return yield* new PlanRunError({ detail: "Pass --brief <file> and --out <dir>." });
  }
  if (values.provider !== "codex" && values.provider !== "claude") {
    return yield* new PlanRunError({ detail: "--provider is codex or claude." });
  }
  const provider = values.provider;
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const outDir = path.resolve(values.out);
  const brief = yield* decodeBrief(yield* fs.readFileString(values.brief));
  const checklists = yield* loadChecklists();
  // Outside any repo, so the provider reads no project's CLAUDE.md or AGENTS.md.
  const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-" });
  const { ask, usage } = yield* makeProviderAsk({
    provider,
    model: values.model ?? DEFAULT_MODELS[provider],
    effort: values.effort,
    cwd,
  });
  const date = DateTime.formatIsoDateUtc(yield* DateTime.now);

  let plan;
  if (values["push-back"]) {
    const number = values["push-back"];
    const earlier = yield* decodePlan(yield* fs.readFileString(path.join(outDir, "plan.json")));
    const record = earlier.decisions.find((candidate) => candidate.number === number);
    if (!record || !values.message) {
      return yield* new PlanRunError({
        detail: `Pass --message, and a decision number from plan.json (${number} not found).`,
      });
    }
    const answered = yield* pushBack({
      brief,
      record,
      message: values.message,
      by: values.by,
      checklists,
      ask,
    });
    plan = {
      ...earlier,
      decisions: earlier.decisions.map((candidate) =>
        candidate.number === number ? answered : candidate,
      ),
    };
  } else {
    const size = values.size ? yield* decodeSize(values.size) : undefined;
    plan = yield* runMethod({ brief, checklists, ask, size });
  }
  const summary = yield* writePlanFiles({ outDir, plan, usage, date });
  yield* Effect.logInfo(`Plan written to ${outDir}: ${summary}`);
});

program.pipe(
  Effect.scoped,
  Effect.provide(
    ServerConfig.layerTest(process.cwd(), { prefix: "elbo-plan-state-" }).pipe(
      Layer.provideMerge(NodeServices.layer),
    ),
  ),
  NodeRuntime.runMain,
);
