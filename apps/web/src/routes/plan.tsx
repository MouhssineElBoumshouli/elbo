// team-layer: planning a project (team/PLANNING_FEATURE_PLAN.md slice 4).
import { EnvironmentId, ProjectId } from "@t3tools/contracts";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { PlanPage } from "../components/team/planning/PlanPage";

export interface PlanSearch {
  readonly environmentId?: EnvironmentId;
  readonly projectId?: ProjectId;
  /** Came from "New project": offer "Plan it first" or "Start building" first. */
  readonly fresh?: boolean;
  /** A plan being written or written, so a reload finds it again. */
  readonly runId?: string;
}

const text = (value: unknown) => (typeof value === "string" && value.length > 0 ? value : null);

export const Route = createFileRoute("/plan")({
  beforeLoad: async ({ context }) => {
    if (
      context.authGateState.status !== "authenticated" &&
      context.authGateState.status !== "hosted-static"
    ) {
      throw redirect({ to: "/pair", replace: true });
    }
  },
  validateSearch: (raw: Record<string, unknown>): PlanSearch => {
    const environmentId = text(raw.environmentId);
    const projectId = text(raw.projectId);
    const runId = text(raw.runId);
    return {
      ...(environmentId ? { environmentId: EnvironmentId.make(environmentId) } : {}),
      ...(projectId ? { projectId: ProjectId.make(projectId) } : {}),
      ...(raw.fresh === true || raw.fresh === "true" ? { fresh: true } : {}),
      ...(runId ? { runId } : {}),
    };
  },
  component: PlanRouteView,
});

function PlanRouteView() {
  const search = Route.useSearch();
  if (search.environmentId === undefined || search.projectId === undefined) {
    return (
      <p className="p-6 text-sm text-muted-foreground">
        Open a project first, then choose Plan the next part.
      </p>
    );
  }
  return (
    <PlanPage
      // A different project starts with its own answers.
      key={`${search.environmentId}:${search.projectId}`}
      environmentId={search.environmentId}
      projectId={search.projectId}
      fresh={search.fresh === true}
      runId={search.runId}
    />
  );
}
