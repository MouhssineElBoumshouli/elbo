/**
 * team-layer: the row under a new chat's message box in simple mode (team/WINDOWS_RELEASE_PLAN.md
 * section 4c): the team state and a "⋯" popover with the rarely used controls (machine, worktree,
 * branch), each under a label and only where this chat has it. Permissions sit by the model picker.
 * Nothing to show: no row at all.
 */
import { findProjectTeam } from "@t3tools/client-runtime/state/teamMarkers";
import type { EnvironmentId, ProjectId } from "@t3tools/contracts";
import { EllipsisIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import { useTeamFeed } from "~/state/teamFeed";

import { ComposerControl } from "../../chat/ComposerControl";
import { ComposerSurface } from "../../chat/ComposerSurface";
import { useComposerMenuProps } from "../../chat/composerEventScope";
import { Popover, PopoverPopup, PopoverTrigger } from "../../ui/popover";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../ui/tooltip";
import { syncLabel } from "../TeamPresenceChip";

type ProjectTeam = NonNullable<ReturnType<typeof findProjectTeam>>["team"];

export interface TeamMoreItem {
  readonly label: string;
  readonly rows: ReactNode;
}

function TeamStatePill(props: { readonly team: ProjectTeam }) {
  if (props.team.solo) {
    return (
      <span className="shrink-0 rounded-full px-2 py-0.5 text-xs text-muted-foreground">
        Just you
      </span>
    );
  }
  const { text, warn } = syncLabel(props.team.sync);
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

function TeamMoreMenu(props: { readonly items: ReadonlyArray<TeamMoreItem> }) {
  const composerMenuProps = useComposerMenuProps();
  const names = props.items.map((item) => item.label.toLowerCase()).join(", ");
  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger
          render={
            <PopoverTrigger
              render={
                <ComposerControl
                  size="xs"
                  className="ms-auto"
                  aria-label={`More: ${names}`}
                  data-team-more
                />
              }
            />
          }
        >
          <EllipsisIcon aria-hidden="true" className="size-4" />
        </TooltipTrigger>
        <TooltipPopup side="top">{props.items.map((item) => item.label).join(" · ")}</TooltipPopup>
      </Tooltip>
      <PopoverPopup side="top" align="end" width="sm" padding="compact" {...composerMenuProps}>
        <div className="flex flex-col gap-3">
          {props.items.map((item) => (
            <div key={item.label} className="flex flex-col gap-1">
              <div className="text-xs font-medium text-muted-foreground">{item.label}</div>
              {item.rows}
            </div>
          ))}
        </div>
      </PopoverPopup>
    </Popover>
  );
}

export function TeamSimpleStrip(props: {
  readonly environmentId: EnvironmentId;
  readonly projectId: ProjectId;
  readonly more: ReadonlyArray<TeamMoreItem>;
}) {
  const team = findProjectTeam(useTeamFeed(props.environmentId), props.projectId)?.team;
  if (!team && props.more.length === 0) return null;
  return (
    <ComposerSurface.ContextStrip
      data-team-simple-strip
      className="gap-1.5 text-xs font-normal text-foreground/70 dark:text-muted-foreground"
    >
      {team ? <TeamStatePill team={team} /> : null}
      {props.more.length > 0 ? <TeamMoreMenu items={props.more} /> : null}
    </ComposerSurface.ContextStrip>
  );
}
