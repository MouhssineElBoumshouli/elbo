/**
 * "Check my setup" (fork-only, team/WINDOWS_RELEASE_PLAN.md section 4a): what this computer
 * has besides the provider statuses the client already streams. The client and the agent tool
 * turn these facts and the provider statuses into rows with one next step each.
 */
import * as Schema from "effect/Schema";

import { ProviderInstanceId } from "./providerInstance.ts";

/** A provider CLI as this server found it, so a fix runs the same file whatever PATH says. */
export const TeamSetupExecutable = Schema.Struct({
  instanceId: ProviderInstanceId,
  path: Schema.NullOr(Schema.String),
});
export type TeamSetupExecutable = typeof TeamSetupExecutable.Type;

/** A Codex tool (MCP server) from `codex mcp list`. */
export const TeamSetupCodexTool = Schema.Struct({
  name: Schema.String,
  /** Codex's own value: "not_logged_in", "oauth", "bearer_token", "unsupported", ... */
  authStatus: Schema.String,
  /** Off in Elbo by the user's "Don't use in this app". */
  offInApp: Schema.Boolean,
});
export type TeamSetupCodexTool = typeof TeamSetupCodexTool.Type;

export const TeamSetupFacts = Schema.Struct({
  platform: Schema.Literals(["windows", "macos", "linux", "other"]),
  executables: Schema.Array(TeamSetupExecutable),
  /** `onPath: false` means found in its usual folder only, as right after an install. */
  git: Schema.Struct({ path: Schema.NullOr(Schema.String), onPath: Schema.Boolean }),
  gh: Schema.Struct({
    path: Schema.NullOr(Schema.String),
    onPath: Schema.Boolean,
    signedIn: Schema.Boolean,
  }),
  /** Windows only: the CLIs in the default WSL distro; null when not looked at. */
  wsl: Schema.NullOr(
    Schema.Struct({
      distro: Schema.String,
      claude: Schema.Boolean,
      codex: Schema.Boolean,
    }),
  ),
  codexTools: Schema.Array(TeamSetupCodexTool),
  /** The home folder holds a Git repository, which Elbo ignores for projects inside it. */
  homeRepository: Schema.NullOr(Schema.String),
});
export type TeamSetupFacts = typeof TeamSetupFacts.Type;

export const TeamSetupFactsInput = Schema.Struct({
  /** Look again instead of answering from the last check. */
  refresh: Schema.optional(Schema.Boolean),
});
export type TeamSetupFactsInput = typeof TeamSetupFactsInput.Type;

/** "Don't use in this app" and its way back, for one Codex tool. */
export const TeamSetupChooseInput = Schema.Struct({
  codexTool: Schema.String,
  use: Schema.Boolean,
});
export type TeamSetupChooseInput = typeof TeamSetupChooseInput.Type;

export class TeamSetupError extends Schema.TaggedError<TeamSetupError>()("TeamSetupError", {
  detail: Schema.String,
}) {
  override get message(): string {
    return this.detail;
  }
}
