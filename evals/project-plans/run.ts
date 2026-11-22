import * as NodeUtil from "node:util";

import * as NodeServices from "@effect/platform-node/NodeServices";
import * as DateTime from "effect/DateTime";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Random from "effect/Random";
import * as Schema from "effect/Schema";

import * as ServerConfig from "../../apps/server/src/config.ts";
import { decodeBrief } from "../../apps/server/src/team/planning/planBrief.ts";
import { loadChecklists, writePlanFiles } from "../../apps/server/src/team/planning/planFiles.ts";
import { runMethod } from "../../apps/server/src/team/planning/planMethod.ts";
import { baselinePrompt } from "../../apps/server/src/team/planning/planPrompts.ts";
import { makeProviderAsk } from "../../apps/server/src/team/planning/planProvider.ts";
import { renderPlan } from "../../apps/server/src/team/planning/planRender.ts";
import { planCases } from "./cases.ts";
import { RunInfo, summarize, UsageFile } from "./report.ts";

const { values } = NodeUtil.parseArgs({
  options: {
    out: { type: "string" },
    provider: { type: "string", default: "codex" },
    model: { type: "string" },
    effort: { type: "string", default: "medium" },
    case: { type: "string" },
  },
});
if (!values.out) throw new Error("Pass --out <dir>.");
if (values.provider !== "codex" && values.provider !== "claude") {
  throw new Error("--provider is codex or claude.");
}
const provider = values.provider;
const model = values.model ?? (provider === "codex" ? "gpt-6-astra" : "claude-sonnet-5-5");
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
    const checklists = yield* loadChecklists();
    // Outside any repo, so the provider reads no project's CLAUDE.md or AGENTS.md.
    const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-plan-eval-" });
    yield* fs.makeDirectory(outDir, { recursive: true });
    yield* fs.writeFileString(
      path.join(outDir, "run.json"),
      yield* encodeRunInfo({ provider, model, effort: values.effort }),
    );

    for (const planCase of cases) {
      const caseDir = path.join(outDir, planCase.id);
      const brief = yield* decodeBrief(
        yield* fs.readFileString(path.join(import.meta.dirname, "cases", planCase.briefFile)),
      );
      yield* Effect.logInfo(`${planCase.id}: method`);
      const method = yield* makeProviderAsk({ provider, model, effort: values.effort, cwd });
      const plan = yield* runMethod({ brief, checklists, ask: method.ask });
      yield* writePlanFiles({
        outDir: path.join(caseDir, "method"),
        plan,
        usage: method.usage,
        date: DateTime.formatIsoDateUtc(yield* DateTime.now),
      });
      const methodText = renderPlan(plan);

      yield* Effect.logInfo(`${planCase.id}: plain chat`);
      const baseline = yield* makeProviderAsk({ provider, model, effort: values.effort, cwd });
      const baselineText = `${(yield* baseline.ask({ step: "baseline", prompt: baselinePrompt(brief), schema: BaselineReply })).plan.trim()}\n`;
      yield* fs.writeFileString(path.join(caseDir, "baseline.md"), baselineText);

      yield* fs.writeFileString(
        path.join(caseDir, "baseline-usage.json"),
        yield* encodeUsage({ turns: baseline.usage }),
      );
      const methodIsA = yield* Random.nextBoolean;
      yield* fs.writeFileString(path.join(caseDir, "A.md"), methodIsA ? methodText : baselineText);
      yield* fs.writeFileString(path.join(caseDir, "B.md"), methodIsA ? baselineText : methodText);
      // After every case, so a run cut short by a usage limit keeps what it finished.
      yield* summarize(outDir);
    }
    yield* Effect.logInfo(`Done: ${outDir}`);
  }).pipe(
    Effect.scoped,
    Effect.provide(
      ServerConfig.layerTest(process.cwd(), { prefix: "elbo-plan-eval-state-" }).pipe(
        Layer.provideMerge(NodeServices.layer),
      ),
    ),
  ),
);
