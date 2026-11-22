import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Path from "effect/Path";
import * as Schema from "effect/Schema";

import { decodeBrief } from "../../apps/server/src/team/planning/planBrief.ts";
import { decodePlan } from "../../apps/server/src/team/planning/planFiles.ts";
import { PLAN_LIMITS } from "../../apps/server/src/team/planning/planLimits.ts";
import { renderPlan } from "../../apps/server/src/team/planning/planRender.ts";
import type { PlanResult } from "../../apps/server/src/team/planning/planSchemas.ts";
import { usageLine } from "../../apps/server/src/team/planning/planUsage.ts";
import { type PlanCase, planCases } from "./cases.ts";
import { badTasks, methodTalk, ONE_PAGE_WORDS, pushedBack, wordCount } from "./grade.ts";

const Usage = Schema.Struct({
  inputTokens: Schema.Number,
  cachedInputTokens: Schema.Number,
  outputTokens: Schema.Number,
});
const Turn = Schema.Struct({ ...Usage.fields, step: Schema.String });
export const UsageFile = Schema.Struct({ turns: Schema.Array(Turn) });
const MethodUsageFile = Schema.Struct({
  providers: Schema.Array(Schema.Struct({ who: Schema.String, turns: Schema.Array(Turn) })),
});
const decodeUsageFile = Schema.decodeEffect(Schema.fromJsonString(UsageFile));
const decodeMethodUsage = Schema.decodeEffect(Schema.fromJsonString(MethodUsageFile));
export const RunInfo = Schema.Struct({
  writer: Schema.String,
  reviewer: Schema.String,
  sameProvider: Schema.Boolean,
  baseline: Schema.String,
  effort: Schema.String,
});
const decodeRunInfo = Schema.decodeEffect(Schema.fromJsonString(RunInfo));
const encodeJson = Schema.encodeEffect(Schema.fromJsonString(Schema.Unknown));

const yesNo = (pass: boolean) => (pass ? "yes" : "**no**");
const talkCell = (found: ReadonlyArray<string>) =>
  found.length === 0
    ? "none"
    : `**${found.length}**: ${found.map((l) => `"${l.slice(0, 80)}"`).join("; ")}`;

/** What each review found, and what the writer did with the blockers and shoulds. */
function reviewLines(plan: PlanResult): ReadonlyArray<string> {
  return plan.rounds.flatMap((round) => [
    `- Round ${round.round}: ${round.score}/10 on ${round.words} words.`,
    ...round.problems.map((problem) => {
      const done = plan.log.find((entry) => entry.round === round.round && entry.id === problem.id);
      const outcome = done ? ` → ${done.outcome}${done.reason ? `: ${done.reason}` : ""}` : "";
      return `  - ${problem.id} [${problem.severity}] ${problem.problem}${outcome}`;
    }),
    ...plan.log
      .filter((entry) => entry.round === round.round && entry.from === "check")
      .map((entry) => `  - ${entry.id} [check] ${entry.point} → ${entry.outcome}`),
  ]);
}

