import { describe, expect, it } from "vite-plus/test";

import { teamGlassActive, teamGlassSupported } from "./teamGlass.ts";

describe("glass", () => {
  it("is offered on Windows 11 22H2 and later only", () => {
    expect(teamGlassSupported("win32", "10.0.22621")).toBe(true);
    expect(teamGlassSupported("win32", "10.0.22631")).toBe(true);
    expect(teamGlassSupported("win32", "10.0.22000")).toBe(false);
    expect(teamGlassSupported("win32", "10.0.19045")).toBe(false);
    expect(teamGlassSupported("win32", "garbage")).toBe(false);
    expect(teamGlassSupported("darwin", "15.1.0")).toBe(false);
    expect(teamGlassSupported("linux", "6.8.0")).toBe(false);
  });

  it("stays solid while Windows' transparency effects are off", () => {
    const supported = true;
    expect(teamGlassActive({ on: true, supported, reducedTransparency: false })).toBe(true);
    expect(teamGlassActive({ on: true, supported, reducedTransparency: true })).toBe(false);
    expect(teamGlassActive({ on: false, supported, reducedTransparency: false })).toBe(false);
    expect(teamGlassActive({ on: true, supported: false, reducedTransparency: false })).toBe(false);
  });
});
