/**
 * team-layer: the team hooks in the v2 providers (team/V2_PORT_PLAN.md D3):
 * the briefing and turn note on the turn text, Claude's system prompt and
 * edit hook, and Codex's own context entry. Codex's and Claude's MCP tool
 * timeouts (65 min, above the warning card's 55) are upstream's own now.
 */
import { ProviderDriverKind, ProviderInstanceId, ThreadId } from "@t3tools/contracts";
import { buildRuntimeInstructions } from "@t3tools/provider-core/server/runtimeInstructions";
import { afterEach, assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import * as ClaudeAdapterV2 from "../orchestration-v2/Adapters/ClaudeAdapterV2.ts";
import * as CodexAdapterV2 from "../orchestration-v2/Adapters/CodexAdapterV2.ts";
import { installTeamBriefingResolver } from "./TeamBriefing.ts";
import { claudeTeamEditHooks } from "./teamEditCheck.ts";
import { installTeamTurnNote } from "./teamTurnNote.ts";
import { withTeamTurnText } from "./teamTurnText.ts";

const BRIEFING = "<team_context>Team Core.</team_context>";
const NOTE = "<team_changes>Changed: `src/a.ts`.</team_changes>";

let uninstall: Array<() => void> = [];
afterEach(() => {
  for (const undo of uninstall) undo();
  uninstall = [];
});

/** The briefing each thread gets, changed by setting `briefing`. */
let briefing: string | undefined = BRIEFING;
const installBriefing = () => {
  briefing = BRIEFING;
  uninstall.push(installTeamBriefingResolver(() => Effect.succeed(briefing)));
  uninstall.push(installTeamTurnNote(() => Effect.succeed(NOTE)));
};

describe("withTeamTurnText", () => {
  const turn = (threadId: string, driver: string, providerTurnOrdinal: number, text = "Go") =>
    withTeamTurnText({
      threadId: ThreadId.make(threadId),
      driver: ProviderDriverKind.make(driver),
      providerTurnOrdinal,
      text,
    });

  it.effect(
    "puts the briefing first on the first turn and when it changes; the note every turn",
    () =>
      Effect.gen(function* () {
        installBriefing();
        assert.equal(yield* turn("cursor-1", "cursor", 1), `${BRIEFING}\n\nGo\n\n${NOTE}`);
        assert.equal(yield* turn("cursor-1", "cursor", 2), `Go\n\n${NOTE}`);
        briefing = "<team_context>Team Core, renamed.</team_context>";
        assert.equal(yield* turn("cursor-1", "cursor", 3), `${briefing}\n\nGo\n\n${NOTE}`);
        assert.equal(yield* turn("cursor-1", "cursor", 4), `Go\n\n${NOTE}`);
        // A new provider thread starts over, whatever this server sent before.
        assert.equal(yield* turn("cursor-1", "cursor", 1), `${briefing}\n\nGo\n\n${NOTE}`);
      }),
  );

  it.effect(
    "leaves the briefing to Claude's and Codex's own instructions, and slash commands alone",
    () =>
      Effect.gen(function* () {
        installBriefing();
        assert.equal(yield* turn("claude-1", "claudeAgent", 1), `Go\n\n${NOTE}`);
        assert.equal(yield* turn("codex-1", "codex", 1), `Go\n\n${NOTE}`);
        assert.equal(yield* turn("grok-1", "grok", 1, "/compact"), "/compact");
      }),
  );

  it.effect("adds nothing outside a team", () =>
    Effect.gen(function* () {
      assert.equal(yield* turn("plain-1", "opencode", 1), "Go");
    }),
  );
});

describe("Claude", () => {
  const options = (input: { teamContext?: string; hooks?: boolean }) =>
    ClaudeAdapterV2.makeClaudeQueryOptions({
      modelSelection: {
        instanceId: ProviderInstanceId.make(ClaudeAdapterV2.CLAUDE_PROVIDER),
        model: "claude-sonnet-4-6",
      },
      nativeThreadId: "team-thread",
      resume: false,
      cwd: "/workspace",
      ...(input.teamContext === undefined ? {} : { teamContext: input.teamContext }),
      ...(input.hooks === true
        ? { hooks: claudeTeamEditHooks(ThreadId.make("claude-1"), Effect.runPromise) }
        : {}),
    });

  it("appends the briefing to the system prompt and passes the edit hook", () => {
    const team = options({ teamContext: BRIEFING, hooks: true });
    const prompt = team.systemPrompt as { readonly append: string };
    assert.include(
      prompt.append,
      `${buildRuntimeInstructions({ harness: "Claude Code" })}\n\n${BRIEFING}`,
    );
    assert.lengthOf(team.hooks?.PreToolUse ?? [], 1);
    const plain = options({});
    assert.notInclude((plain.systemPrompt as { readonly append: string }).append, "team_context");
    assert.isUndefined(plain.hooks);
  });
});

describe("Codex", () => {
  const params = (teamContext: string | undefined) =>
    CodexAdapterV2.buildCodexTurnStartParams({
      nativeThreadId: "native-team",
      codexInput: [{ type: "text", text: "Go" }],
      runtimePolicy: { runtimeMode: "full-access", interactionMode: "default", cwd: null },
      modelSelection: { instanceId: ProviderInstanceId.make("codex"), model: "gpt-5.4" },
      hasT3Mcp: true,
      teamContext,
    });

  // Its own entry: Codex resends an entry only when its value changes (team/VISION.md 6.5).
  it.effect("sends the briefing as its own application entry, none outside a team", () =>
    Effect.gen(function* () {
      const team = (yield* params(BRIEFING)).additionalContext;
      assert.deepEqual(team?.t3_code_team, { kind: "application", value: BRIEFING });
      const plain = (yield* params(undefined)).additionalContext;
      assert.isUndefined(plain?.t3_code_team);
      assert.deepEqual(plain?.t3_code_runtime, team?.t3_code_runtime);
    }),
  );
});
