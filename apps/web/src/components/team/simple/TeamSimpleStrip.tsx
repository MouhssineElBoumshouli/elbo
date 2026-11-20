/**
 * team-layer: the row under a new chat's message box in simple mode (team/WINDOWS_RELEASE_PLAN.md
 * section 4c): the team state, what the agent may do, and "More options", which brings back
 * upstream's worktree and branch pickers. "Fewer options" there leads back here.
 */
import { findProjectTeam } from "@t3tools/client-runtime/state/teamMarkers";
import type { EnvironmentId, ProjectId } from "@t3tools/contracts";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import { useTeamFeed } from "~/state/teamFeed";

import { ComposerSurface } from "../../chat/ComposerSurface";
import { syncLabel } from "../TeamPresenceChip";
import { setTeamSimpleMode } from "./simpleMode";

const LINK =
  "shrink-0 cursor-pointer rounded-sm px-1 text-xs text-muted-foreground underline decoration-border underline-offset-3 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset";

function TeamStatePill(props: {
  readonly environmentId: EnvironmentId;
  readonly projectId: ProjectId;
}) {
  const team = findProjectTeam(useTeamFeed(props.environmentId), props.projectId)?.team;
  if (!team) return null;
  if (team.solo) {
    return (
      <span className="shrink-0 rounded-full px-2 py-0.5 text-xs text-muted-foreground">
        Just you
      </span>
    );
  }
  const { text, warn } = syncLabel(team.sync);
  return (
    <span
      data-team-simple-state
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
        warn ? "bg-warning/14 text-warning-foreground" : "bg-primary/10 text-primary",
      )}
    >
      Team · {text}
    </span>
  );
}

export function TeamSimpleStrip(props: {
  readonly environmentId: EnvironmentId;
  readonly projectId: ProjectId;
  /** Upstream's permissions control for a new chat; its label is in plain words here. */
  readonly trailing?: ReactNode;
}) {
  return (
    <ComposerSurface.ContextStrip
      data-team-simple-strip
      className="gap-1.5 text-xs font-normal text-foreground/70 dark:text-muted-foreground"
    >
      <TeamStatePill environmentId={props.environmentId} projectId={props.projectId} />
      <button type="button" className={LINK} onClick={() => setTeamSimpleMode(false)}>
        More options
      </button>
      {props.trailing}
    </ComposerSurface.ContextStrip>
  );
}

export function TeamFewerOptions() {
  return (
    <button type="button" className={LINK} onClick={() => setTeamSimpleMode(true)}>
      Fewer options
    </button>
  );
}
