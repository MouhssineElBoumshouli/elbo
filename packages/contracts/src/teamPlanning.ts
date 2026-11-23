/**
 * Planning a project before building it (fork-only, team/PLANNING_FEATURE_PLAN.md): the brief the
 * questions become, a planning run's progress and result, and the save preview. The server runs
 * one AI writing and the other reviewing; clients only show these shapes.
 */
import * as Schema from "effect/Schema";

import { ProjectId } from "./baseSchemas.ts";

/** One person on the project. An empty answer anywhere means "not sure, suggest something". */
export const TeamPlanPerson = Schema.Struct({
  /** For a team member, their Elbo name, so plan tasks match their login. */
  name: Schema.String,
  skills: Schema.Array(Schema.String),
  /** Hours this person can give before the deadline, in total. */
  hours: Schema.Number,
});
export type TeamPlanPerson = typeof TeamPlanPerson.Type;

/** The answers to the planning questions, as every planning turn reads them. */
export const TeamPlanBrief = Schema.Struct({
  what: Schema.String,
  users: Schema.String,
  mustHaves: Schema.Array(Schema.String),
  niceToHaves: Schema.Array(Schema.String),
  deadline: Schema.String,
  deadlineDays: Schema.Number,
  people: Schema.Array(TeamPlanPerson),
  budget: Schema.String,
  outsideRules: Schema.Array(Schema.String),
  ai: Schema.String,
  feel: Schema.String,
  notes: Schema.String,
});
export type TeamPlanBrief = typeof TeamPlanBrief.Type;

export const TeamPlanSize = Schema.Literals(["small", "medium", "large"]);
export type TeamPlanSize = typeof TeamPlanSize.Type;

export const teamPlanHours = (brief: Pick<TeamPlanBrief, "people">) =>
  brief.people.reduce((sum, person) => sum + person.hours, 0);

/** The size the questions suggest; the person can change it. */
export function suggestTeamPlanSize(people: number, hours: number, days: number): TeamPlanSize {
  if (people <= 1 && hours <= 20) return "small";
  if (people >= 3 && days >= 70) return "large";
  return "medium";
}

export const TeamPlanStartInput = Schema.Struct({
  projectId: ProjectId,
  brief: TeamPlanBrief,
  size: TeamPlanSize,
});
export type TeamPlanStartInput = typeof TeamPlanStartInput.Type;

export const TeamPlanRunInput = Schema.Struct({ runId: Schema.String });
export type TeamPlanRunInput = typeof TeamPlanRunInput.Type;

export const TeamPlanStartResult = TeamPlanRunInput;

/** One of the person's connected AIs, as it takes part in a run. */
export const TeamPlanAgent = Schema.Struct({
  /** "codex" or "claudeAgent". */
  driver: Schema.String,
  /** "Codex" or "Claude". */
  name: Schema.String,
  model: Schema.String,
});
export type TeamPlanAgent = typeof TeamPlanAgent.Type;

export const TeamPlanStep = Schema.Literals(["writing", "reviewing", "fixing", "shortening"]);
export type TeamPlanStep = typeof TeamPlanStep.Type;

/** A blocker or should the review raised, and what the writer did with it. */
export const TeamPlanChange = Schema.Struct({
  round: Schema.Number,
  severity: Schema.Literals(["blocker", "should", "nit"]),
  /** "reviewer", or "check" for the app's own checks (word limit). */
  from: Schema.String,
  point: Schema.String,
  outcome: Schema.String,
  reason: Schema.String,
});
export type TeamPlanChange = typeof TeamPlanChange.Type;

/** "open" until the person agrees, gets an answer to a push-back, or picks against the advice. */
export const TeamPlanDecisionStatus = Schema.Literals([
  "open",
  "agreed",
  "answered",
  "against-advice",
]);
export type TeamPlanDecisionStatus = typeof TeamPlanDecisionStatus.Type;

/** One line of "How we got here". */
export const TeamPlanDecisionStep = Schema.Struct({
  kind: Schema.Literals(["pushed-back", "defended", "changed", "picked"]),
  by: Schema.String,
  text: Schema.String,
  /** The plan parts and tasks the answer rewrote, by name. */
  updated: Schema.Array(Schema.String),
});
export type TeamPlanDecisionStep = typeof TeamPlanDecisionStep.Type;

