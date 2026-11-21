import { describe, expect, it } from "vite-plus/test";

import { teamGlassSupported, teamWindowMaterial } from "./teamGlass.ts";

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

  it("uses the chosen style, and stays solid while Windows' transparency effects are off", () => {
    const base = { on: true, frosted: false, supported: true, reducedTransparency: false };
    expect(teamWindowMaterial(base)).toBe("mica");
    expect(teamWindowMaterial({ ...base, frosted: true })).toBe("acrylic");
    expect(teamWindowMaterial({ ...base, frosted: true, reducedTransparency: true })).toBe("none");
    expect(teamWindowMaterial({ ...base, on: false, frosted: true })).toBe("none");
    expect(teamWindowMaterial({ ...base, supported: false })).toBe("none");
  });
});
