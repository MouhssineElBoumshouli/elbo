/**
 * "Check my setup" on the server (fork-only, team/WINDOWS_RELEASE_PLAN.md section 4a): the facts
 * the provider statuses lack. Where each provider CLI is (so a fix runs that file whatever PATH
 * says), Git and the GitHub CLI, the copies in WSL, Codex tools that need sign-in, and a Git
 * repository at the home folder. Everything here only reads; fixes run in the app's terminal.
 *
 * @module TeamSetup
 */
import {
  type ServerProvider,
  type TeamSetupChooseInput,
  TeamSetupError,
  type TeamSetupFacts,
  type TeamSetupFactsInput,
} from "@t3tools/contracts";
import * as HostProcess from "@t3tools/shared/HostProcess";
import { resolveCommandPath, resolveSpawnCommand } from "@t3tools/shared/shell";
import { buildTeamSetupRows, type TeamSetupRow } from "@t3tools/shared/teamSetupRows";
import * as Context from "effect/Context";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Path from "effect/Path";
import * as Ref from "effect/Ref";
import * as Schema from "effect/Schema";
import * as Stream from "effect/Stream";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

import * as ServerConfig from "../../config.ts";
import * as ProviderRegistry from "../../provider/ProviderRegistry.ts";
import * as ServerSettings from "../../serverSettings.ts";
import { codexToolsOffInApp, setCodexToolsOffInApp } from "./codexToolChoices.ts";

const CLI_TIMEOUT = Duration.seconds(15);
// WSL may have to start its VM first.
const WSL_TIMEOUT = Duration.seconds(25);
const CHOICES_FILE = "team-setup.json";

const Choices = Schema.Struct({ codexToolsOffInApp: Schema.Array(Schema.String) });
const decodeChoices = Schema.decodeUnknownOption(Schema.fromJsonString(Choices));
const encodeChoices = Schema.encodeSync(Schema.fromJsonString(Choices));

const CodexTools = Schema.fromJsonString(
  Schema.Array(
    Schema.Struct({
      name: Schema.String,
      enabled: Schema.Boolean,
      auth_status: Schema.optional(Schema.NullOr(Schema.String)),
    }),
  ),
);
const decodeCodexTools = Schema.decodeUnknownOption(CodexTools);

const DEFAULT_BINARIES: Readonly<Record<string, string>> = {
  claudeAgent: "claude",
  codex: "codex",
};

function setupPlatform(platform: NodeJS.Platform): TeamSetupFacts["platform"] {
  if (platform === "win32") return "windows";
  if (platform === "darwin") return "macos";
  if (platform === "linux") return "linux";
  return "other";
}

// One login shell; nvm-installed CLIs are not on a login PATH, so look in nvm's folders too.
const WSL_SCRIPT = [
  'echo "distro:$WSL_DISTRO_NAME"',
  "for c in claude codex; do",
  '  if command -v "$c" >/dev/null 2>&1 || ls "$HOME/.local/bin/$c" "$HOME"/.nvm/versions/node/*/bin/"$c" >/dev/null 2>&1; then echo "has:$c"; fi',
  "done",
].join("\n");

/** Reads the WSL probe's lines; null when WSL had no distro to answer. */
export function parseWslAgents(stdout: string): TeamSetupFacts["wsl"] {
  const lines = stdout.split(/\r?\n/u).map((line) => line.trim());
  const distro = lines.find((line) => line.startsWith("distro:"))?.slice("distro:".length) ?? "";
  if (distro === "") return null;
  return { distro, claude: lines.includes("has:claude"), codex: lines.includes("has:codex") };
}

/** WSL is worth starting only when Claude or Codex is missing or signed out on Windows. */
export function needsWslLook(providers: ReadonlyArray<ServerProvider>): boolean {
  return providers.some(
    (provider) =>
      provider.driver in DEFAULT_BINARIES &&
      provider.enabled &&
      (!provider.installed || provider.auth.status === "unauthenticated"),
  );
}

