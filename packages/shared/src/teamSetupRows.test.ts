import {
  ProviderDriverKind,
  ProviderInstanceId,
  type ServerProvider,
  type TeamSetupFacts,
} from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { buildTeamSetupRows, hasReadyAgent, teamShellCommand } from "./teamSetupRows.ts";

function provider(driver: string, overrides: Partial<ServerProvider> = {}): ServerProvider {
  return {
    instanceId: ProviderInstanceId.make(driver.toLowerCase()),
    driver: ProviderDriverKind.make(driver),
    enabled: true,
    installed: true,
    version: "1.0.0",
    status: "ready",
    auth: { status: "authenticated" },
    checkedAt: "2026-11-20T00:00:00.000Z",
    models: [],
    slashCommands: [],
    skills: [],
    ...overrides,
  };
}

const CLAUDE_EXE = "C:\\Users\\Mouhssine\\.local\\bin\\claude.exe";

function windowsFacts(overrides: Partial<TeamSetupFacts> = {}): TeamSetupFacts {
  return {
    platform: "windows",
    executables: [
      { instanceId: ProviderInstanceId.make("claudeagent"), path: CLAUDE_EXE },
      {
        instanceId: ProviderInstanceId.make("codex"),
        path: "C:\\Users\\Mouhssine\\AppData\\Roaming\\npm\\codex.cmd",
      },
    ],
    git: { path: "C:\\Program Files\\Git\\cmd\\git.exe", onPath: true },
    gh: { path: "C:\\Program Files\\GitHub CLI\\gh.exe", onPath: true, signedIn: true },
    wsl: null,
    codexTools: [],
    homeRepository: null,
    ...overrides,
  };
}

const row = (rows: ReturnType<typeof buildTeamSetupRows>, id: string) =>
  rows.find((entry) => entry.id === id);

describe("buildTeamSetupRows", () => {
  it("says an expired Claude sign-in plainly and signs in with the file the server found", () => {
    const rows = buildTeamSetupRows(
      [
        provider("claudeAgent", { status: "error", auth: { status: "unauthenticated" } }),
        provider("codex"),
      ],
      windowsFacts(),
    );

    expect(row(rows, "provider:claudeagent")).toMatchObject({
      state: "needsAction",
      message: "Claude is signed out on this computer. Sign in again to use Claude here.",
      // PowerShell runs a quoted path only through the call operator; PATH plays no part.
      actions: [{ kind: "signIn", command: `& '${CLAUDE_EXE}' auth login` }],
    });
    expect(row(rows, "provider:codex")).toMatchObject({
      state: "ready",
      message: "Codex is ready.",
    });
    expect(hasReadyAgent(rows)).toBe(true);
  });

  it("offers the copy in WSL next to installing on Windows", () => {
    const rows = buildTeamSetupRows(
      [provider("claudeAgent", { installed: false, status: "error", auth: { status: "unknown" } })],
      windowsFacts({ wsl: { distro: "Ubuntu", claude: true, codex: true } }),
    );

    expect(row(rows, "provider:claudeagent")).toMatchObject({
      message: "Claude is not installed on this computer.",
      note: "Claude is also installed in Ubuntu (WSL), with its own sign-in. Set it up on Windows here, or use the one in Ubuntu.",
      actions: [
        { kind: "install", command: "irm https://claude.ai/install.ps1 | iex" },
        { kind: "useWsl", label: "Use the one in Ubuntu" },
      ],
    });
    expect(hasReadyAgent(rows)).toBe(false);
  });

  it("names a Codex tool that needs sign-in, with a way out and a way back", () => {
    const codex = provider("codex");
    const signIn = buildTeamSetupRows(
      [codex],
      windowsFacts({
        codexTools: [
          { name: "notion", authStatus: "not_logged_in", offInApp: false },
          { name: "stitch", authStatus: "unsupported", offInApp: false },
        ],
      }),
    );
    expect(signIn.filter((entry) => entry.group === "agentTool")).toMatchObject([
      {
        message: "Codex tool “notion” needs sign-in.",
        actions: [
          {
            kind: "signIn",
            command: "& 'C:\\Users\\Mouhssine\\AppData\\Roaming\\npm\\codex.cmd' mcp login notion",
          },
          { kind: "dontUse", label: "Don't use in this app" },
        ],
      },
    ]);

    const off = buildTeamSetupRows(
      [codex],
      windowsFacts({
        codexTools: [{ name: "notion", authStatus: "not_logged_in", offInApp: true }],
      }),
    );
    expect(row(off, "codex-tool:notion")).toMatchObject({
      state: "off",
      actions: [{ kind: "useAgain", label: "Use again" }],
      codexTool: "notion",
    });
  });

  it("checks Git and the GitHub CLI with an install or sign-in button", () => {
    const rows = buildTeamSetupRows(
      [],
      windowsFacts({
        git: { path: null, onPath: false },
        gh: { path: "C:\\Program Files\\GitHub CLI\\gh.exe", onPath: false, signedIn: false },
      }),
    );
    expect(row(rows, "git")).toMatchObject({
      state: "needsAction",
      actions: [
        { kind: "install", command: expect.stringContaining("winget install --id Git.Git") },
      ],
    });
    expect(row(rows, "gh")).toMatchObject({
      message: "GitHub CLI is signed out.",
      actions: [
        {
          kind: "signIn",
          command:
            "& 'C:\\Program Files\\GitHub CLI\\gh.exe' auth login --hostname github.com --git-protocol https --web",
        },
      ],
    });
  });

  it("shows agents while the server's facts are still on their way", () => {
    const rows = buildTeamSetupRows([provider("claudeAgent")], null);
    expect(rows.map((entry) => entry.id)).toEqual(["provider:claudeagent"]);
  });
});

describe("teamShellCommand", () => {
  it("quotes paths for PowerShell and sh, and leaves plain names alone", () => {
    expect(teamShellCommand("windows", "claude", "auth login")).toBe("claude auth login");
    expect(teamShellCommand("windows", "C:\\it's\\claude.exe", "auth login")).toBe(
      "& 'C:\\it''s\\claude.exe' auth login",
    );
    expect(teamShellCommand("linux", "/home/me/.local/bin/claude", "auth login")).toBe(
      "'/home/me/.local/bin/claude' auth login",
    );
  });
});
