/**
 * "Check my setup" on the client (fork-only, team/WINDOWS_RELEASE_PLAN.md section 4a): the
 * server's setup facts and the Codex tool choice. Rows are built from these facts and the
 * provider statuses with `buildTeamSetupRows` in `@t3tools/shared/teamSetupRows`.
 */
import { WS_METHODS } from "@t3tools/contracts";
import type { Atom } from "effect/reactivity";

import type { EnvironmentRegistry } from "../connection/registry.ts";
import { createEnvironmentRpcCommand } from "./runtime.ts";

export function createTeamSetupAtoms<R, E>(runtime: Atom.AtomRuntime<EnvironmentRegistry | R, E>) {
  return {
    facts: createEnvironmentRpcCommand(runtime, {
      label: "environment-data:team:setup-facts",
      tag: WS_METHODS.teamSetupFacts,
    }),
    /** "Don't use in this app" and "Use again" for one Codex tool. */
    choose: createEnvironmentRpcCommand(runtime, {
      label: "environment-data:team:setup-choose",
      tag: WS_METHODS.teamSetupChoose,
    }),
  };
}
