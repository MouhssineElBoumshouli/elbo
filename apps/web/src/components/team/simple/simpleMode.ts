// team-layer: simple mode (team/WINDOWS_RELEASE_PLAN.md section 4c), one per-device choice, on
// until the person turns it off in Settings → General. The composer's "More options" is a choice
// of its own: it opens the hidden controls and leaves the rest of simple mode as it is.
import type { RuntimeMode } from "@t3tools/contracts";

import { deviceFlag, readDeviceFlag } from "../deviceFlag";

/** Upstream's browser tests turn this off in their setup, so they keep testing upstream's UI. */
export const TEAM_SIMPLE_MODE_DEFAULT = { on: true };

const simpleMode = deviceFlag("elbo:simple-mode:v1", () => TEAM_SIMPLE_MODE_DEFAULT.on);
const composerOptions = deviceFlag("elbo:composer-options:v1", () => false);

export const readTeamSimpleMode = (stored: string | null): boolean =>
  readDeviceFlag(stored, TEAM_SIMPLE_MODE_DEFAULT.on);

export const readTeamSimpleModeNow = simpleMode.read;
export const setTeamSimpleMode = simpleMode.set;
export const useTeamSimpleMode = simpleMode.use;

/** For stores outside React that derive from simple mode; returns the unsubscribe. */
export const onTeamSimpleModeChange = (listener: () => void): (() => void) =>
  simpleMode.subscribe(listener);

/** Simple mode starts each chat with the details panel closed, until "Changes" opens it. */
export const teamThreadPanelStartsOpen = (): boolean => !simpleMode.read();

export const setTeamComposerOptions = composerOptions.set;

/**
 * Which strip sits under a new chat: simple mode's, upstream's with "Fewer options" (simple mode
 * with More options open), or upstream's own (simple mode off).
 */
export type TeamComposerStrip = "simple" | "options" | "upstream";

export function teamComposerStrip(simple: boolean, optionsOpen: boolean): TeamComposerStrip {
  if (!simple) return "upstream";
  return optionsOpen ? "options" : "simple";
}

export function useTeamComposerStrip(): TeamComposerStrip {
  return teamComposerStrip(simpleMode.use(), composerOptions.use());
}

/** What the agent may do, in plain words; upstream's names stay in the menu. */
const ACCESS_WORDS: Readonly<Record<RuntimeMode, string>> = {
  "full-access": "Can edit files",
  "auto-accept-edits": "Can edit, asks for commands",
  auto: "Decides when to ask",
  "approval-required": "Asks before changes",
};

export function teamAccessWord(mode: RuntimeMode): string {
  return ACCESS_WORDS[mode];
}

/** The access label shown in simple mode's strip, or null where upstream's picker shows. */
export function useTeamAccessWord(mode: RuntimeMode): string | null {
  return useTeamComposerStrip() === "simple" ? teamAccessWord(mode) : null;
}
