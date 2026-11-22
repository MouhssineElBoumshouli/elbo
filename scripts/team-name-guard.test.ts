// @effect-diagnostics nodeBuiltinImport:off - a plain test that reads tracked files.
// team-layer: user-visible text says Elbo, never "T3 Code", "T3 Connect" or "T3 home". Upstream
// syncs bring new strings back; this fails on them. Fix the string (APP_DISPLAY_NAME in web and
// desktop, TEAM_IDENTITY.name in server and packages, "Elbo Connect", "data folder") or, only
// when it must stay, add it below with the reason.
import * as NodeChildProcess from "node:child_process";
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";
import { describe, expect, it } from "vite-plus/test";

const ROOT = NodePath.resolve(import.meta.dirname, "..");
const SCOPES = ["apps/desktop/src", "apps/web/src", "apps/server/src", "packages"];
const T3_NAMES = /T3 Code|T3 Connect|T3 home/;
const SKIP_PATH =
  /(\.test\.|\.testkit\.|\/test\/|\/testkit\/|fixture|\/__fixtures__\/|^packages\/provider-testing\/)/;

const ALLOWED: ReadonlyArray<{ file: string; text: string; reason: string }> = [
  {
    file: "packages/shared/src/teamIdentity.ts",
    text: '"T3 Code (Alpha)", "T3 Code (Dev)"',
    reason: "T3 Code's folders, so ours never match",
  },
  {
    file: "apps/desktop/src/app/DesktopUserData.ts",
    text: '"T3 Code (',
    reason: "upstream's legacy profile folders",
  },
  {
    file: "apps/desktop/src/app/DesktopLegacyLocalStorage.ts",
    text: '"T3 Code (Alpha)"',
    reason: "upstream's legacy profile folder",
  },
  {
    file: "apps/desktop/src/app/DesktopCliShim.ts",
    text: "Written by T3 Code",
    reason: "marker that finds shims already on disk",
  },
  {
    file: "apps/server/src/team/cliIdentity.ts",
    text: '"T3 Code"',
    reason: "rewrites upstream's CLI help to Elbo",
  },
  {
    file: "apps/server/src/team/cliIdentity.ts",
    text: '"a T3 Code"',
    reason: "rewrites upstream's CLI help to Elbo",
  },
  {
    file: "apps/server/src/triage/triagePrompt.ts",
    text: "T3 Code",
    reason: "triage is off in Elbo; its prompt is upstream's, agent-facing",
  },
  {
    file: "apps/server/src/triage/triagePrompt.ts",
    text: "T3 Connect tunnel log",
    reason: "triage is off in Elbo; its prompt is upstream's, agent-facing",
  },
  {
    file: "apps/server/src/provider/CodexProvider.ts",
    text: 'CODEX_CLIENT_NAME = "T3 Code"',
    reason: "Codex sends it to OpenAI as the originator",
  },
  {
    file: "apps/server/src/provider/CodexChatGptAuth.ts",
    text: 'agent_name_hint: "T3 Code"',
    reason: "sent to OpenAI's ChatGPT sign-in",
  },
  {
    file: "apps/server/src/provider/acp/AntigravityAcpSupport.ts",
    text: 'title: "T3 Code"',
    reason: "client identity sent to Antigravity",
  },
  {
    file: "packages/provider-muse/src/server/sdk.ts",
    text: 'title: "T3 Code"',
    reason: "client identity sent to Muse",
  },
  {
    file: "packages/source-control-github/src/shared/definition.ts",
    text: '"T3 Code for GitHub"',
    reason: "the registered GitHub app's name",
  },
  {
    file: "packages/provider-core/src/server/textGenerationPrompts.ts",
    text: "T3 Code thread",
    reason: "title prompts; the model never repeats it",
  },
  {
    file: "packages/contracts/src/t3ProjectFile.ts",
    text: "T3 Code",
    reason: "t3.json is T3 Code's file format",
  },
  {
    file: "packages/contracts/src/relay.ts",
    text: '"T3 Code Relay API"',
    reason: "T3 Connect's API; cloud is off in Elbo",
  },
];

const stripComment = (line: string): string => {
  const trimmed = line.trimStart();
  if (/^(\/\/|\*|\/\*|\{\/\*)/.test(trimmed)) return "";
  const inline = line.search(/(^|[^:"'`])\/\/\s|\{\/\*/);
  return inline === -1 ? line : line.slice(0, inline);
};

function visibleT3NameLines(): Array<{ file: string; line: string }> {
  const files = NodeChildProcess.execFileSync("git", ["ls-files", "--", ...SCOPES], {
    cwd: ROOT,
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => /\.(ts|tsx)$/.test(file) && !SKIP_PATH.test(file))
    .concat("README.md");
  const hits: Array<{ file: string; line: string }> = [];
  for (const file of files) {
    const text = NodeFS.readFileSync(NodePath.join(ROOT, file), "utf8");
    if (!T3_NAMES.test(text)) continue;
    for (const line of text.split("\n")) {
      if (T3_NAMES.test(stripComment(line))) hits.push({ file, line: line.trim() });
    }
  }
  return hits;
}

describe("Elbo name guard", () => {
  const hits = visibleT3NameLines();
  const allowed = (hit: { file: string; line: string }) =>
    ALLOWED.some((entry) => entry.file === hit.file && hit.line.includes(entry.text));

  it("finds no user-visible T3 name outside the allowlist", () => {
    expect(hits.filter((hit) => !allowed(hit))).toEqual([]);
  });

  it("keeps the allowlist short: every entry still matches", () => {
    const stale = ALLOWED.filter(
      (entry) => !hits.some((hit) => hit.file === entry.file && hit.line.includes(entry.text)),
    );
    expect(stale).toEqual([]);
  });
});
