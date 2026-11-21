import { describe, expect, it } from "vite-plus/test";

import { ELBO_THEME } from "./teamTheme.ts";

// Status and highlight colors have a hue; every grey does not. The accent is neutral for now:
// once it gets a color, add the keys accentColors() fills to this list.
const HUED = /^(error|warning|searchMatch)/u;

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
});
