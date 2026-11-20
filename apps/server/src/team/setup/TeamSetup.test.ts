import { ProviderDriverKind, ProviderInstanceId, type ServerProvider } from "@t3tools/contracts";
import { describe, expect, it } from "@effect/vitest";

import {
  codexToolStartupNotice,
  codexToolsOffArgs,
  setCodexToolsOffInApp,
} from "./codexToolChoices.ts";
import { codexToolsForSetup, needsWslLook, parseWslAgents } from "./TeamSetup.ts";

const agent = (driver: string, overrides: Partial<ServerProvider> = {}): ServerProvider => ({
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
});

describe("TeamSetup facts", () => {
  it("reads which agents the default WSL distro has", () => {
    expect(parseWslAgents("distro:Ubuntu\r\nhas:claude\nhas:codex\n")).toEqual({
      distro: "Ubuntu",
      claude: true,
      codex: true,
    });
    expect(parseWslAgents("distro:Ubuntu\nhas:codex\n")).toMatchObject({ claude: false });
    expect(parseWslAgents("")).toBeNull();
  });

  it("starts WSL only when Claude or Codex is missing or signed out here", () => {
    expect(needsWslLook([agent("claudeAgent"), agent("codex")])).toBe(false);
    expect(
      needsWslLook([agent("claudeAgent", { auth: { status: "unauthenticated" } }), agent("codex")]),
    ).toBe(true);
    expect(needsWslLook([agent("cursor", { installed: false })])).toBe(false);
  });

  it("keeps Codex tools that need sign-in or are off in this app", () => {
    const listed = JSON.stringify([
      { name: "notion", enabled: true, auth_status: "not_logged_in" },
      { name: "stitch", enabled: true, auth_status: "unsupported" },
      { name: "linear", enabled: true, auth_status: "oauth" },
      { name: "old", enabled: false, auth_status: "not_logged_in" },
    ]);
    expect(codexToolsForSetup(listed, ["linear"])).toEqual([
      { name: "notion", authStatus: "not_logged_in", offInApp: false },
      { name: "linear", authStatus: "oauth", offInApp: true },
    ]);
    expect(codexToolsForSetup("not json", [])).toEqual([]);
  });
});

describe("Codex tool choices", () => {
  it("turns chosen tools off for new Codex sessions, keeping dotted names whole", () => {
    setCodexToolsOffInApp([]);
    expect(codexToolsOffArgs()).toEqual([]);
    setCodexToolsOffInApp(["notion", "my.tool"]);
    expect(codexToolsOffArgs()).toEqual([
      "-c",
      'mcp_servers={"my.tool"={enabled=false},"notion"={enabled=false}}',
    ]);
    setCodexToolsOffInApp([]);
  });

  it("shows a tool's startup failure in chat once per run", () => {
    expect(codexToolStartupNotice("notion-test", "OAuth login required")).toEqual({
      title: "Codex tool “notion-test” needs sign-in",
      message:
        "Codex tool “notion-test” needs sign-in. Sign in or stop using it in Settings → Check my setup.",
    });
    expect(codexToolStartupNotice("notion-test", "OAuth login required")).toBeNull();
  });
});