/** Codex tools worth a row: on in Codex and needing sign-in, or turned off in this app. */
export function codexToolsForSetup(
  stdout: string,
  offInApp: ReadonlyArray<string>,
): TeamSetupFacts["codexTools"] {
  const tools = Option.getOrElse(decodeCodexTools(stdout), () => []);
  return tools.flatMap((tool) => {
    const off = offInApp.includes(tool.name);
    const authStatus = tool.auth_status ?? "unsupported";
    if (!tool.enabled || (!off && authStatus !== "not_logged_in")) return [];
    return [{ name: tool.name, authStatus, offInApp: off }];
  });
}

export class TeamSetup extends Context.Service<
  TeamSetup,
  {
    readonly facts: (input: TeamSetupFactsInput) => Effect.Effect<TeamSetupFacts, TeamSetupError>;
    readonly choose: (input: TeamSetupChooseInput) => Effect.Effect<TeamSetupFacts, TeamSetupError>;
    /** Every row, for the agent's setup tool. */
    readonly rows: Effect.Effect<ReadonlyArray<TeamSetupRow>, TeamSetupError>;
  }
>()("t3/team/setup/TeamSetup") {}

const make = Effect.gen(function* () {
  const config = yield* ServerConfig.ServerConfig;
  const providerRegistry = yield* ProviderRegistry.ProviderRegistry;
  const serverSettings = yield* ServerSettings.ServerSettingsService;
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const fileSystem = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const hostPlatform = yield* HostProcess.Platform;
  const homeDirectory = yield* HostProcess.HomeDirectory;
  const environment = yield* HostProcess.Environment;
  const platform = setupPlatform(hostPlatform);
  const choicesPath = path.join(config.stateDir, CHOICES_FILE);
  const cached = yield* Ref.make<Option.Option<TeamSetupFacts>>(Option.none());
  const wslCache = yield* Ref.make<Option.Option<TeamSetupFacts["wsl"]>>(Option.none());

  const savedChoices = yield* fileSystem.readFileString(choicesPath).pipe(
    Effect.map((text) => Option.getOrUndefined(decodeChoices(text))),
    Effect.orElseSucceed(() => undefined),
  );
  setCodexToolsOffInApp(savedChoices?.codexToolsOffInApp ?? []);

  /** Runs a CLI for its output; null when it could not run or timed out. */
  const runCli = (command: string, args: ReadonlyArray<string>, timeout: Duration.Duration) =>
    Effect.gen(function* () {
      const spawn = yield* resolveSpawnCommand(command, args, { env: environment });
      const child = yield* spawner.spawn(
        ChildProcess.make(spawn.command, spawn.args, {
          env: environment,
          shell: spawn.shell,
          forceKillAfter: "1 second",
        }),
      );
      const [stdout, , exitCode] = yield* Effect.all(
        [
          child.stdout.pipe(Stream.decodeText(), Stream.mkString),
          child.stderr.pipe(Stream.runDrain),
          child.exitCode,
        ],
        { concurrency: "unbounded" },
      );
      return { stdout, exitCode: Number(exitCode) };
    }).pipe(
      Effect.scoped,
      Effect.timeoutOption(timeout),
      Effect.map(Option.getOrNull),
      Effect.orElseSucceed(() => null),
    );

  const exists = (file: string) => fileSystem.exists(file).pipe(Effect.orElseSucceed(() => false));

  /** On PATH, or in its usual install folder as right after an install this run cannot see. */
  const findTool = Effect.fn("TeamSetup.findTool")(function* (
    name: string,
    windowsFolders: ReadonlyArray<string>,
  ) {
    const onPath = yield* resolveCommandPath(name).pipe(Effect.orElseSucceed(() => null));
    if (onPath !== null) return { path: onPath, onPath: true };
    if (platform !== "windows") return { path: null, onPath: false };
    for (const candidate of windowsFolders) {
      if (yield* exists(candidate)) return { path: candidate, onPath: false };
    }
    return { path: null, onPath: false };
  });

  const programFiles = environment.ProgramFiles ?? "C:\\Program Files";
  const localAppData = environment.LOCALAPPDATA ?? path.join(homeDirectory, "AppData", "Local");

  const gather = Effect.fn("TeamSetup.gather")(function* (refresh: boolean) {
    const providers = yield* providerRegistry.getProviders;
    const settings = yield* serverSettings.getSettings.pipe(Effect.option);
    const agents = providers.filter((provider) => provider.driver in DEFAULT_BINARIES);
    const executables = yield* Effect.forEach(
      agents,
      (provider) =>
        Effect.gen(function* () {
          const config = Option.getOrUndefined(settings)?.providerInstances[provider.instanceId]
            ?.config as { readonly binaryPath?: unknown } | undefined;
          const binary =
            typeof config?.binaryPath === "string" && config.binaryPath.trim() !== ""
              ? config.binaryPath
              : (DEFAULT_BINARIES[provider.driver] ?? provider.driver);
          const found = yield* resolveCommandPath(binary).pipe(Effect.orElseSucceed(() => null));
          return { instanceId: provider.instanceId, path: found };
        }),
      { concurrency: "unbounded" },
    );

    const [git, gh, homeRepository] = yield* Effect.all(
      [
        findTool("git", [
          path.join(programFiles, "Git", "cmd", "git.exe"),
          path.join(localAppData, "Programs", "Git", "cmd", "git.exe"),
        ]),
        findTool("gh", [path.join(programFiles, "GitHub CLI", "gh.exe")]),
        exists(path.join(homeDirectory, ".git")).pipe(
          Effect.map((found) => (found ? path.join(homeDirectory, ".git") : null)),
        ),
      ],
      { concurrency: "unbounded" },
    );
    const ghSignedIn =
      gh.path === null
        ? false
        : (yield* runCli(gh.path, ["auth", "status", "--hostname", "github.com"], CLI_TIMEOUT))
            ?.exitCode === 0;

    const codex = agents.find((provider) => provider.driver === "codex" && provider.installed);
    const codexPath = executables.find((entry) => entry.instanceId === codex?.instanceId)?.path;
    const codexTools =
      codexPath == null
        ? []
        : codexToolsForSetup(
            (yield* runCli(codexPath, ["mcp", "list", "--json"], CLI_TIMEOUT))?.stdout ?? "",
            codexToolsOffInApp(),
          );

    const wsl =
      platform !== "windows" || !needsWslLook(agents)
        ? null
        : yield* Effect.gen(function* () {
            const known = yield* Ref.get(wslCache);
            if (Option.isSome(known) && !refresh) return known.value;
            const result = yield* runCli("wsl.exe", ["-e", "bash", "-lc", WSL_SCRIPT], WSL_TIMEOUT);
            const parsed = result?.exitCode === 0 ? parseWslAgents(result.stdout) : null;
            yield* Ref.set(wslCache, Option.some(parsed));
            return parsed;
          });

    return {
      platform,
      executables,
      git,
      gh: { ...gh, signedIn: ghSignedIn },
      wsl,
      codexTools,
      homeRepository,
    } satisfies TeamSetupFacts;
  });

  const facts: TeamSetup["Service"]["facts"] = Effect.fn("TeamSetup.facts")(function* (input) {
    const known = yield* Ref.get(cached);
    if (Option.isSome(known) && input.refresh !== true) return known.value;
    const fresh = yield* gather(input.refresh === true).pipe(
      Effect.provideService(FileSystem.FileSystem, fileSystem),
      Effect.provideService(Path.Path, path),
    );
    yield* Ref.set(cached, Option.some(fresh));
    return fresh;
  });

  const choose: TeamSetup["Service"]["choose"] = Effect.fn("TeamSetup.choose")(function* (input) {
    const current = codexToolsOffInApp();
    const next = input.use
      ? current.filter((name) => name !== input.codexTool)
      : [...current, input.codexTool];
    yield* fileSystem
      .writeFileString(choicesPath, encodeChoices({ codexToolsOffInApp: next }))
      .pipe(
        Effect.mapError(
          () => new TeamSetupError({ detail: "Could not save the choice. Try again." }),
        ),
      );
    setCodexToolsOffInApp(next);
    return yield* facts({ refresh: true });
  });

  const rows: TeamSetup["Service"]["rows"] = Effect.gen(function* () {
    const current = yield* facts({ refresh: true });
    return buildTeamSetupRows(yield* providerRegistry.getProviders, current);
  });

  return TeamSetup.of({ facts, choose, rows });
});

export const layer = Layer.effect(TeamSetup, make);
