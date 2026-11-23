// team-layer: the planning questions as data (team/PLANNING_FEATURE_PLAN.md section 4): the answers,
// the brief they become, the size sentence, and the words on the progress line and error card.
import {
  type ServerProvider,
  suggestTeamPlanSize,
  type TeamPlanBrief,
  teamPlanHours,
  type TeamPlanRunState,
  type TeamPlanSize,
} from "@t3tools/contracts";
import { classifyTurnFailure } from "@t3tools/shared/limitFailure";

import { aiName, limitCardWords, resetPhrase } from "../limits/limitCard.logic";

export type DeadlineUnit = "days" | "weeks" | "months";

export interface PlanPersonAnswer {
  readonly name: string;
  /** The Elbo team member this row is, or null for someone not in Elbo yet. */
  readonly memberId: string | null;
  readonly skills: string;
  /** Hours a week, or hours in total when the deadline is under a week. */
  readonly hours: string;
}

/** A question the person answered "Not sure, suggest something". */
export type PlanQuestionId =
  | "what"
  | "users"
  | "mustHaves"
  | "niceToHaves"
  | "deadline"
  | "budget"
  | "outsideRules"
  | "ai"
  | "feel";

export interface PlanAnswers {
  readonly what: string;
  readonly users: ReadonlyArray<string>;
  readonly mustHaves: ReadonlyArray<string>;
  readonly niceToHaves: string;
  readonly deadlineAmount: string;
  readonly deadlineUnit: DeadlineUnit;
  readonly people: ReadonlyArray<PlanPersonAnswer>;
  readonly budget: string;
  readonly outsideRules: string;
  readonly ai: string;
  readonly feel: string;
  readonly notes: string;
  readonly notSure: ReadonlyArray<PlanQuestionId>;
}

const MUST_HAVE_LINES = 5;
export const USER_CHOICES = ["Classmates", "A teacher", "The public", "Just me"] as const;
export const BUDGET_CHOICES = ["Free only", "A few euros a month", "More"] as const;
export const AI_CHOICES = ["No AI", "Yes, AI is part of it"] as const;
export const FEEL_CHOICES = ["Calm", "Playful", "Professional"] as const;
/** When the deadline is "not sure", plans assume this. */
const DEFAULT_DEADLINE_DAYS = 42;
const UNIT_DAYS: Record<DeadlineUnit, number> = { days: 1, weeks: 7, months: 30 };

export function emptyAnswers(people: ReadonlyArray<PlanPersonAnswer>): PlanAnswers {
  return {
    what: "",
    users: [],
    mustHaves: Array.from({ length: MUST_HAVE_LINES }, () => ""),
    niceToHaves: "",
    deadlineAmount: "",
    deadlineUnit: "weeks",
    people,
    budget: "",
    outsideRules: "",
    ai: "",
    feel: "",
    notes: "",
    notSure: [],
  };
}

const lines = (text: string) =>
  text
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter(Boolean);

function deadlineDays(answers: PlanAnswers): number {
  const amount = Number(answers.deadlineAmount);
  if (answers.notSure.includes("deadline") || !Number.isFinite(amount) || amount <= 0) {
    return DEFAULT_DEADLINE_DAYS;
  }
  return Math.round(amount * UNIT_DAYS[answers.deadlineUnit]);
}

/** Hours are per week, unless the whole project is under a week. */
export const hoursPerWeek = (answers: PlanAnswers) => deadlineDays(answers) >= 7;

