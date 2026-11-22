// team-layer: the name upstream's desktop messages show: Elbo, Elbo (Beta) or Elbo (Dev).
// Read once at load, the same way DesktopEnvironment decides it, so module-level texts can use it.
import * as Electron from "electron";
import { TEAM_IDENTITY, teamDisplayName } from "@t3tools/shared/teamIdentity";

import { isNightlyDesktopVersion } from "../updates/updateChannels.ts";

function resolveAppDisplayName(): string {
  if (process.env.VITE_DEV_SERVER_URL?.trim()) return teamDisplayName("dev");
  try {
    return teamDisplayName(
      isNightlyDesktopVersion(Electron.app.getVersion()) ? "nightly" : "stable",
    );
  } catch {
    // Outside Electron (unit tests, mocked modules) `app` is missing or throws on access.
    return TEAM_IDENTITY.name;
  }
}

export const APP_DISPLAY_NAME = resolveAppDisplayName();
