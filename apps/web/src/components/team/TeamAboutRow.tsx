import type { ComponentProps } from "react";
import {
  TEAM_IDENTITY,
  TEAM_PRIVACY_LINE,
  TEAM_USER_GUIDE_URL,
} from "@t3tools/shared/teamIdentity";

import { SettingsRow } from "../settings/settingsLayout";
import { Button } from "../ui/button";
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

/** Settings → About: opens Elbo's user guide in the normal browser. */
export function TeamUserGuideRow() {
  return (
    <SettingsRow
      title="User guide"
      description={`How to install, set up and use ${APP_DISPLAY_NAME}, alone or as a team.`}
      control={
        <Button
          render={<a href={TEAM_USER_GUIDE_URL} target="_blank" rel="noreferrer noopener" />}
          size="sm"
          variant="outline"
        >
          Open guide
        </Button>
      }
    />
  );
}

/** Settings → Legal: says plainly that Elbo collects no usage data. */
export function TeamPrivacyRow(props: Omit<ComponentProps<typeof SettingsRow>, "description">) {
  return <SettingsRow {...props} description={TEAM_PRIVACY_LINE} />;
}
