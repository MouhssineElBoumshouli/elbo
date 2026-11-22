import {
  ProviderDriverKind,
  ProviderInstanceId,
  type ServerProvider,
  type ServerProviderModel,
} from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { continueChoices, limitCardWords, resetPhrase } from "./limitCard.logic";

const NOW = Date.parse("2026-11-22T21:00:00.000Z");

const model = (slug: string, isDefault = false) =>
  ({ slug, name: slug, isCustom: false, isDefault }) as unknown as ServerProviderModel;

function provider(
  instanceId: string,
  driver: string,
  overrides: Partial<ServerProvider> = {},
): ServerProvider {
  return {
    instanceId: ProviderInstanceId.make(instanceId),
    driver: ProviderDriverKind.make(driver),
    enabled: true,
    installed: true,
    version: "1.0.0",
    status: "ready",
    auth: { status: "authenticated" },
    checkedAt: "2026-11-22T20:00:00.000Z",
    models: driver === "codex" ? [model("gpt-6-astra", true)] : [model("claude-opus-5-5", true)],
    slashCommands: [],
    skills: [],
    ...overrides,
  };
}

const current = { instanceId: ProviderInstanceId.make("codex"), model: "gpt-6-astra" };

describe("continueChoices", () => {
  it("offers another account of the same AI on the same model, then the other AI", () => {
    const choices = continueChoices(
      [
        provider("codex", "codex", { auth: { status: "authenticated", email: "me@school.edu" } }),
        provider("codex_2", "codex", { auth: { status: "authenticated", email: "me@home.org" } }),
        provider("claudeAgent", "claudeAgent"),
      ],
      current,
      NOW,
    );
    expect(choices.map((choice) => [choice.name, choice.label, choice.selection])).toEqual([
      ["me@home.org", "Continue with me@home.org", { instanceId: "codex_2", model: "gpt-6-astra" }],
      ["Claude", "Continue with Claude", { instanceId: "claudeAgent", model: "claude-opus-5-5" }],
    ]);
  });

  it("leaves out accounts that are signed out, turned off or out of usage themselves", () => {
    const choices = continueChoices(
      [
        provider("codex", "codex"),
        provider("codex_2", "codex", { auth: { status: "unauthenticated" } }),
        provider("codex_3", "codex", { enabled: false }),
        provider("claudeAgent", "claudeAgent", {
          usageLimits: {
            windows: [{ id: "five_hour", usedPercent: 100, resetsAt: "2026-11-22T23:00:00.000Z" }],
          } as unknown as ServerProvider["usageLimits"],
        }),
      ],
      current,
      NOW,
    );
    expect(choices).toEqual([]);
  });

  it("offers nothing for a chat whose account it does not know", () => {
    expect(continueChoices([provider("claudeAgent", "claudeAgent")], current, NOW)).toEqual([]);
  });
});

describe("card words", () => {
  it("names the account and says when the limit resets", () => {
    const codex = provider("codex", "codex", {
      auth: { status: "authenticated", email: "me@school.edu" },
    });
    expect(limitCardWords("limit", codex, resetPhrase("11:44 PM", null))).toEqual({
      title: "ChatGPT usage limit reached",
      description:
        "Your ChatGPT account me@school.edu reached its usage limit. It resets at 11:44 PM.",
    });
    expect(
      limitCardWords("subscription", provider("claudeAgent", "claudeAgent"), null).description,
    ).toBe("Your Claude account has no active subscription, so it can't run this chat.");
  });

  it("reads the reset the provider wrote when no exact time came with it", () => {
    expect(resetPhrase(null, "in 2h")).toBe("in 2h");
    expect(resetPhrase(null, "Nov 11th, 2033 3:37 PM")).toBe("at Nov 11th, 2033 3:37 PM");
    expect(resetPhrase("tomorrow at 9:00 AM", null)).toBe("tomorrow at 9:00 AM");
    expect(resetPhrase(null, null)).toBeNull();
  });
});
