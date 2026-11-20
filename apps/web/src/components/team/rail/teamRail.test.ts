import { describe, expect, it } from "vite-plus/test";

import { teamRailActive, teamSetupNeedsYou } from "./teamRail";

describe("teamRailActive", () => {
  it.each([
    ["/settings/setup", "setup"],
    ["/settings", "settings"],
    ["/settings/providers", "settings"],
    ["/settings-old", "chats"],
    ["/team", "team"],
    ["/", "chats"],
    ["/draft/abc", "chats"],
    ["/env-1/thread-1", "chats"],
    ["/usage", "chats"],
  ] as const)("%s → %s", (pathname, entry) => {
    expect(teamRailActive(pathname)).toBe(entry);
  });
});

describe("teamSetupNeedsYou", () => {
  it("counts only rows waiting for the person", () => {
    expect(
      teamSetupNeedsYou([
        { state: "ready" },
        { state: "needsAction" },
        { state: "off" },
        { state: "info" },
        { state: "checking" },
        { state: "needsAction" },
      ]),
    ).toBe(2);
    expect(teamSetupNeedsYou([{ state: "ready" }, { state: "info" }])).toBe(0);
  });
});
