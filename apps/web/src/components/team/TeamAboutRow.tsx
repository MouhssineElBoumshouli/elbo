import type { ComponentProps } from "react";
import { TEAM_IDENTITY, TEAM_PRIVACY_LINE } from "@t3tools/shared/teamIdentity";

import { SettingsRow } from "../settings/settingsLayout";
import { APP_DISPLAY_NAME } from "~/branding"; // team-layer

/** Settings → About: which app this is and where it comes from. */
export function TeamAboutRow() {
  return (
    <SettingsRow
      title={APP_DISPLAY_NAME}
      description={`Open source under the MIT license. Source and updates: github.com/${TEAM_IDENTITY.updateRepository}/releases`}
    />
  );
}

/** Settings → Legal: says plainly that Elbo collects no usage data. */
export function TeamPrivacyRow(props: Omit<ComponentProps<typeof SettingsRow>, "description">) {
  return <SettingsRow {...props} description={TEAM_PRIVACY_LINE} />;
}
