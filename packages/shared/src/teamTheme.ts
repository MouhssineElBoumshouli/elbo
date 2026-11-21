// team-layer: Elbo's light and dark theme (team/mockups/slice3/README.md). Type, corners and the
// chat card live in the web app's elbo.css. No value import from themePalettes.ts: web lists this
// theme next to those, and mobile has no generated styles for it (web and desktop only).
import type { ThemeColors, ThemeDefinition } from "./themePalettes.ts";

export const ELBO_THEME_ID = "elbo";

/**
 * Elbo's one accent: buttons, the current rail entry, focus, your messages. Neutral until the new
 * app icon picks a color; change it here (and in apps/web/index.html's boot copy, which a test
 * keeps in sync). Every grey below is neutral, so the accent is the only tint.
 */
const ELBO_ACCENT = { light: "#1a1a1a", dark: "#ededed" } as const;

const channels = (hex: string) =>
  [1, 3, 5].map((start) => Number.parseInt(hex.slice(start, start + 2), 16));

/** `amount` of `color` over `base`, as #rrggbb. */
function mix(color: string, base: string, amount: number): string {
  const top = channels(color);
  const bottom = channels(base);
  return `#${top
    .map((value, index) =>
      Math.round(value * amount + bottom[index]! * (1 - amount))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`;
}

/** Text that reads on the accent: near-black on a light accent, white on a dark one. */
function onAccent(accent: string): string {
  const [r, g, b] = channels(accent);
  return 0.299 * r! + 0.587 * g! + 0.114 * b! > 150 ? "#141414" : "#ffffff";
}

function accentColors(accent: string, canvas: string) {
  const foreground = onAccent(accent);
  return {
    focus: accent,
    accent,
    accentForeground: foreground,
    update: accent,
    updateForeground: accent,
    updateSurface: mix(accent, canvas, 0.1),
    accentSurface: mix(accent, canvas, 0.07),
    accentSurfaceForeground: accent,
    messageSurface: mix(accent, canvas, 0.07),
    messageAction: accent,
    messageActionForeground: foreground,
    messageActionHover: mix(accent, canvas, 0.85),
    terminalCursor: accent,
    terminalSelection: mix(accent, canvas, 0.18),
  };
}

const LIGHT_CANVAS = "#ffffff";
const LIGHT: ThemeColors = {
  ...accentColors(ELBO_ACCENT.light, LIGHT_CANVAS),
  searchMatchBackground: "#ffde8b",
  searchMatchForeground: "#21180a",
  searchMatchActiveBackground: "#eea52b",
  searchMatchActiveForeground: "#21180a",
  canvas: LIGHT_CANVAS,
  chrome: "#f3f3f3",
  toolbar: "#ffffff",
  toolbarForeground: "#1f1f1f",
  toolbarBorder: "#e6e6e6",
  toolbarControl: "#ffffff",
  toolbarControlForeground: "#1f1f1f",
  toolbarControlHover: "#f2f2f2",
  surface: "#ffffff",
  surfaceRaised: "#fbfbfb",
  surfaceOverlay: "#ffffff",
  text: "#1f1f1f",
  textMuted: "#666666",
  border: "#e6e6e6",
  input: "#d6d6d6",
  secondary: "#f4f4f4",
  secondaryForeground: "#1f1f1f",
  muted: "#f4f4f4",
  mutedForeground: "#666666",
  placeholder: "#7a7a7a",
  secondaryLabel: "#666666",
  iconMuted: "#6e6e6e",
  error: "#e5383b",
  errorForeground: "#b91c1c",
  errorSurface: "#fcebec",
  warning: "#f59e0b",
  warningForeground: "#b45309",
  warningSurface: "#fdf3e1",
  messageForeground: "#1f1f1f",
  codeBackground: "#ffffff",
  codeForeground: "#1f1f1f",
  sidebar: "#f3f3f3",
  sidebarForeground: "#1f1f1f",
  sidebarMutedForeground: "#666666",
  sidebarControlSurface: "#e8e8e8",
  sidebarRowHover: "#eaeaea",
  sidebarRowActive: "#ffffff",
  sidebarRowSelected: "#ffffff",
  sidebarBorder: "#e4e4e4",
  terminalBackground: "#ffffff",
  terminalForeground: "#1f1f1f",
  terminalScrollbar: "#d6d6d6",
  terminalScrollbarHover: "#bdbdbd",
};

const DARK_CANVAS = "#1c1c1c";
const DARK: ThemeColors = {
  ...accentColors(ELBO_ACCENT.dark, DARK_CANVAS),
  searchMatchBackground: "#8c6c1f",
  searchMatchForeground: "#f5f5f5",
  searchMatchActiveBackground: "#eea52b",
  searchMatchActiveForeground: "#21180a",
  canvas: DARK_CANVAS,
  chrome: "#121212",
  toolbar: "#1c1c1c",
  toolbarForeground: "#ececec",
  toolbarBorder: "#2c2c2c",
  toolbarControl: "#242424",
  toolbarControlForeground: "#ececec",
  toolbarControlHover: "#2c2c2c",
  surface: "#1c1c1c",
  surfaceRaised: "#212121",
  surfaceOverlay: "#222222",
  text: "#ececec",
  textMuted: "#a0a0a0",
  border: "#2e2e2e",
  input: "#3a3a3a",
  secondary: "#262626",
  secondaryForeground: "#ececec",
  muted: "#262626",
  mutedForeground: "#a0a0a0",
  placeholder: "#8a8a8a",
  secondaryLabel: "#a0a0a0",
  iconMuted: "#929292",
  error: "#fb414a",
  errorForeground: "#ff6467",
  errorSurface: "#301214",
  warning: "#f59e0b",
  warningForeground: "#fbbf24",
  warningSurface: "#2e2512",
  messageForeground: "#ececec",
  codeBackground: "#171717",
  codeForeground: "#ececec",
  sidebar: "#121212",
  sidebarForeground: "#ececec",
  sidebarMutedForeground: "#a0a0a0",
  sidebarControlSurface: "#222222",
  sidebarRowHover: "#1f1f1f",
  sidebarRowActive: "#262626",
  sidebarRowSelected: "#262626",
  sidebarBorder: "#262626",
  terminalBackground: "#1c1c1c",
  terminalForeground: "#ececec",
  terminalScrollbar: "#333333",
  terminalScrollbarHover: "#444444",
};

export const ELBO_THEME: ThemeDefinition = {
  id: ELBO_THEME_ID,
  label: "Elbo",
  appearance: "light",
  colors: LIGHT,
  variants: { dark: DARK },
};
