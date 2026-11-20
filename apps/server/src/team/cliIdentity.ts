// team-layer: what the `elbo` command says about itself. binCli.ts applies it with small hooks.
import * as Effect from "effect/Effect";
import { Argument, Command } from "effect/cli";
import * as CliError from "effect/cli/CliError";
import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";

const { name, cliName } = TEAM_IDENTITY;

const rename = (text: string) =>
  text
    .replaceAll("a T3 Code", `an ${name}`)
    .replaceAll("T3 Code", name)
    .replaceAll("T3's", `${name}'s`)
    .replaceAll("`t3 ", `\`${cliName} `);

type AnyCommand = Command.Command<string, never, unknown, unknown, unknown>;

const withTeamName = (command: AnyCommand): AnyCommand => {
  let named = command;
  if (command.description !== undefined && rename(command.description) !== command.description) {
    named = Command.withDescription(named, rename(command.description));
  }
  const short = command.shortDescription;
  if (short !== undefined && rename(short) !== short) {
    named = Command.withShortDescription(named, rename(short));
  }
  return named;
};

/**
 * Drop-in for `Command.withSubcommands`: top-level `elbo --help` lines say Elbo. Only
 * descriptions change, so the list keeps its type. Nested help and flags keep upstream's words.
 */
export const teamWithSubcommands = <const T extends ReadonlyArray<Command.Command.Any>>(
  subcommands: T,
) =>
  Command.withSubcommands(
    subcommands.map((command) => withTeamName(command as unknown as AnyCommand)) as unknown as T,
  );

// Upstream's versions fetch T3 Code's `t3` releases, install a `t3` command, or remove `t3`
// launchers from PATH. Elbo's desktop app owns its updates and its `elbo` command.
const NOT_IN_ELBO = {
  update: `${name} updates itself from the app: Settings → About.`,
  install: `The ${name} app sets up the \`${cliName}\` command: Settings → About → ${cliName} command.`,
  uninstall: `Uninstall ${name} from Windows Settings → Apps. Your projects and threads are kept.`,
} as const;

const notInElbo = (command: keyof typeof NOT_IN_ELBO) =>
  Command.make(command, {
    rest: Argument.String("args").pipe(Argument.variadic),
  }).pipe(
    Command.withDescription(NOT_IN_ELBO[command]),
    Command.withHandler(() => Effect.fail(new CliError.UserError({ cause: NOT_IN_ELBO[command] }))),
  );

export const teamUpdateCommand = notInElbo("update");
export const teamInstallCommand = notInElbo("install");
export const teamUninstallCommand = notInElbo("uninstall");
