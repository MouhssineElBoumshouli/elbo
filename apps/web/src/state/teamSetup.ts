// team-layer: Check my setup for the web client (team/WINDOWS_RELEASE_PLAN.md section 4a).
import { createTeamSetupAtoms } from "@t3tools/client-runtime/state/teamSetup";

import { connectionAtomRuntime } from "../connection/runtime";

export const teamSetup = createTeamSetupAtoms(connectionAtomRuntime);
