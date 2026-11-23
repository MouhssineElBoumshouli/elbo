import {
  overWordLimit,
  PLAN_LIMITS,
  type PlanSize,
  RULE_MAX_WORDS,
  wordCount,
} from "./planLimits.ts";
import type {
  Decision,
  DecisionRecord,
  FixAnswer,
  LogEntry,
  ReviewProblem,
} from "./planSchemas.ts";
import { methodTalk } from "./planWords.ts";

/** Review passes at most; sol-loop's default budget. */
export const MAX_ROUNDS = 3;

export type PlanProvider = "codex" | "claude";

/** A problem the writer is asked to fix, with who raised it. */
export interface ToFix extends ReviewProblem {
  readonly from: LogEntry["from"];
}

/** The review goes to the other provider; with only one signed in, to the same one in a fresh session. */
export function pickReviewer(
  writer: PlanProvider,
  signedIn: ReadonlyArray<PlanProvider>,
): { readonly provider: PlanProvider; readonly sameProvider: boolean } {
  const other: PlanProvider = writer === "codex" ? "claude" : "codex";
  return signedIn.includes(other)
    ? { provider: other, sameProvider: false }
    : { provider: writer, sameProvider: true };
}

/** Problems the code finds in the plan the team reads, sent with the reviewer's. */
/** Rules past the size's limit, and rules that hold more than one short requirement. */
function ruleProblems(
  decisions: ReadonlyArray<Decision>,
  size: PlanSize,
): ReadonlyArray<Omit<ToFix, "id" | "severity" | "from">> {
  const rules = decisions.map((decision) => decision.rule.trim()).filter(Boolean);
  const limit = PLAN_LIMITS[size].rules;
  const long = rules.filter((rule) => wordCount(rule) > RULE_MAX_WORDS);
  return [
    ...(rules.length > limit
      ? [
          {
            problem: `The plan has ${rules.length} code rules; a ${size} plan has at most ${limit}.`,
            why: "Agents follow a few rules well and many badly.",
            fix: `Keep the ${limit} that an AI could break anywhere in the code (stack and libraries, security, data handling, folder ownership); set the rest to "" and put feature details in tasks.`,
          },
        ]
      : []),
    ...(long.length > 0
      ? [
          {
            problem: `Rules longer than ${RULE_MAX_WORDS} words: ${long.map((rule) => `"${rule}"`).join("; ")}.`,
            why: "A rule holds one requirement an agent can check.",
            fix: "Keep one requirement in each, under 20 words; move the details to tasks.",
          },
        ]
      : []),
  ];
}

export function checkProblems(
  markdown: string,
  size: PlanSize,
  decisions: ReadonlyArray<Decision> = [],
): ReadonlyArray<ToFix> {
  const words = wordCount(markdown);
  const limit = PLAN_LIMITS[size].words;
  const talk = methodTalk(markdown);
  return [
    ...(overWordLimit(markdown, size)
      ? [
          {
            problem: `The plan is ${words} words; the limit for a ${size} plan is ${limit}.`,
            why: "A plan the team will actually read has to stay short.",
            fix: `Cut to under ${limit} words: shorter sentences, fewer details, nothing new.`,
          },
        ]
      : []),
    ...(talk.length > 0
      ? [
          {
            problem: `Lines talk about how the plan was made, not the project: ${talk.map((line) => `"${line}"`).join("; ")}.`,
            why: "The team reads the plan, not the planning session.",
            fix: "Rewrite or drop those lines.",
          },
        ]
      : []),
    ...ruleProblems(decisions, size),
  ].map((found, index) => ({ ...found, id: `C${index + 1}`, severity: "should", from: "check" }));
}

/** Only blockers and shoulds get a fix turn; nits are kept in the round's record. */
export function toFix(problems: ReadonlyArray<ReviewProblem>): ReadonlyArray<ToFix> {
  return problems
    .filter((problem) => problem.severity !== "nit")
    .map((problem) => ({ ...problem, from: "reviewer" }));
}

export function logAnswers(
  round: number,
  problems: ReadonlyArray<ToFix>,
  answers: ReadonlyArray<FixAnswer>,
): ReadonlyArray<LogEntry> {
  return problems.map((problem) => {
    const answer = answers.find((candidate) => candidate.id === problem.id);
    return {
      round,
      id: problem.id,
      severity: problem.severity,
      from: problem.from,
      point: problem.problem,
      outcome: answer?.outcome ?? "no answer",
      reason: answer?.reason ?? "",
    };
  });
}

/** A fixed blocker is the only thing that earns another review. */
export const fixedBlocker = (entries: ReadonlyArray<LogEntry>) =>
  entries.some((entry) => entry.severity === "blocker" && entry.outcome === "fixed");

/** Numbers the decisions; past the size's limit they become one-line "smaller choices". */
export function numberDecisions(
  decisions: ReadonlyArray<Decision>,
  size: PlanSize,
): ReadonlyArray<DecisionRecord> {
  return decisions.map((decision, index) => ({
    number: String(index + 1).padStart(4, "0"),
    decision,
    main: index < PLAN_LIMITS[size].decisions,
    status: "open",
    history: [],
    advice: "",
    risk: "",
  }));
}