/** The brief every planning turn reads. An empty answer means "not sure, suggest something". */
export function briefFromAnswers(answers: PlanAnswers): TeamPlanBrief {
  const sure = (id: PlanQuestionId, value: string) =>
    answers.notSure.includes(id) ? "" : value.trim();
  const days = deadlineDays(answers);
  const weeks = days / 7;
  return {
    what: sure("what", answers.what),
    users: sure("users", answers.users.join(", ")),
    mustHaves: answers.notSure.includes("mustHaves")
      ? []
      : answers.mustHaves
          .map((line) => line.trim())
          .filter(Boolean)
          .slice(0, MUST_HAVE_LINES),
    niceToHaves: answers.notSure.includes("niceToHaves") ? [] : lines(answers.niceToHaves),
    deadline: answers.notSure.includes("deadline")
      ? ""
      : `${answers.deadlineAmount.trim()} ${answers.deadlineUnit}`,
    deadlineDays: days,
    people: answers.people
      .filter((person) => person.name.trim().length > 0)
      .map((person) => {
        const hours = Math.max(0, Number(person.hours) || 0);
        return {
          name: person.name.trim(),
          skills: person.skills
            .split(",")
            .map((skill) => skill.trim())
            .filter(Boolean),
          hours: Math.round(hoursPerWeek(answers) ? hours * weeks : hours),
        };
      }),
    budget: sure("budget", answers.budget),
    outsideRules: answers.notSure.includes("outsideRules") ? [] : lines(answers.outsideRules),
    ai: sure("ai", answers.ai),
    feel: sure("feel", answers.feel),
    notes: answers.notes.trim(),
  };
}

export const suggestedSize = (brief: TeamPlanBrief): TeamPlanSize =>
  suggestTeamPlanSize(brief.people.length, teamPlanHours(brief), brief.deadlineDays);

function deadlineWords(days: number): string {
  if (days % 7 === 0 && days >= 14) return `${days / 7} weeks`;
  if (days === 7) return "1 week";
  return days === 1 ? "1 day" : `${days} days`;
}

/** "This looks like a medium project: 3 people, 6 weeks." */
export function sizeSentence(brief: TeamPlanBrief, size: TeamPlanSize): string {
  const people = brief.people.length === 1 ? "1 person" : `${brief.people.length} people`;
  return `This looks like a ${size} project: ${people}, ${deadlineWords(brief.deadlineDays)}.`;
}

export const SIZE_HINTS: Record<TeamPlanSize, string> = {
  small: "One page and a to-do list.",
  medium: "All the parts, kept short.",
  large: "The full plan, with a schedule by week.",
};

/** The progress line while the plan is being written and reviewed. */
export function progressText(state: TeamPlanRunState): string {
  const writer = state.writer.name;
  const reviewer = state.reviewer.name;
  if (state.status === "done") return "The plan is ready.";
  if (state.status === "stopped") return "Stopped. Nothing was saved.";
  if (state.status === "failed") return "The plan could not be finished.";
  switch (state.step) {
    case "reviewing":
      return state.round > 1 ? `${reviewer} is checking the fixes` : `${reviewer} is reviewing it`;
    case "fixing":
      return `${writer} is fixing ${state.points === 1 ? "1 point" : `${state.points} points`}`;
    case "shortening":
      return `${writer} is making it shorter`;
    default:
      return `${writer} is writing the plan`;
  }
}

/** Said under the progress line when one AI does both jobs. */
export function sameProviderNote(state: TeamPlanRunState): string | null {
  return state.sameProvider
    ? `Only ${state.writer.name} is connected, so it reviews its own plan in a fresh session.`
    : null;
}

/** An error in the limit card's words when an account ran out; else the message as it came. */
export function planErrorWords(
  state: TeamPlanRunState,
  provider: ServerProvider | undefined,
): { readonly title: string; readonly description: string } {
  const message = state.error?.message ?? "";
  const kind = classifyTurnFailure({
    class: state.error?.failureClass ?? null,
    code: state.error?.code ?? null,
    message,
    resetAt: null,
  });
  if (kind.kind !== "other") {
    return limitCardWords(
      kind.kind,
      provider,
      kind.kind === "limit" ? resetPhrase(null, kind.resetText) : null,
      state.error?.driver ?? provider?.driver ?? "",
    );
  }
  const name = aiName(state.error?.driver ?? "");
  return {
    title: `${name.length > 0 ? name : "The AI"} could not finish the plan`,
    description: message.length > 0 ? message : "Try again in a moment.",
  };
}
