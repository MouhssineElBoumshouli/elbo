// team-layer: "Check my setup" rows (team/WINDOWS_RELEASE_PLAN.md section 4a). Plain words and one
// next step per row. The web page and the agent's setup tool build them the same way from the
// provider statuses and the server's setup facts.
import type { ServerProvider, TeamSetupFacts } from "@t3tools/contracts";

import { TEAM_IDENTITY } from "./teamIdentity.ts";

export type TeamSetupActionKind =
  | "install"
  | "signIn"
  | "update"
  | "turnOn"
  | "useWsl"
  | "dontUse"
  | "useAgain"
  | "checkAgain";

export interface TeamSetupAction {
  readonly kind: TeamSetupActionKind;
  readonly label: string;
  /** Typed and started in a terminal the app opens; the user never types it. */
  readonly command?: string;
}

export type TeamSetupRowState = "ready" | "checking" | "needsAction" | "off" | "info";

export interface TeamSetupRow {
  readonly id: string;
  readonly group: "agent" | "agentTool" | "tool";
  readonly name: string;
  readonly state: TeamSetupRowState;
  readonly message: string;
  readonly note?: string;
  readonly instanceId?: ServerProvider["instanceId"];
  /** The agent a provider row is for, so the page can show its logo. */
  readonly driver?: ServerProvider["driver"];
  /** The Codex tool a "Don't use" or "Use again" is for. */
  readonly codexTool?: string;
  readonly actions: ReadonlyArray<TeamSetupAction>;
}

export const TEAM_CLAUDE_SIGNED_OUT_MESSAGE =
  "Claude is signed out on this computer. Sign in again to use Claude here.";

const NAMES: Readonly<Record<string, string>> = { claudeAgent: "Claude", codex: "Codex" };
const WSL_DRIVERS: Readonly<Record<string, "claude" | "codex">> = {
  claudeAgent: "claude",
  codex: "codex",
};
const DEFAULT_BINARIES: Readonly<Record<string, string>> = {
  claudeAgent: "claude",
  codex: "codex",
};

// Native installers need no Node or npm (the same commands as upstream's welcome page).
const INSTALL_COMMANDS: Readonly<Record<string, { windows: string; posix: string }>> = {
  claudeAgent: {
    windows: "irm https://claude.ai/install.ps1 | iex",
    posix: "curl -fsSL https://claude.ai/install.sh | bash",
  },
  codex: {
    windows: "irm https://chatgpt.com/codex/install.ps1 | iex",
    posix: "curl -fsSL https://chatgpt.com/codex/install.sh | sh",
  },
};

const WINGET = "--exact --source winget --accept-package-agreements --accept-source-agreements";

type Platform = TeamSetupFacts["platform"];

/** Quotes a path for the shell the app's terminal runs: PowerShell on Windows, sh elsewhere. */
export function teamShellCommand(platform: Platform, file: string, args: string): string {
  if (/^[A-Za-z0-9_.-]+$/u.test(file)) return `${file} ${args}`;
  return platform === "windows"
    ? `& '${file.replaceAll("'", "''")}' ${args}`
    : `'${file.replaceAll("'", `'"'"'`)}' ${args}`;
}

const providerName = (provider: ServerProvider) =>
  NAMES[provider.driver] ?? provider.displayName ?? provider.driver;

function providerFile(provider: ServerProvider, facts: TeamSetupFacts | null): string {
  const found = facts?.executables.find((entry) => entry.instanceId === provider.instanceId);
  return found?.path ?? DEFAULT_BINARIES[provider.driver] ?? provider.driver;
}

function signInCommand(provider: ServerProvider, facts: TeamSetupFacts | null, platform: Platform) {
  const file = providerFile(provider, facts);
  if (provider.driver === "claudeAgent") return teamShellCommand(platform, file, "auth login");
  if (provider.driver === "codex") return teamShellCommand(platform, file, "login");
  return undefined;
}

function wslNote(provider: ServerProvider, facts: TeamSetupFacts | null) {
  const key = WSL_DRIVERS[provider.driver];
  if (facts?.platform !== "windows" || facts.wsl === null || key === undefined) return null;
  if (!facts.wsl[key]) return null;
  const name = providerName(provider);
  return {
    note: `${name} is also installed in ${facts.wsl.distro} (WSL), with its own sign-in. Set it up on Windows here, or use the one in ${facts.wsl.distro}.`,
    action: { kind: "useWsl", label: `Use the one in ${facts.wsl.distro}` } as const,
  };
}

