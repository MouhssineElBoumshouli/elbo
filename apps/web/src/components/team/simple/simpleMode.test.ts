import { describe, expect, it } from "vite-plus/test";

import { readTeamSimpleMode, teamAccessWord, teamComposerStrip } from "./simpleMode";

describe("simple mode", () => {
  it("is on until the person turns it off, and back on", () => {
    expect(readTeamSimpleMode(null)).toBe(true);
    expect(readTeamSimpleMode("garbage")).toBe(true);
    expect(readTeamSimpleMode("off")).toBe(false);
    expect(readTeamSimpleMode("on")).toBe(true);
  });

  it("says what the agent may do in plain words", () => {
    expect(teamAccessWord("full-access")).toBe("Can edit files");
    expect(teamAccessWord("approval-required")).toBe("Asks before changes");
  });

  it("opens the composer's hidden controls without leaving simple mode", () => {
    expect(teamComposerStrip(true, false)).toBe("simple");
    expect(teamComposerStrip(true, true)).toBe("options");
    expect(teamComposerStrip(false, false)).toBe("upstream");
    expect(teamComposerStrip(false, true)).toBe("upstream");
  });
});
