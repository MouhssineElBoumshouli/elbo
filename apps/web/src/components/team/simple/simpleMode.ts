// team-layer: simple mode (team/WINDOWS_RELEASE_PLAN.md section 4c), one per-device choice, on
// until the person turns it off in Settings → General.
import { deviceFlag, readDeviceFlag } from "../deviceFlag";

/** Upstream's browser tests turn this off in their setup, so they keep testing upstream's UI. */
export const TEAM_SIMPLE_MODE_DEFAULT = { on: true };

const simpleMode = deviceFlag("elbo:simple-mode:v1", () => TEAM_SIMPLE_MODE_DEFAULT.on);

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
