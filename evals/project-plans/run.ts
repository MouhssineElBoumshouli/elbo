import * as NodeUtil from "node:util";

import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Random from "effect/Random";
import * as Schema from "effect/Schema";

import * as ServerConfig from "../../apps/server/src/config.ts";
import * as ProcessRunner from "../../apps/server/src/processRunner.ts";
import { decodeBrief } from "../../apps/server/src/team/planning/planBrief.ts";
import { writePlanFiles } from "../../apps/server/src/team/planning/planFiles.ts";
import { runMethod } from "../../apps/server/src/team/planning/planMethod.ts";
import { baselinePrompt } from "../../apps/server/src/team/planning/planPrompts.ts";
import {
  DEFAULT_MODELS,
  REVIEW_DEFAULTS,
  makeProviderAsk,
  signedInProviders,
} from "../../apps/server/src/team/planning/planProvider.ts";
import { renderPlan } from "../../apps/server/src/team/planning/planRender.ts";
import { pickReviewer } from "../../apps/server/src/team/planning/planReview.ts";
import { planCases } from "./cases.ts";
import { sameLayout } from "./layout.ts";
import { RunInfo, summarize, UsageFile } from "./report.ts";

const { values } = NodeUtil.parseArgs({
  options: {
    out: { type: "string" },
    writer: { type: "string", default: "codex" },
    reviewer: { type: "string" },
    "writer-model": { type: "string" },
    "review-model": { type: "string" },
    "review-effort": { type: "string" },
    effort: { type: "string", default: "medium" },
    case: { type: "string" },
    // Skips the plain chat, for a rerun that compares the flow with an earlier round.
    "no-baseline": { type: "boolean", default: false },
  },
});
const isProvider = (value: string | undefined) => value === "codex" || value === "claude";
if (!values.out) throw new Error("Pass --out <dir>.");
if (!isProvider(values.writer) || (values.reviewer !== undefined && !isProvider(values.reviewer))) {
  throw new Error("--writer and --reviewer are codex or claude.");
}
const writer = values.writer === "claude" ? "claude" : "codex";
const writerModel = values["writer-model"] ?? DEFAULT_MODELS[writer];
const wanted = values.case?.split(",");
const cases = planCases.filter((c) => wanted === undefined || wanted.includes(c.id));
if (cases.length === 0) {
  throw new Error(`Unknown --case. Cases: ${planCases.map((c) => c.id).join(", ")}`);
}
const outDir = values.out;

const BaselineReply = Schema.Struct({ plan: Schema.String });
const encodeRunInfo = Schema.encodeEffect(Schema.fromJsonString(RunInfo));
const encodeUsage = Schema.encodeEffect(Schema.fromJsonString(UsageFile));

await Effect.runPromise(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const reviewer =
      values.reviewer === "codex" || values.reviewer === "claude"
        ? { provider: values.reviewer, sameProvider: values.reviewer === writer }
        : pickReviewer(writer, yield* signedInProviders());
    const reviewerModel = values["review-model"] ?? REVIEW_DEFAULTS[reviewer.provider].model;
    const reviewEffort = values["review-effort"] ?? REVIEW_DEFAULTS[reviewer.provider].effort;
    // Outside any repo, so the provider reads no project's CLAUDE.md or AGENTS.md.
    const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-eval-" });
    yield* fs.makeDirectory(outDir, { recursive: true });
    yield* fs.writeFileString(
      path.join(outDir, "run.json"),
      yield* encodeRunInfo({
        writer: `${writer} ${writerModel}`,
        reviewer: `${reviewer.provider} ${reviewerModel} (effort ${reviewEffort})`,
        sameProvider: reviewer.sameProvider,
        baseline: `${writer} ${writerModel}`,
        effort: values.effort,
      }),
    );

    for (const planCase of cases) {
      const caseDir = path.join(outDir, planCase.id);
      const brief = yield* decodeBrief(
        yield* fs.readFileString(path.join(import.meta.dirname, "cases", planCase.briefFile)),
      );
      yield* Effect.logInfo(`${planCase.id}: write and review`);
      const write = yield* makeProviderAsk({
        provider: writer,
        model: writerModel,
        effort: values.effort,
        cwd,
      });
      const review = yield* makeProviderAsk({
        provider: reviewer.provider,
        model: reviewerModel,
        effort: reviewEffort,
        cwd,
      });
      const plan = yield* runMethod({
        brief,
        write: write.ask,
        review: review.ask,
        writer: `${writer} ${writerModel}`,
        reviewer: `${reviewer.provider} ${reviewerModel} (effort ${reviewEffort})`,
        sameProvider: reviewer.sameProvider,
      });
      yield* writePlanFiles({
        outDir: path.join(caseDir, "method"),
        plan,
        usage: [
          { who: `${writer} (writer)`, turns: write.usage },
          { who: `${reviewer.provider} (reviewer)`, turns: review.usage },
        ],
      });
      const methodText = renderPlan(plan.plan, plan.decisions);
      if (values["no-baseline"]) {
        // No pair to judge: compare method/plan.json and usage.json with the earlier round.
        continue;
      }

      yield* Effect.logInfo(`${planCase.id}: plain chat`);
      const baseline = yield* makeProviderAsk({
        provider: writer,
        model: writerModel,
        effort: values.effort,
        cwd,
      });
      const baselineText = `${(yield* baseline.ask({ step: "baseline", prompt: baselinePrompt(brief), schema: BaselineReply })).plan.trim()}\n`;
      yield* fs.writeFileString(path.join(caseDir, "baseline.md"), baselineText);
      yield* fs.writeFileString(
        path.join(caseDir, "baseline-usage.json"),
        yield* encodeUsage({ turns: baseline.usage }),
      );
      const methodIsA = yield* Random.nextBoolean;
      // Both in one heading style, so the layout does not give the sides away.
      const [method, plain] = [sameLayout(methodText), sameLayout(baselineText)];
      yield* fs.writeFileString(path.join(caseDir, "A.md"), methodIsA ? method : plain);
      yield* fs.writeFileString(path.join(caseDir, "B.md"), methodIsA ? plain : method);
      // After every case, so a run cut short by a usage limit keeps what it finished.
      yield* summarize(outDir);
    }
    yield* Effect.logInfo(`Done: ${outDir}`);
  }).pipe(
    Effect.scoped,
    Effect.provide(
      Layer.mergeAll(
        ServerConfig.layerTest(process.cwd(), { prefix: "elbo-plan-eval-state-" }),
        ProcessRunner.layer,
      ).pipe(Layer.provideMerge(NodeServices.layer)),
    ),
  ),
);
