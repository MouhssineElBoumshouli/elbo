import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import {
  briefText,
  decodeBrief,
  estimateTokens,
} from "../../apps/server/src/team/planning/planBrief.ts";
import { decodePlan, loadChecklists } from "../../apps/server/src/team/planning/planFiles.ts";
import { checklistIds } from "../../apps/server/src/team/planning/planPrompts.ts";
import { renderPlan } from "../../apps/server/src/team/planning/planRender.ts";
import { totalUsage, usageLine } from "../../apps/server/src/team/planning/planUsage.ts";
import { type PlanCase, planCases } from "./cases.ts";
import { badTasks, ONE_PAGE_WORDS, pushedBack, unansweredSecurity, wordCount } from "./grade.ts";

const Usage = Schema.Struct({
  inputTokens: Schema.Number,
  cachedInputTokens: Schema.Number,
  outputTokens: Schema.Number,
});
export const UsageFile = Schema.Struct({ turns: Schema.Array(Usage) });
const decodeUsageFile = Schema.decodeEffect(Schema.fromJsonString(UsageFile));
export const RunInfo = Schema.Struct({
  provider: Schema.String,
  model: Schema.String,
  effort: Schema.String,
});
const decodeRunInfo = Schema.decodeEffect(Schema.fromJsonString(RunInfo));
const encodeJson = Schema.encodeEffect(Schema.fromJsonString(Schema.Unknown));

const yesNo = (pass: boolean) => (pass ? "yes" : "**no**");

/** Reads what a run left in `outDir`, case by case, and writes key.json, results.json, checks.md and REVIEW.md. */
export const summarize = Effect.fn("projectPlans.summarize")(function* (outDir: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const securityIds = checklistIds((yield* loadChecklists()).security ?? "");
  const info = yield* decodeRunInfo(yield* fs.readFileString(path.join(outDir, "run.json")));
  const key: Record<string, { A: string; B: string }> = {};
  const rows: unknown[] = [];
  const lines: string[] = [];
  const done: PlanCase[] = [];

  for (const planCase of planCases) {
    const caseDir = path.join(outDir, planCase.id);
    const files = ["method/plan.json", "method/usage.json", "baseline.md", "A.md"].map((f) =>
      path.join(caseDir, f),
    );
    if (!(yield* Effect.forEach(files, (f) => fs.exists(f))).every(Boolean)) continue;
    done.push(planCase);
    const [planJson, usageJson, baselineText, aText] = yield* Effect.forEach(files, (f) =>
      fs.readFileString(f),
    );
    const brief = yield* decodeBrief(
      yield* fs.readFileString(path.join(import.meta.dirname, "cases", planCase.briefFile)),
    );
    const plan = yield* decodePlan(planJson ?? "");
    const methodText = renderPlan(plan);
    const methodTurns = (yield* decodeUsageFile(usageJson ?? "")).turns;
    const baselineUsagePath = path.join(caseDir, "baseline-usage.json");
    const baselineTurns = (yield* fs.exists(baselineUsagePath))
      ? (yield* decodeUsageFile(yield* fs.readFileString(baselineUsagePath))).turns
      : undefined;
    key[planCase.id] =
      aText === baselineText ? { A: "baseline", B: "method" } : { A: "method", B: "baseline" };

    const tasks = badTasks(
      plan,
      brief.people.map((person) => person.name),
    );
    const security = unansweredSecurity(plan, securityIds);
    const methodUsage = totalUsage(methodTurns);
    const baselineUsage = baselineTurns ? totalUsage(baselineTurns) : undefined;
    const pushes = (text: string) =>
      Object.fromEntries(planCase.planted.map((m) => [m.id, pushedBack(text, m)]));
    rows.push(
      {
        id: planCase.id,
        arm: "method",
        words: wordCount(methodText),
        pushedBack: pushes(methodText),
        size: plan.size,
        badTasks: tasks,
        unansweredSecurity: security ?? null,
        overruns: plan.overruns,
        turns: methodTurns.length,
        usage: methodUsage,
      },
      {
        id: planCase.id,
        arm: "baseline",
        words: wordCount(baselineText ?? ""),
        pushedBack: pushes(baselineText ?? ""),
        turns: baselineTurns?.length ?? null,
        usage: baselineUsage ?? null,
      },
    );
    const words = [wordCount(methodText), wordCount(baselineText ?? "")] as const;
    lines.push(
      `## ${planCase.id}`,
      "",
      `Brief: about ${estimateTokens(briefText(brief))} tokens (target under 600). Method size: ${plan.size}, panel: ${plan.panel.join(", ")}, ${plan.decisions.length} decisions, ${plan.merge.tasks.length} tasks.`,
      "",
      "| Check | Method | Plain chat |",
      "| --- | --- | --- |",
      `| Words | ${words[0]} | ${words[1]} |`,
      ...(planCase.onePage
        ? [
            `| One page (≤ ${ONE_PAGE_WORDS} words) | ${yesNo(words[0] <= ONE_PAGE_WORDS)} | ${yesNo(words[1] <= ONE_PAGE_WORDS)} |`,
          ]
        : []),
      ...planCase.planted.map(
        (m) =>
          `| Pushes back: ${m.id} | ${yesNo(pushedBack(methodText, m))} | ${yesNo(pushedBack(baselineText ?? "", m))} |`,
      ),
      `| Every task has one owner and an area | ${tasks.length === 0 ? "yes" : `**no**: ${tasks.join(", ")}`} | not checked (free text) |`,
      `| Security checklist answered | ${security === undefined ? "no security engineer on the panel" : security.length === 0 ? "yes" : `**no**: ${security.join(", ")}`} | not checked (free text) |`,
      "",
      `Method tokens: ${usageLine(plan.size, methodTurns.length, methodUsage)}.`,
      `Plain chat tokens: ${baselineUsage ? `${baselineTurns?.length} turn, input ${baselineUsage.inputTokens}, output ${baselineUsage.outputTokens}` : "not recorded in this run"}.`,
      ...(plan.overruns.length > 0
        ? ["", `Length caps the model went over (trimmed): ${plan.overruns.join("; ")}.`]
        : []),
      "",
    );
  }

  yield* fs.writeFileString(path.join(outDir, "key.json"), yield* encodeJson(key));
  yield* fs.writeFileString(path.join(outDir, "results.json"), yield* encodeJson(rows));
  yield* fs.writeFileString(
    path.join(outDir, "checks.md"),
    [
      "# Project plan checks",
      "",
      `Provider ${info.provider}, model ${info.model}, effort ${info.effort}. This file names the method: read A.md and B.md first.`,
      "",
      ...lines,
    ].join("\n"),
  );
  yield* fs.writeFileString(
    path.join(outDir, "REVIEW.md"),
    [
      "# Blind review",
      "",
      "Each case folder has A.md and B.md: the same brief, planned two ways, in random order. The brief is in evals/project-plans/cases/<case>.json.",
      "For each case, pick the plan you would rather follow, and note why: does it fit the team and the time, push back on bad ideas, and read easily?",
      "Open key.json and checks.md only after you have picked.",
      "",
      ...done.map((c) => `- ${c.id}: A or B?`),
      "",
    ].join("\n"),
  );
  return done.length;
});