export const TeamPlanDecision = Schema.Struct({
  number: Schema.String,
  title: Schema.String,
  picked: Schema.String,
  options: Schema.Array(Schema.String),
  why: Schema.String,
  rule: Schema.String,
  /** False for a "smaller choice" past the size's decision limit. */
  main: Schema.Boolean,
  status: TeamPlanDecisionStatus,
  /** The writer's pick when the person chose against it; "" otherwise. */
  advice: Schema.String,
  risk: Schema.String,
  history: Schema.Array(TeamPlanDecisionStep),
});
export type TeamPlanDecision = typeof TeamPlanDecision.Type;

/** A finished plan as the plan page shows it. */
export const TeamPlanView = Schema.Struct({
  title: Schema.String,
  size: TeamPlanSize,
  /** The writer's plan text; the page shows the decisions after it. */
  body: Schema.String,
  decisions: Schema.Array(TeamPlanDecision),
  words: Schema.Number,
  scores: Schema.Array(Schema.Number),
  changes: Schema.Array(TeamPlanChange),
  nits: Schema.Number,
});
export type TeamPlanView = typeof TeamPlanView.Type;

export const TeamPlanRunError = Schema.Struct({
  message: Schema.String,
  /** The adapter's failure class and code, for the limit card's words. */
  failureClass: Schema.NullOr(Schema.String),
  code: Schema.NullOr(Schema.String),
  /** Which AI failed. */
  driver: Schema.NullOr(Schema.String),
});
export type TeamPlanRunError = typeof TeamPlanRunError.Type;

export const TeamPlanRunState = Schema.Struct({
  runId: Schema.String,
  projectId: ProjectId,
  status: Schema.Literals(["running", "done", "failed", "stopped"]),
  step: Schema.NullOr(TeamPlanStep),
  round: Schema.Number,
  /** How many points the writer is fixing, during "fixing". */
  points: Schema.Number,
  writer: TeamPlanAgent,
  reviewer: TeamPlanAgent,
  /** Only one AI is connected, so it reviews its own plan in a fresh session. */
  sameProvider: Schema.Boolean,
  view: Schema.NullOr(TeamPlanView),
  error: Schema.NullOr(TeamPlanRunError),
  /** The decision the writer is answering now, after a push-back or a pick. */
  answering: Schema.NullOr(
    Schema.Struct({ number: Schema.String, kind: Schema.Literals(["push-back", "pick"]) }),
  ),
  /** Goes up on every change, so a client keeps the newest of two copies. */
  version: Schema.Number,
});
export type TeamPlanRunState = typeof TeamPlanRunState.Type;

export const TeamPlanSaveFile = Schema.Struct({
  path: Schema.String,
  status: Schema.Literals(["new", "changed", "unchanged"]),
  detail: Schema.String,
});

export const TeamPlanSaveTask = Schema.Struct({
  action: Schema.Literals(["create", "update", "keep"]),
  title: Schema.String,
  owner: Schema.String,
  paths: Schema.Array(Schema.String),
  note: Schema.String,
});

/** What "Save the plan" writes: shown first, written only after the person confirms. */
export const TeamPlanSavePreview = Schema.Struct({
  /** The folder that holds `.team/`. */
  folder: Schema.String,
  files: Schema.Array(TeamPlanSaveFile),
  rules: Schema.Struct({
    added: Schema.Array(Schema.String),
    removed: Schema.Array(Schema.String),
  }),
  tasks: Schema.Array(TeamPlanSaveTask),
  /** Decisions from an earlier plan that this one doesn't have; they stay active. */
  kept: Schema.Array(Schema.Struct({ number: Schema.String, title: Schema.String })),
  saved: Schema.Boolean,
});
export type TeamPlanSavePreview = typeof TeamPlanSavePreview.Type;

export const TeamPlanDecideInput = Schema.Struct({
  runId: Schema.String,
  number: Schema.String,
  ask: Schema.Union([
    Schema.Struct({ kind: Schema.Literal("agree") }),
    Schema.Struct({ kind: Schema.Literal("pick"), option: Schema.String }),
    Schema.Struct({
      kind: Schema.Literal("push-back"),
      message: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2000)),
    }),
  ]),
});
export type TeamPlanDecideInput = typeof TeamPlanDecideInput.Type;

export class TeamPlanningError extends Schema.TaggedError<TeamPlanningError>()(
  "TeamPlanningError",
  { detail: Schema.String },
) {
  override get message(): string {
    return this.detail;
  }
}
