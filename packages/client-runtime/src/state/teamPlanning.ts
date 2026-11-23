/**
 * Planning a project on the client (fork-only, team/PLANNING_FEATURE_PLAN.md slice 4): start a
 * plan, follow its progress, stop it, decide on its decisions (slice 5), and preview then save it.
 */
import { WS_METHODS } from "@t3tools/contracts";
import type { Atom } from "effect/reactivity";

import type { EnvironmentRegistry } from "../connection/registry.ts";
import {
  createEnvironmentRpcCommand,
  createEnvironmentRpcSubscriptionAtomFamily,
} from "./runtime.ts";

export function createTeamPlanningAtoms<R, E>(
  runtime: Atom.AtomRuntime<EnvironmentRegistry | R, E>,
) {
  return {
    start: createEnvironmentRpcCommand(runtime, {
      label: "environment-data:team:plan-start",
      tag: WS_METHODS.teamPlanStart,
    }),
    /** A run's progress, ending with its plan, its error, or "stopped". */
    run: createEnvironmentRpcSubscriptionAtomFamily(runtime, {
      label: "environment-data:team:plan-run",
      tag: WS_METHODS.subscribeTeamPlan,
    }),
    stop: createEnvironmentRpcCommand(runtime, {
      label: "environment-data:team:plan-stop",
      tag: WS_METHODS.teamPlanStop,
    }),
    previewSave: createEnvironmentRpcCommand(runtime, {
      label: "environment-data:team:plan-preview-save",
      tag: WS_METHODS.teamPlanPreviewSave,
    }),
    save: createEnvironmentRpcCommand(runtime, {
      label: "environment-data:team:plan-save",
      tag: WS_METHODS.teamPlanSave,
    }),
    /** Agree to a decision, pick another option, or push back; returns the run's new state. */
    decide: createEnvironmentRpcCommand(runtime, {
      label: "environment-data:team:plan-decide",
      tag: WS_METHODS.teamPlanDecide,
    }),
  };
}
