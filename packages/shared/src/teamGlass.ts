// team-layer: Elbo's glass (team/DESIGN_DIRECTION.md section 3). Windows 11 22H2 (build 22621) is
// the first Windows with system backdrops for apps; older Windows, macOS, Linux, web and mobile
// stay solid. Windows draws both styles; the page never blurs anything itself.
const FIRST_BACKDROP_BUILD = 22_621;

/** Electron's `backgroundMaterial`: Mica tints with the desktop picture, Acrylic frosts what's behind. */
export const TEAM_WINDOW_MATERIALS = ["none", "mica", "acrylic"] as const;
export type TeamWindowMaterial = (typeof TEAM_WINDOW_MATERIALS)[number];

/** `systemVersion` is Electron's `process.getSystemVersion()`, e.g. "10.0.22631". */
export function teamGlassSupported(platform: string, systemVersion: string): boolean {
  if (platform !== "win32") return false;
  const build = Number(systemVersion.split(".")[2]);
  return Number.isInteger(build) && build >= FIRST_BACKDROP_BUILD;
}

/** The window shows a material only while the person wants it and Windows draws transparency. */
export function teamWindowMaterial(input: {
  readonly on: boolean;
  readonly frosted: boolean;
  readonly supported: boolean;
  readonly reducedTransparency: boolean;
}): TeamWindowMaterial {
  if (!input.on || !input.supported || input.reducedTransparency) return "none";
  return input.frosted ? "acrylic" : "mica";
}
