/**
 * team-layer: the left rail (team/WINDOWS_RELEASE_PLAN.md section 6): Chats, Team (Today when
 * solo), Setup with a dot while something needs the person, and Settings. Always the same four
 * places, words under the icons. Wide windows only; phones keep the sidebar sheet.
 */
import { findProjectTeam } from "@t3tools/client-runtime/state/teamMarkers";
import type { EnvironmentId } from "@t3tools/contracts";
import { useLocation, useNavigate, useRouter, useSearch } from "@tanstack/react-router";
import {
  HouseIcon,
  ListChecksIcon,
  type LucideIcon,
  MessagesSquareIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";
import { memo, useEffect } from "react";

import { useHandleNewThread } from "~/hooks/useHandleNewThread";
import { cn } from "~/lib/utils";
import { usePrimaryEnvironmentId } from "~/state/environments";
import { useTeamFeed } from "~/state/teamFeed";
import { resolveThreadRouteTarget } from "~/threadRoutes";

import { useSidebar } from "../../ui/sidebar";
import { useTeamSetupRows } from "../setup/TeamSetupPanel";
import { teamHomeTarget } from "../teamHomeTarget";
import { TEAM_SETUP_PATH, teamRailActive, teamSetupNeedsYou } from "./teamRail";

function RailButton(props: {
  readonly label: string;
  readonly icon: LucideIcon;
  readonly active: boolean;
  readonly onClick: () => void;
  readonly dot?: string | undefined;
}) {
  const Icon = props.icon;
  return (
    <button
      type="button"
      aria-current={props.active ? "page" : undefined}
      onClick={props.onClick}
      data-team-rail-entry={props.label}
      className={cn(
        "relative flex w-15 cursor-pointer flex-col items-center gap-1 rounded-lg pt-2 pb-1.5 text-2xs font-medium text-muted-foreground outline-none hover:bg-foreground/5 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        props.active && "bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary",
      )}
    >
      {props.active ? (
        <span
          aria-hidden
          className="absolute -start-1.5 top-2.5 bottom-2.5 w-[3px] rounded-full bg-primary"
        />
      ) : null}
      <Icon aria-hidden className="size-5" strokeWidth={1.7} />
      {props.label}
      {props.dot ? (
        <span className="absolute end-3.5 top-1.5 size-2 rounded-full bg-warning ring-2 ring-sidebar">
          <span className="sr-only">{props.dot}</span>
        </span>
      ) : null}
    </button>
  );
}

/** The dot asks the server once per start; "Check again" on the page refreshes it. */
function SetupEntry(props: {
  readonly environmentId: EnvironmentId;
  readonly active: boolean;
  readonly onClick: () => void;
}) {
  const needsYou = teamSetupNeedsYou(useTeamSetupRows(props.environmentId).rows);
  return (
    <RailButton
      label="Setup"
      icon={ListChecksIcon}
      active={props.active}
      onClick={props.onClick}
      dot={
        needsYou === 0
          ? undefined
          : needsYou === 1
            ? "1 thing needs you"
            : `${needsYou} things need you`
      }
    />
  );
}

/** The chat "Chats" leads back to, kept across the rail's re-renders. */
let lastChatHref: string | null = null;

export const TeamRail = memo(function TeamRail() {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useLocation({ select: (location) => location.pathname });
  const active = teamRailActive(pathname);
  const environmentId = usePrimaryEnvironmentId();
  const { open, setOpen } = useSidebar();
  const { activeThread, activeDraftThread } = useHandleNewThread();
  const target = teamHomeTarget({
    thread: activeThread,
    draft: activeDraftThread,
    page: useSearch({ strict: false }),
  });
  const teams = useTeamFeed(target.environmentId ?? null);
  const isTeam = findProjectTeam(teams, target.projectId ?? null)?.team.solo === false;

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- remembers the last open chat from the router, so Chats leads back to it
  useEffect(() => {
    const record = () => {
      const params = router.state.matches.at(-1)?.params ?? {};
      if (resolveThreadRouteTarget(params) !== null) lastChatHref = router.state.location.href;
    };
    record();
    return router.subscribe("onResolved", record);
  }, [router]);

  const openChats = () => {
    if (!open) setOpen(true);
    if (active !== "chats" || pathname === "/usage") void navigate({ href: lastChatHref ?? "/" });
  };

  return (
    <nav
      data-team-rail=""
      aria-label="Places"
      className="sticky top-0 z-20 hidden h-dvh w-(--team-rail-width) shrink-0 flex-col items-center gap-1 border-e border-sidebar-border bg-sidebar pt-3 pb-3 text-sidebar-foreground md:flex"
    >
      <div
        aria-hidden
        className="mb-3 grid size-8 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground"
      >
        e
      </div>
      <RailButton
        label="Chats"
        icon={MessagesSquareIcon}
        active={active === "chats"}
        onClick={openChats}
      />
      <RailButton
        label={isTeam ? "Team" : "Today"}
        icon={isTeam ? UsersIcon : HouseIcon}
        active={active === "team"}
        onClick={() => void navigate({ to: "/team", search: target })}
      />
      {environmentId === null ? null : (
        <SetupEntry
          environmentId={environmentId}
          active={active === "setup"}
          onClick={() => void navigate({ to: TEAM_SETUP_PATH })}
        />
      )}
      <span className="flex-1" />
      <RailButton
        label="Settings"
        icon={SettingsIcon}
        active={active === "settings"}
        onClick={() => void navigate({ to: "/settings" })}
      />
    </nav>
  );
});
