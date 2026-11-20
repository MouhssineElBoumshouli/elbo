// team-layer: Settings → Check my setup (team/WINDOWS_RELEASE_PLAN.md section 4a): a summary on
// top, then the AI and Tools rows (team/mockups/slice3/setup.html).
import type { EnvironmentId } from "@t3tools/contracts";
import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";

import { cn } from "../../../lib/utils";
import { usePrimaryEnvironmentId } from "../../../state/environments";
import { SettingsPageContainer } from "../../settings/settingsLayout";
import { Button } from "../../ui/button";
import { teamSetupNeedsYou } from "../rail/teamRail";
import { TeamSetupRows, useTeamSetupRows, type TeamSetupState } from "./TeamSetupPanel";

function Summary({ setup }: { readonly setup: TeamSetupState }) {
  const needsYou = teamSetupNeedsYou(setup.rows);
  const checking = setup.rows.some((row) => row.state === "checking");
  const [title, line] =
    needsYou > 0
      ? [
          needsYou === 1 ? "1 thing needs you" : `${needsYou} things need you`,
          "Each has one button. Nothing to type.",
        ]
      : checking
        ? ["Checking…", "Looking at your AI and tools."]
        : ["All set", `Your AI and tools are ready for ${TEAM_IDENTITY.name}.`];
  return (
    <div
      data-team-setup-summary
      className={cn(
        "rounded-xl border px-5 py-4",
        needsYou > 0
          ? "border-warning/30 bg-warning/10"
          : checking
            ? "border-border bg-muted"
            : "border-success/25 bg-success/8",
      )}
    >
      <div className="text-base font-semibold">{title}</div>
      <div className="mt-0.5 text-sm text-muted-foreground">{line}</div>
    </div>
  );
}

function SetupPage({ environmentId }: { readonly environmentId: EnvironmentId }) {
  const setup = useTeamSetupRows(environmentId);
  return (
    <div id="check-my-setup" className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Check my setup</h2>
        <Button
          size="sm"
          variant="outline"
          disabled={setup.checking}
          onClick={() => void setup.checkAgain()}
        >
          {setup.checking ? "Checking…" : "Check again"}
        </Button>
      </div>
      <Summary setup={setup} />
      <TeamSetupRows environmentId={environmentId} setup={setup} />
      <p className="text-center text-xs text-muted-foreground">
        Agents can see this list too, and will point you to the right button.
      </p>
    </div>
  );
}

export function TeamSetupSettingsPanel() {
  const environmentId = usePrimaryEnvironmentId();
  return (
    <SettingsPageContainer>
      {environmentId === null ? (
        <p className="text-sm text-muted-foreground">Connecting to this computer…</p>
      ) : (
        <SetupPage environmentId={environmentId} />
      )}
    </SettingsPageContainer>
  );
}