function providerRow(provider: ServerProvider, facts: TeamSetupFacts | null): TeamSetupRow {
  const name = providerName(provider);
  const platform = facts?.platform ?? "other";
  const base = {
    id: `provider:${provider.instanceId}`,
    group: "agent" as const,
    name,
    instanceId: provider.instanceId,
    driver: provider.driver,
  };
  if (!provider.enabled || provider.status === "disabled") {
    return {
      ...base,
      state: "off",
      message: `${name} is turned off in this app.`,
      actions: [{ kind: "turnOn", label: "Turn on" }],
    };
  }
  if (!provider.installed && provider.status === "warning" && provider.auth.status === "unknown") {
    return { ...base, state: "checking", message: `Checking ${name}…`, actions: [] };
  }
  const wsl = wslNote(provider, facts);
  const withWsl = (row: TeamSetupRow): TeamSetupRow =>
    wsl === null ? row : { ...row, note: wsl.note, actions: [...row.actions, wsl.action] };
  if (!provider.installed) {
    const commands = INSTALL_COMMANDS[provider.driver];
    return withWsl({
      ...base,
      state: "needsAction",
      message: `${name} is not installed on this computer.`,
      actions: [
        commands === undefined
          ? { kind: "update", label: "Set up" }
          : {
              kind: "install",
              label: "Install",
              command: platform === "windows" ? commands.windows : commands.posix,
            },
      ],
    });
  }
  if (provider.auth.status === "unauthenticated") {
    const command = signInCommand(provider, facts, platform);
    return withWsl({
      ...base,
      state: "needsAction",
      message:
        provider.driver === "claudeAgent"
          ? TEAM_CLAUDE_SIGNED_OUT_MESSAGE
          : `${name} is signed out on this computer. Sign in to use ${name} here.`,
      actions: [
        command === undefined
          ? { kind: "update", label: "Sign in" }
          : { kind: "signIn", label: "Sign in", command },
      ],
    });
  }
  if (provider.compatibilityAdvisory?.status === "broken") {
    return {
      ...base,
      state: "needsAction",
      message: `${name} is too old for this app. Update it to keep using it.`,
      actions: [{ kind: "update", label: "Update" }],
    };
  }
  if (provider.status === "ready") {
    return { ...base, state: "ready", message: `${name} is ready.`, actions: [] };
  }
  return {
    ...base,
    state: "needsAction",
    message: provider.message
      ? `${name} needs a look: ${provider.message}`
      : `${name} needs a look.`,
    actions: [{ kind: "checkAgain", label: "Check again" }],
  };
}

/** Claude and Codex always get a row; another agent only once it is installed and on. */
const listedProvider = (provider: ServerProvider) =>
  provider.driver in NAMES || (provider.installed && provider.enabled);

function codexToolRows(
  providers: ReadonlyArray<ServerProvider>,
  facts: TeamSetupFacts,
): ReadonlyArray<TeamSetupRow> {
  const codex = providers.find((provider) => provider.driver === "codex" && provider.installed);
  if (codex === undefined) return [];
  const file = providerFile(codex, facts);
  return facts.codexTools.flatMap((tool): ReadonlyArray<TeamSetupRow> => {
    const base = {
      id: `codex-tool:${tool.name}`,
      group: "agentTool" as const,
      name: `Codex tool “${tool.name}”`,
      codexTool: tool.name,
    };
    if (tool.offInApp) {
      return [
        {
          ...base,
          state: "off",
          message: `Codex tool “${tool.name}” is not used in this app.`,
          actions: [{ kind: "useAgain", label: "Use again" }],
        },
      ];
    }
    if (tool.authStatus !== "not_logged_in") return [];
    return [
      {
        ...base,
        state: "needsAction",
        message: `Codex tool “${tool.name}” needs sign-in.`,
        actions: [
          {
            kind: "signIn",
            label: "Sign in",
            command: teamShellCommand(facts.platform, file, `mcp login ${tool.name}`),
          },
          { kind: "dontUse", label: "Don't use in this app" },
        ],
      },
    ];
  });
}

const RESTART_NOTE = `Restart ${TEAM_IDENTITY.name} so it uses it.`;

