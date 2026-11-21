import { describe, expect, it } from "vite-plus/test";

import { SETTINGS_NAV_GROUPS } from "../../settings/settingsSearch";
import { teamSettingsNavGroups, teamSettingsTitle } from "./teamSettings";

const paths = (groups: ReturnType<typeof teamSettingsNavGroups>) =>
  groups.flatMap((group) => group.paths);

describe("teamSettingsNavGroups", () => {
  it("shows only the everyday sections in simple mode", () => {
    expect(
      paths(teamSettingsNavGroups(SETTINGS_NAV_GROUPS, { simple: true, advanced: false })),
    ).toEqual(["/settings/general", "/settings/appearance", "/settings/setup", "/settings/about"]);
  });

  it("shows every section with advanced settings on, or simple mode off", () => {
    const all = paths(SETTINGS_NAV_GROUPS);
    expect(
      paths(teamSettingsNavGroups(SETTINGS_NAV_GROUPS, { simple: true, advanced: true })),
    ).toEqual(all);
    expect(
      paths(teamSettingsNavGroups(SETTINGS_NAV_GROUPS, { simple: false, advanced: false })),
    ).toEqual(all);
  });

  it("leaves out an everyday section the app does not have here", () => {
    const groups = [
      { heading: "Preferences", paths: ["/settings/general", "/settings/chat"] as const },
    ];
    expect(paths(teamSettingsNavGroups(groups, { simple: true, advanced: false }))).toEqual([
      "/settings/general",
    ]);
  });
});

describe("teamSettingsTitle", () => {
  it("says chat instead of thread only in simple mode", () => {
    expect(teamSettingsTitle("Thread notifications", true)).toBe("Chat notifications");
    expect(teamSettingsTitle("Threads", true)).toBe("Chats");
    expect(teamSettingsTitle("Thread notifications", false)).toBe("Thread notifications");
    expect(teamSettingsTitle("Appearance", true)).toBe("Appearance");
  });
});
