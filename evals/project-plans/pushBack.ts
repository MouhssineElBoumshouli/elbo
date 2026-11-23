/**
 * The push-back eval: one writer turn per case, through the app's own answer code
 * (planPushBack.ts), graded defended or changed against what the case expects.
 *
 *   pnpm plan-pushbacks --out project-plans/runs/<name> [--writer codex|claude] [--samples 2] [--case id,id]
 */
import * as NodeUtil from "node:util";

import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import * as ServerConfig from "../../apps/server/src/config.ts";
import * as ProcessRunner from "../../apps/server/src/processRunner.ts";
import { decodeBrief } from "../../apps/server/src/team/planning/planBrief.ts";
import {
  DEFAULT_MODELS,
  makeProviderAsk,
} from "../../apps/server/src/team/planning/planProvider.ts";
import { answerDecision } from "../../apps/server/src/team/planning/planPushBack.ts";
import { numberDecisions } from "../../apps/server/src/team/planning/planReview.ts";
import type { PlanResult } from "../../apps/server/src/team/planning/planSchemas.ts";
import { fitsTeam, pushBackVerdict } from "./grade.ts";
import { pushBackCases } from "./pushBackCases.ts";

const { values } = NodeUtil.parseArgs({
  options: {
    out: { type: "string" },
    writer: { type: "string", default: "codex" },
    "writer-model": { type: "string" },
    effort: { type: "string", default: "medium" },
    samples: { type: "string", default: "1" },
    case: { type: "string" },
  },
});
if (!values.out) throw new Error("Pass --out <dir>.");
const writer = values.writer === "claude" ? "claude" : "codex";
const writerModel = values["writer-model"] ?? DEFAULT_MODELS[writer];
const samples = Math.max(1, Number(values.samples) || 1);
const wanted = values.case?.split(",");
const cases = pushBackCases.filter((c) => wanted === undefined || wanted.includes(c.id));
const outDir = values.out;
const encodeRows = Schema.encodeEffect(Schema.fromJsonString(Schema.Unknown));

interface Row {
  readonly case: string;
  readonly sample: number;
  readonly expect: "defend" | "change";
  readonly got: "defend" | "change";
  readonly pass: boolean;
  readonly fitsTeam: boolean;
  readonly picked: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
}

await Effect.runPromise(
  Effect.gen(function* () {
    const fs = yield* FileSystem.FileSystem;
    const path = yield* Path.Path;
    const cwd = yield* fs.makeTempDirectoryScoped({ prefix: "elbo-pushback-eval-" });
    yield* fs.makeDirectory(outDir, { recursive: true });
    const rows: Row[] = [];

    for (const pushCase of cases) {
      const brief = yield* decodeBrief(
        yield* fs.readFileString(path.join(import.meta.dirname, "cases", pushCase.briefFile)),
      );
      const written = {
        title: "Plan",
        plan: pushCase.plan.join("\n\n"),
        decisions: [pushCase.decision],
        tasks: [],
        doneChecks: [],
        pushBacks: [],
        cutFirst: [],
      };
      const result: PlanResult = {
        size: "medium",
        writer: `${writer} ${writerModel}`,
        reviewer: "",
        sameProvider: false,
        plan: written,
        decisions: numberDecisions(written.decisions, "medium"),
        rounds: [],
        log: [],
        stopReason: "",
        wordsBeforeShorten: 0,
      };
      for (let sample = 1; sample <= samples; sample++) {
        yield* Effect.logInfo(`${pushCase.id} #${sample}`);
        const ask = yield* makeProviderAsk({
          provider: writer,
          model: writerModel,
          effort: values.effort,
          cwd,
        });
        const answered = yield* answerDecision({
          brief,
          result,
          number: "0001",
          ask: { kind: "push-back", message: pushCase.message },
          by: pushCase.by,
          writer,
          askWriter: ask.ask,
        });
        const answer = answered.record.history.at(-1)?.text ?? "";
        const got = pushBackVerdict(pushCase.decision.picked, answered.record.decision.picked);
        const tokens = ask.usage.reduce(
          (sum, turn) => ({
            input: sum.input + turn.inputTokens,
            output: sum.output + turn.outputTokens,
          }),
          { input: 0, output: 0 },
        );
        const row: Row = {
          case: pushCase.id,
          sample,
          expect: pushCase.expect,
          got,
          pass: got === pushCase.expect,
          fitsTeam: fitsTeam(answer, {
            people: brief.people.map((person) => person.name),
            details: [brief.deadline, brief.budget, ...brief.outsideRules],
          }),
          picked: answered.record.decision.picked,
          inputTokens: tokens.input,
          outputTokens: tokens.output,
        };
        rows.push(row);
        yield* fs.writeFileString(
          path.join(outDir, `${pushCase.id}-${sample}.md`),
          [
            `# ${pushCase.id} #${sample}: expected ${pushCase.expect}, got ${got}`,
            `**${pushCase.by} pushed back:** ${pushCase.message}`,
            `**Answer:** ${answer}`,
            `**Pick:** ${pushCase.decision.picked} → ${answered.record.decision.picked}`,
            `**Updated:** ${answered.record.history.at(-1)?.updated.join(", ") || "nothing"}`,
            `Tokens: ${tokens.input} in, ${tokens.output} out.`,
          ].join("\n\n"),
        );
        // After every sample, so a run cut short by a usage limit keeps what it finished.
        yield* fs.writeFileString(path.join(outDir, "results.json"), yield* encodeRows(rows));
      }
    }
    const table = [
      "| Case | Expected | Got | Pass | Argues from the team | Tokens in / out |",
      "| --- | --- | --- | --- | --- | --- |",
      ...rows.map(
        (row) =>
          `| ${row.case}${samples > 1 ? ` #${row.sample}` : ""} | ${row.expect} | ${row.got} | ${row.pass ? "yes" : "**no**"} | ${row.fitsTeam ? "yes" : "no"} | ${row.inputTokens} / ${row.outputTokens} |`,
      ),
    ];
    yield* fs.writeFileString(
      path.join(outDir, "SUMMARY.md"),
      `# Push-back eval: ${writer} ${writerModel}, effort ${values.effort}\n\n${table.join("\n")}\n\nPassed ${rows.filter((row) => row.pass).length} of ${rows.length}.\n`,
    );
    yield* Effect.logInfo(`Done: ${outDir}`);
  }).pipe(
    Effect.scoped,
    Effect.provide(
      Layer.mergeAll(
        ServerConfig.layerTest(process.cwd(), { prefix: "elbo-pushback-eval-state-" }),
        ProcessRunner.layer,
      ).pipe(Layer.provideMerge(NodeServices.layer)),
    ),
  ),
);