function toolRows(facts: TeamSetupFacts): ReadonlyArray<TeamSetupRow> {
  const windows = facts.platform === "windows";
  const git: TeamSetupRow =
    facts.git.path === null
      ? {
          id: "git",
          group: "tool",
          name: "Git",
          state: "needsAction",
          message: `Git is not installed. ${TEAM_IDENTITY.name} needs it to save and compare your work.`,
          actions: windows
            ? [
                {
                  kind: "install",
                  label: "Install",
                  command: `winget install --id Git.Git ${WINGET}`,
                },
              ]
            : facts.platform === "macos"
              ? [{ kind: "install", label: "Install", command: "xcode-select --install" }]
              : [],
          ...(windows || facts.platform === "macos"
            ? {}
            : { note: "Install it with your system's package manager." }),
        }
      : {
          id: "git",
          group: "tool",
          name: "Git",
          state: "ready",
          message: "Git is installed.",
          ...(facts.git.onPath ? {} : { note: RESTART_NOTE }),
          actions: [],
        };
  const ghFile = facts.gh.path ?? "gh";
  const gh: TeamSetupRow =
    facts.gh.path === null
      ? {
          id: "gh",
          group: "tool",
          name: "GitHub CLI",
          state: "needsAction",
          message: "GitHub CLI is not installed. Team projects use it to share work.",
          actions: windows
            ? [
                {
                  kind: "install",
                  label: "Install",
                  command: `winget install --id GitHub.cli ${WINGET}`,
                },
              ]
            : [],
          ...(windows ? {} : { note: "Install it from cli.github.com." }),
        }
      : facts.gh.signedIn
        ? {
            id: "gh",
            group: "tool",
            name: "GitHub CLI",
            state: "ready",
            message: "GitHub CLI is signed in.",
            ...(facts.gh.onPath ? {} : { note: RESTART_NOTE }),
            actions: [],
          }
        : {
            id: "gh",
            group: "tool",
            name: "GitHub CLI",
            state: "needsAction",
            message: "GitHub CLI is signed out.",
            note: "Copy the code it shows, then approve in your browser.",
            actions: [
              {
                kind: "signIn",
                label: "Sign in",
                command: teamShellCommand(
                  facts.platform,
                  ghFile,
                  "auth login --hostname github.com --git-protocol https --web",
                ),
              },
            ],
          };
  const home: ReadonlyArray<TeamSetupRow> =
    facts.homeRepository === null
      ? []
      : [
          {
            id: "home-repository",
            group: "tool",
            name: "User folder",
            state: "info",
            message: `Your user folder is a Git repository (${facts.homeRepository}). ${TEAM_IDENTITY.name} treats project folders inside it as plain folders, so they stay fast.`,
            actions: [],
          },
        ];
  return [git, gh, ...home];
}

const AGENT_ORDER: Readonly<Record<string, number>> = { claudeAgent: 0, codex: 1 };

/** Every row, agents first. `facts` is null until the server answers the first time. */
export function buildTeamSetupRows(
  providers: ReadonlyArray<ServerProvider>,
  facts: TeamSetupFacts | null,
): ReadonlyArray<TeamSetupRow> {
  const agents = providers
    .filter(listedProvider)
    .sort(
      (a, b) =>
        (AGENT_ORDER[a.driver] ?? 2) - (AGENT_ORDER[b.driver] ?? 2) ||
        providerName(a).localeCompare(providerName(b)),
    )
    .map((provider) => providerRow(provider, facts));
  if (facts === null) return agents;
  return [...agents, ...codexToolRows(providers, facts), ...toolRows(facts)];
}

/** True once one AI is ready, which is all the first start needs. */
export const hasReadyAgent = (rows: ReadonlyArray<TeamSetupRow>) =>
  rows.some((row) => row.group === "agent" && row.state === "ready");

/** Rows as plain lines, for the agent's setup tool. */
export function describeTeamSetupRows(rows: ReadonlyArray<TeamSetupRow>): string {
  return rows
    .map((row) => {
      const mark =
        row.state === "ready"
          ? "OK"
          : row.state === "needsAction"
            ? "NEEDS ACTION"
            : row.state.toUpperCase();
      const next = row.actions.map((action) => action.label).join(" / ");
      return [
        `- [${mark}] ${row.message}`,
        ...(row.note ? [`  ${row.note}`] : []),
        ...(next ? [`  Fix in ${TEAM_IDENTITY.name}: Settings → Check my setup → ${next}`] : []),
      ].join("\n");
    })
    .join("\n");
}
