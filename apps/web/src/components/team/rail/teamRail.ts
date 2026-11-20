// team-layer: the left rail's logic (team/WINDOWS_RELEASE_PLAN.md section 6): which entry is
// current, and when Setup carries its "needs you" dot.
import type { TeamSetupRow } from "@t3tools/shared/teamSetupRows";

export type TeamRailEntry = "chats" | "team" | "setup" | "settings";

export const TEAM_SETUP_PATH = "/settings/setup";

export function teamRailActive(pathname: string): TeamRailEntry {
  if (pathname === TEAM_SETUP_PATH) return "setup";
  if (pathname === "/settings" || pathname.startsWith("/settings/")) return "settings";
  if (pathname === "/team") return "team";
  return "chats";
}

/** Rows that wait for the person; "off" agents and "good to know" rows do not. */
export function teamSetupNeedsYou(rows: ReadonlyArray<Pick<TeamSetupRow, "state">>): number {
  return rows.filter((row) => row.state === "needsAction").length;
}
