// team-layer: Settings → Check my setup (team/WINDOWS_RELEASE_PLAN.md section 4a).
import type { EnvironmentId } from "@t3tools/contracts";

import { usePrimaryEnvironmentId } from "../../../state/environments";
import { SettingsPageContainer, SettingsSection } from "../../settings/settingsLayout";
import { Button } from "../../ui/button";
import { TeamSetupRows, useTeamSetupRows } from "./TeamSetupPanel";

function SetupSection({ environmentId }: { readonly environmentId: EnvironmentId }) {
  const setup = useTeamSetupRows(environmentId);
  return (
    <SettingsSection
      id="check-my-setup"
      title="Check my setup"
      headerAction={
        <Button
          size="sm"
          variant="outline"
          disabled={setup.checking}
          onClick={() => void setup.checkAgain()}
        >
          {setup.checking ? "Checking…" : "Check again"}
        </Button>
      }
    >
      <TeamSetupRows environmentId={environmentId} setup={setup} />
    </SettingsSection>
  );
}

export function TeamSetupSettingsPanel() {
  const environmentId = usePrimaryEnvironmentId();
  return (
    <SettingsPageContainer>
      {environmentId === null ? (
        <p className="text-sm text-muted-foreground">Connecting to this computer…</p>
      ) : (
        <SetupSection environmentId={environmentId} />
      )}
    </SettingsPageContainer>
  );
}
