// team-layer: where "New project" puts the folder (team/PLANNING_FEATURE_PLAN.md slice 5). Typing a
// full path ("~/code/shop") chooses the folder on every client; a picked folder does it on desktop.
import { parseWslUncPath } from "~/wslPaths";

export interface NewProjectTarget {
  readonly name: string;
  readonly parentFolder: string | null;
}

/** "~/code/shop" → shop in ~/code; "shop" → shop in the picked folder, or the server's default. */
export function newProjectTarget(query: string, picked: string | null): NewProjectTarget {
  const text = query.trim();
  const cut = Math.max(text.lastIndexOf("/"), text.lastIndexOf("\\"));
  if (cut < 0) return { name: text, parentFolder: picked };
  return { name: text.slice(cut + 1).trim(), parentFolder: text.slice(0, cut) || "/" };
}

/** A folder from the desktop picker, as the server sees it: WSL folders become Linux paths. */
export const pickedProjectsFolder = (picked: string) =>
  parseWslUncPath(picked)?.linuxPath ?? picked;
