/**
 * team-layer: the row under a new chat's message box in simple mode (team/WINDOWS_RELEASE_PLAN.md
 * section 4c): "Just you" when solo and a "⋯" popover with the rarely used controls (machine, worktree,
 * branch), each under a label and only where this chat has it. Permissions sit by the model picker.
 * Nothing to show: no row at all.
 */
import { findProjectTeam } from "@t3tools/client-runtime/state/teamMarkers";
import type { EnvironmentId, ProjectId } from "@t3tools/contracts";
import { EllipsisIcon } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { useTeamFeed } from "~/state/teamFeed";

import { ComposerControl } from "../../chat/ComposerControl";
import { ComposerSurface } from "../../chat/ComposerSurface";
import { useComposerMenuProps } from "../../chat/composerEventScope";
import { Popover, PopoverPopup, PopoverTrigger } from "../../ui/popover";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../../ui/tooltip";

export interface TeamMoreItem {
  readonly label: string;
  readonly rows: ReactNode;
}

/** Solo only: a team's sync state already shows in the chat header's chip. */
function TeamSoloPill() {
  return (
    <span className="shrink-0 rounded-full px-2 py-0.5 text-xs text-muted-foreground">
      Just you
    </span>
  );
}

const openRequests = new Set<() => void>();

/** Opens the "⋯" popover, for a send that still needs a choice from it. */
export function requestTeamMoreMenu(): void {
  for (const open of openRequests) open();
}

export function TeamMoreMenu(props: { readonly items: ReadonlyArray<TeamMoreItem> }) {
  const composerMenuProps = useComposerMenuProps();
  const [open, setOpen] = useState(false);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- subscribes to open requests from the composer's send
  useEffect(() => {
    const request = () => setOpen(true);
    openRequests.add(request);
    return () => {
      openRequests.delete(request);
    };
  }, []);
  const names = props.items.map((item) => item.label.toLowerCase()).join(", ");
  return (
    <Popover open={open} onOpenChange={setOpen}>
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
      {/* Kept mounted: the branch picker sets a new chat's base branch even while this is closed. */}
      <PopoverPopup
        side="top"
        align="end"
        width="sm"
        padding="compact"
        keepMounted
        {...composerMenuProps}
      >
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
  const solo = team?.solo === true;
  if (!solo && props.more.length === 0) return null;
  return (
    <ComposerSurface.ContextStrip
      data-team-simple-strip
      className="gap-1.5 text-xs font-normal text-foreground/70 dark:text-muted-foreground"
    >
      {solo ? <TeamSoloPill /> : null}
      {props.more.length > 0 ? <TeamMoreMenu items={props.more} /> : null}
    </ComposerSurface.ContextStrip>
  );
}
