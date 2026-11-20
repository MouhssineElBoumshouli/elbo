// team-layer: Check my setup (team/WINDOWS_RELEASE_PLAN.md section 4a).
import { createFileRoute } from "@tanstack/react-router";

import { TeamSetupSettingsPanel } from "../components/team/setup/TeamSetupSettingsPanel";

export const Route = createFileRoute("/_chat/settings/setup")({
  component: TeamSetupSettingsPanel,
});
