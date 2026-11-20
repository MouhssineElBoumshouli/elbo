// team-layer: Elbo's theme becomes the default once per device (team/mockups/slice3/README.md).
// Runs before the environment's default theme, so a theme set on the server still wins, and a
// later pick in Settings → Appearance is never overwritten.
import { ELBO_THEME_ID } from "@t3tools/shared/teamTheme";

import { setTheme } from "../../../hooks/useTheme";

const ADOPTED_KEY = "elbo:theme-adopted:v1";
const THEME_KEY = "t3code:theme";

export function startElboThemeAdoption(): void {
  try {
    if (window.localStorage.getItem(ADOPTED_KEY) !== null) return;
    const stored = window.localStorage.getItem(THEME_KEY);
    // setTheme keeps the current light/dark mode, so a fresh install still follows the OS.
    if ((stored === null || stored === "system") && !setTheme(ELBO_THEME_ID)) return;
    window.localStorage.setItem(ADOPTED_KEY, "1");
  } catch {}
}
