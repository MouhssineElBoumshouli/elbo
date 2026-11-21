// team-layer: Elbo's glass (team/DESIGN_DIRECTION.md section 3). Windows 11 22H2 (build 22621) is
// the first Windows with Mica for apps; older Windows, macOS, Linux, web and mobile stay solid.
const FIRST_MICA_BUILD = 22_621;

/** `systemVersion` is Electron's `process.getSystemVersion()`, e.g. "10.0.22631". */
export function teamGlassSupported(platform: string, systemVersion: string): boolean {
  if (platform !== "win32") return false;
  const build = Number(systemVersion.split(".")[2]);
  return Number.isInteger(build) && build >= FIRST_MICA_BUILD;
}

/** The window shows the material only while the person wants it and Windows draws transparency. */
export function teamGlassActive(input: {
  readonly on: boolean;
  readonly supported: boolean;
  readonly reducedTransparency: boolean;
}): boolean {
  return input.on && input.supported && !input.reducedTransparency;
}
