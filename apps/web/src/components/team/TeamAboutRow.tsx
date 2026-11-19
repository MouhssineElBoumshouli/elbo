import { TEAM_ABOUT_LINE, TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";

import { SettingsRow } from "../settings/settingsLayout";

/** Settings → About: which app this is and what it is built on. */
export function TeamAboutRow() {
  return (
    <SettingsRow
      title={TEAM_ABOUT_LINE}
      description={`Open source under the MIT license, like T3 Code. Source: github.com/${TEAM_IDENTITY.updateRepository}`}
    />
  );
}
