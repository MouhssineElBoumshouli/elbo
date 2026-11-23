// team-layer: the plan page's decision rules (team/PLANNING_FEATURE_PLAN.md section 4 step 6).
import type {
  TeamPlanDecision,
  TeamPlanDecisionStatus,
  TeamPlanDecisionStep,
  TeamPlanRunState,
} from "@t3tools/contracts";

export const DECISION_BADGE: Record<TeamPlanDecisionStatus, string> = {
  open: "Needs you",
  agreed: "Agreed",
  answered: "Answered",
  "against-advice": "Chosen against advice",
};

export const STEP_WORDS: Record<TeamPlanDecisionStep["kind"], string> = {
  "pushed-back": "pushed back",
  defended: "defended it",
  changed: "changed it",
  picked: "picked",
};

/** Why "Save the plan" can't be pressed yet; null once every decision is settled. */
export function saveBlocked(decisions: ReadonlyArray<TeamPlanDecision>): string | null {
  const open = decisions.filter((decision) => decision.status === "open");
  if (open.length === 0) return null;
  const count =
    open.length === 1 ? "1 decision still needs you" : `${open.length} decisions still need you`;
  return `${count}: ${open.map((decision) => decision.title).join(", ")}.`;
}

export const answeringText = (writer: string, kind: "push-back" | "pick") =>
  kind === "push-back"
    ? `${writer} is answering your push-back…`
    : `${writer} is updating the plan for your pick…`;

/** The run from its stream and from the last decide call: whichever changed last. */
export const newestState = (
  a: TeamPlanRunState | null | undefined,
  b: TeamPlanRunState | null,
): TeamPlanRunState | null => {
  if (a == null) return b;
  if (b === null || b.runId !== a.runId) return a;
  return b.version > a.version ? b : a;
};
