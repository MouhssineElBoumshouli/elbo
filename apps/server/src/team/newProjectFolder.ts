// team-layer: where "New project" puts its folder (team/PLANNING_FEATURE_PLAN.md slice 5). People
// find their projects in Documents, not in the app's data folder.
import type * as Path from "effect/Path";

/** Documents\Elbo projects on Windows, ~/Elbo projects elsewhere. */
export const elboProjectsRoot = (home: string, platform: string, path: Path.Path) =>
  platform === "win32"
    ? path.join(home, "Documents", "Elbo projects")
    : path.join(home, "Elbo projects");

/** A folder the person chose, with "~" for their home; null when it isn't a full path. */
export function chosenProjectsParent(folder: string, home: string, path: Path.Path): string | null {
  const trimmed = folder.trim();
  const expanded = /^~(?:[\\/]|$)/u.test(trimmed) ? path.join(home, trimmed.slice(1)) : trimmed;
  return path.isAbsolute(expanded) ? path.resolve(expanded) : null;
}
