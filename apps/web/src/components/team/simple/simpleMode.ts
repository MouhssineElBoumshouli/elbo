// team-layer: simple mode (team/WINDOWS_RELEASE_PLAN.md section 4c), one per-device choice, on
// until the person turns it off ("More options" in the composer, or Settings → General).
import type { RuntimeMode } from "@t3tools/contracts";
import { useSyncExternalStore } from "react";

const STORAGE_KEY = "elbo:simple-mode:v1";

/** Upstream's browser tests turn this off in their setup, so they keep testing upstream's UI. */
export const TEAM_SIMPLE_MODE_DEFAULT = { on: true };

const listeners = new Set<() => void>();

export function readTeamSimpleMode(stored: string | null): boolean {
  if (stored === "on") return true;
  if (stored === "off") return false;
  return TEAM_SIMPLE_MODE_DEFAULT.on;
}

function read(): boolean {
  try {
    return readTeamSimpleMode(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return TEAM_SIMPLE_MODE_DEFAULT.on;
  }
}

export function setTeamSimpleMode(on: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {}
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useTeamSimpleMode(): boolean {
  return useSyncExternalStore(subscribe, read, () => TEAM_SIMPLE_MODE_DEFAULT.on);
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

/** The access label shown in simple mode, or null for upstream's own. */
export function useTeamAccessWord(mode: RuntimeMode): string | null {
  return useTeamSimpleMode() ? teamAccessWord(mode) : null;
}
