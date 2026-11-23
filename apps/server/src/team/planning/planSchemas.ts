import * as Schema from "effect/Schema";

import { PlanSize } from "./planLimits.ts";

// Every field is required: Codex's structured output rejects optional ones.

export const Decision = Schema.Struct({
  title: Schema.String,
  picked: Schema.String,
  /** Every option looked at, the picked one included. */
  options: Schema.Array(Schema.String),
  why: Schema.String,
  /** One line agents writing the code must follow because of it ("Use Django for the server."), or "". */
  rule: Schema.String,
});
export type Decision = typeof Decision.Type;

export const PlanTask = Schema.Struct({
  title: Schema.String,
  owner: Schema.String,
  hours: Schema.Number,
  area: Schema.String,
  /** "Week 2", "Saturday", "Hours 0-4": the slot in the plan's schedule. */
  when: Schema.String,
});
export type PlanTask = typeof PlanTask.Type;

/** The writer's answer: the plan as the team reads it, plus the same plan as data for the app. */
export const WrittenPlan = Schema.Struct({
  title: Schema.String,
  plan: Schema.String,
  decisions: Schema.Array(Decision),
  tasks: Schema.Array(PlanTask),
  doneChecks: Schema.Array(Schema.Struct({ mustHave: Schema.String, done: Schema.String })),
  pushBacks: Schema.Array(
    Schema.Struct({ idea: Schema.String, problem: Schema.String, better: Schema.String }),
  ),
  cutFirst: Schema.Array(Schema.String),
});
export type WrittenPlan = typeof WrittenPlan.Type;

export const Severity = Schema.Literals(["blocker", "should", "nit"]);
export type Severity = typeof Severity.Type;

export const ReviewProblem = Schema.Struct({
  id: Schema.String,
  severity: Severity,
  problem: Schema.String,
  why: Schema.String,
  fix: Schema.String,
});
export type ReviewProblem = typeof ReviewProblem.Type;

export const Review = Schema.Struct({
  score: Schema.Number,
  problems: Schema.Array(ReviewProblem),
});
export type Review = typeof Review.Type;

export const FixAnswer = Schema.Struct({
  id: Schema.String,
  outcome: Schema.Literals(["fixed", "declined"]),
  reason: Schema.String,
});
export type FixAnswer = typeof FixAnswer.Type;

export const FixReply = Schema.Struct({
  plan: WrittenPlan,
  answers: Schema.Array(FixAnswer),
});

/** One review pass: the reviewer's score and everything it found, nits included. */
export const ReviewRound = Schema.Struct({
  round: Schema.Number,
  score: Schema.Number,
  words: Schema.Number,
  problems: Schema.Array(ReviewProblem),
});
export type ReviewRound = typeof ReviewRound.Type;

/** A blocker or should the writer was asked to fix: what was raised, and what the writer did. */
export const LogEntry = Schema.Struct({
  round: Schema.Number,
  id: Schema.String,
  severity: Severity,
  /** "reviewer", or "check" for a problem the code found (word limit, method talk). */
  from: Schema.Literals(["reviewer", "check"]),
  point: Schema.String,
  outcome: Schema.Literals(["fixed", "declined", "no answer"]),
  reason: Schema.String,
});
export type LogEntry = typeof LogEntry.Type;

export const DecisionRecord = Schema.Struct({
  number: Schema.String,
  decision: Decision,
  /** False for a "smaller choice" past the size's decision limit. */
  main: Schema.Boolean,
  history: Schema.Array(Schema.String),
});
export type DecisionRecord = typeof DecisionRecord.Type;

/** The whole run; the runner saves it as plan.json so a push-back can reopen it. */
export const PlanResult = Schema.Struct({
  size: PlanSize,
  writer: Schema.String,
  reviewer: Schema.String,
  /** True when no other provider was signed in, so the writer's provider reviewed in a fresh session. */
  sameProvider: Schema.Boolean,
  plan: WrittenPlan,
  decisions: Schema.Array(DecisionRecord),
  rounds: Schema.Array(ReviewRound),
  log: Schema.Array(LogEntry),
  stopReason: Schema.String,
  /** Words before the shorten turn; 0 when the plan fit without one. */
  wordsBeforeShorten: Schema.Number,
});
export type PlanResult = typeof PlanResult.Type;

export const PushBackReply = Schema.Struct({
  verdict: Schema.Literals(["defend", "change"]),
  answer: Schema.String,
  decision: Decision,
});
export type PushBackReply = typeof PushBackReply.Type;
