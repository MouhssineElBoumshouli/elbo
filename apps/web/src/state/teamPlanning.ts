// team-layer: planning a project for the web client (team/PLANNING_FEATURE_PLAN.md slice 4).
import { createTeamPlanningAtoms } from "@t3tools/client-runtime/state/teamPlanning";

import { connectionAtomRuntime } from "../connection/runtime";

export const teamPlanning = createTeamPlanningAtoms(connectionAtomRuntime);
