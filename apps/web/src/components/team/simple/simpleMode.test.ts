import { describe, expect, it } from "vite-plus/test";

import { readTeamSimpleMode } from "./simpleMode";

describe("simple mode", () => {
  it("is on until the person turns it off, and back on", () => {
    expect(readTeamSimpleMode(null)).toBe(true);
    expect(readTeamSimpleMode("garbage")).toBe(true);
    expect(readTeamSimpleMode("off")).toBe(false);
    expect(readTeamSimpleMode("on")).toBe(true);
  });
});
