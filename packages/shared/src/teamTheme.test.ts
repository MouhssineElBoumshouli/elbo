import { describe, expect, it } from "vite-plus/test";

import { contrastRatio, ELBO_THEME, onAccent } from "./teamTheme.ts";

// Status and highlight colors have a hue, and so do the keys accentColors() fills; greys do not.
const HUED =
  /^(error|warning|searchMatch|focus|accent|update|message(Surface|Action)|terminal(Cursor|Selection))/u;

describe("Elbo theme", () => {
  it("has neutral greys only, so the accent is the one tint", () => {
    for (const colors of [ELBO_THEME.colors, ELBO_THEME.variants!.dark!]) {
      const tinted = Object.entries(colors).filter(([key, hex]) => {
        if (HUED.test(key)) return false;
        const [r, g, b] = [1, 3, 5].map((start) => hex.slice(start, start + 2));
        return r !== g || g !== b;
      });
      expect(tinted).toEqual([]);
    }
  });

  it("colors links and text with a shade that reads on the canvas", () => {
    const light = ELBO_THEME.colors;
    const dark = ELBO_THEME.variants!.dark!;
    expect(light.updateForeground).toBe("#15355b");
    expect(dark.updateForeground).toBe("#21b0c0");
    for (const colors of [light, dark]) {
      expect(contrastRatio(colors.updateForeground, colors.canvas)).toBeGreaterThanOrEqual(4.5);
      expect(
        contrastRatio(colors.accentSurfaceForeground, colors.accentSurface),
      ).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("puts the text with more contrast on the accent", () => {
    expect(onAccent("#21b0c0")).toBe("#141414");
    expect(onAccent("#15355b")).toBe("#ffffff");
    expect(onAccent("#ededed")).toBe("#141414");
    expect(onAccent("#1a1a1a")).toBe("#ffffff");
  });
});
