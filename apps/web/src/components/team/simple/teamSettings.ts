// team-layer: Settings in simple mode. Only the everyday sections show until "Show advanced
// settings" is on (per device); every section's page still opens from links and search.
import { deviceFlag } from "../deviceFlag";
import type { SettingsPath } from "../../settings/settingsSearch";

const SIMPLE_SECTIONS: ReadonlyArray<SettingsPath> = [
  "/settings/general",
  "/settings/appearance",
  "/settings/setup",
  "/settings/about",
];

const advanced = deviceFlag("elbo:settings-advanced:v1", () => false);
export const useTeamAdvancedSettings = advanced.use;
export const setTeamAdvancedSettings = advanced.set;

interface NavGroup {
  readonly heading: string;
  readonly headingHidden?: true;
  readonly paths: ReadonlyArray<SettingsPath>;
}

/** The settings nav's groups: all of them, or simple mode's everyday sections as one group. */
export function teamSettingsNavGroups<G extends NavGroup>(
  groups: ReadonlyArray<G>,
  options: { readonly simple: boolean; readonly advanced: boolean },
): ReadonlyArray<NavGroup> {
  if (!options.simple || options.advanced) return groups;
  const present = new Set(groups.flatMap((group) => group.paths));
  return [
    {
      heading: "Settings",
      headingHidden: true,
      paths: SIMPLE_SECTIONS.filter((path) => present.has(path)),
    },
  ];
}

const SIMPLE_TITLES: Readonly<Record<string, string>> = {
  Threads: "Chats",
  "Thread notifications": "Chat notifications",
  "Thread details": "Chat details",
};

/** A settings title in plain words ("Threads" → "Chats") while simple mode is on. */
export function teamSettingsTitle(title: string, simple: boolean): string {
  return simple ? (SIMPLE_TITLES[title] ?? title) : title;
}