/** Reads what a run left in `outDir`, case by case, and writes key.json, results.json, checks.md and REVIEW.md. */
export const summarize = Effect.fn("projectPlans.summarize")(function* (outDir: string) {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const info = yield* decodeRunInfo(yield* fs.readFileString(path.join(outDir, "run.json")));
  const key: Record<string, { A: string; B: string }> = {};
  const rows: unknown[] = [];
  const lines: string[] = [];
  const done: PlanCase[] = [];

  for (const planCase of planCases) {
    const caseDir = path.join(outDir, planCase.id);
    const files = [
      "method/plan.json",
      "method/usage.json",
      "baseline.md",
      "baseline-usage.json",
      "A.md",
    ].map((f) => path.join(caseDir, f));
    if (!(yield* Effect.forEach(files, (f) => fs.exists(f))).every(Boolean)) continue;
    done.push(planCase);
    const [planJson, usageJson, baselineText, baselineUsageJson, aText] = yield* Effect.forEach(
      files,
      (f) => fs.readFileString(f),
    );
    const brief = yield* decodeBrief(
      yield* fs.readFileString(path.join(import.meta.dirname, "cases", planCase.briefFile)),
    );
    const plan = yield* decodePlan(planJson ?? "");
    const methodText = renderPlan(plan.plan, plan.decisions);
    const baseline = baselineText ?? "";
    const methodUsage = (yield* decodeMethodUsage(usageJson ?? "")).providers;
    const baselineTurns = (yield* decodeUsageFile(baselineUsageJson ?? "")).turns;
    key[planCase.id] =
      aText === baseline ? { A: "baseline", B: "method" } : { A: "method", B: "baseline" };

    const words = [wordCount(methodText), wordCount(baseline)] as const;
    const limit = PLAN_LIMITS[plan.size];
    const tasks = badTasks(
      plan.plan.tasks,
      brief.people.map((person) => person.name),
    );
    const pushes = (text: string) =>
      Object.fromEntries(planCase.planted.map((m) => [m.id, pushedBack(text, m)]));
    rows.push(
      {
        id: planCase.id,
        arm: "method",
        size: plan.size,
        words: words[0],
        wordsBeforeShorten: plan.wordsBeforeShorten,
        scores: plan.rounds.map((round) => round.score),
        stopReason: plan.stopReason,
        log: plan.log,
        pushedBack: pushes(methodText),
        methodTalk: methodTalk(methodText),
        badTasks: tasks,
        usage: methodUsage.map(({ who, turns }) => ({ who, line: usageLine(who, turns) })),
      },
      {
        id: planCase.id,
        arm: "baseline",
        words: words[1],
        pushedBack: pushes(baseline),
        methodTalk: methodTalk(baseline),
        usage: usageLine("baseline", baselineTurns),
      },
    );
    lines.push(
      `## ${planCase.id}`,
      "",
      `Size ${plan.size}. ${plan.stopReason}`,
      "",
      "| Check | Writer + review | Plain chat |",
      "| --- | --- | --- |",
      `| Words | ${words[0]} (limit ${limit.words}${plan.wordsBeforeShorten > 0 ? `; ${plan.wordsBeforeShorten} before the shorten turn` : ""}) | ${words[1]} |`,
      `| Review scores per round | ${plan.rounds.map((round) => `${round.score}/10`).join(" → ")} | none |`,
      `| Decisions listed | ${plan.decisions.filter((r) => r.main).length} (limit ${limit.decisions}) | not counted (free text) |`,
      `| Lines about the method, not the project | ${talkCell(methodTalk(methodText))} | ${talkCell(methodTalk(baseline))} |`,
      ...(planCase.onePage
        ? [
            `| One page (≤ ${ONE_PAGE_WORDS} words) | ${yesNo(words[0] <= ONE_PAGE_WORDS)} | ${yesNo(words[1] <= ONE_PAGE_WORDS)} |`,
          ]
        : []),
      ...planCase.planted.map(
        (m) =>
          `| Pushes back: ${m.id} | ${yesNo(pushedBack(methodText, m))} | ${yesNo(pushedBack(baseline, m))} |`,
      ),
      `| Every task has one owner and an area | ${tasks.length === 0 ? "yes" : `**no**: ${tasks.join(", ")}`} | not checked (free text) |`,
      "",
      "What the reviews found:",
      "",
      ...reviewLines(plan),
      "",
      "Tokens:",
      "",
      ...methodUsage.map(({ who, turns }) => `- ${usageLine(who, turns)}`),
      `- ${usageLine("plain chat", baselineTurns)}`,
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
      `Writer ${info.writer}, reviewer ${info.reviewer}${info.sameProvider ? " (same provider, fresh session: no other provider was signed in)" : ""}, plain chat ${info.baseline}, effort ${info.effort}. This file names the sides: read A.md and B.md first.`,
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
