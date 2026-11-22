import { describe, expect, it } from "vite-plus/test";

import { classifyTurnFailure, type TurnFailure } from "./limitFailure.ts";

const failure = (overrides: Partial<TurnFailure>): TurnFailure => ({
  class: "provider_error",
  code: null,
  message: null,
  resetAt: null,
  ...overrides,
});

describe("classifyTurnFailure", () => {
  it.each([
    {
      source: "codex exec, Elbo's planning eval, 2026-11-22",
      message:
        "You’ve hit your usage limit. Upgrade to Pro (https://chatgpt.com/explore/pro), visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 11:44 PM.",
      resetText: "11:44 PM",
    },
    {
      source: "Codex app server, upstream CodexAdapterV2 test",
      message:
        "You’ve hit your usage limit. Visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at Nov 11th, 2033 3:37 PM.",
      resetText: "Nov 11th, 2033 3:37 PM",
    },
    {
      source: "Codex ChatGPT sharing, upstream CodexAdapterV2 test",
      message:
        "stream disconnected before completion: The ChatGPT user has reached their Subscription Sharing usage limit. Ask the user to try again after their usage limit resets or use an API key instead.",
      resetText: null,
    },
    {
      source: "Claude adapter, upstream ClaudeAdapterV2 test",
      message:
        "Claude usage limit reached. This turn is paused until the 5-hour limit resets in 2h.",
      resetText: "in 2h",
    },
  ])("reads a usage limit from its text: $source", ({ message, resetText }) => {
    expect(classifyTurnFailure(failure({ message }))).toEqual({
      kind: "limit",
      resetAt: null,
      resetText,
    });
  });

  it("trusts the adapter's class and reset time when it has them", () => {
    expect(
      classifyTurnFailure(
        failure({
          class: "usage_limit",
          code: "subscription_sharing_usage_limit_exceeded",
          message: "ChatGPT usage limit reached.",
          resetAt: "2026-11-22T23:44:00.000Z",
        }),
      ),
    ).toEqual({ kind: "limit", resetAt: "2026-11-22T23:44:00.000Z", resetText: null });
  });

  it.each([
    {
      source: "anthropics/claude-code#32918",
      message:
        "Your subscription payment is past due. Please pay your overdue invoice to restore access.",
    },
    {
      // Claude Code reports this as a 429 rate_limit_error, so the adapter may call it a limit.
      source: "anthropics/claude-code#55314",
      message: "Your Claude Code trial has ended. Run /upgrade or /extra-usage to continue.",
      class: "usage_limit",
    },
    {
      source: "anthropics/claude-code#88283",
      message: "Claude Max or Pro is required to connect to Claude Code",
    },
    {
      source: "anthropics/claude-code#30854",
      message: "Your account does not have access to Claude Code. Please run /login.",
    },
  ])("finds a subscription that is not active: $source", ({ message, class: failureClass }) => {
    expect(
      classifyTurnFailure(failure({ message, class: failureClass ?? "permission_error" })),
    ).toEqual({ kind: "subscription" });
  });

  it("finds OpenAI's documented not-eligible code", () => {
    expect(
      classifyTurnFailure(
        failure({ code: "subscription_sharing_user_not_eligible", message: "Forbidden" }),
      ),
    ).toEqual({ kind: "subscription" });
  });

  it.each([
    "Transport unavailable; this is not subscription_sharing_usage_limit_exceeded.",
    "Codex CLI command failed with code 1.",
    "The 'gpt-5.4' model is not supported when using Codex with a ChatGPT account.",
  ])("leaves other failures alone: %s", (message) => {
    expect(classifyTurnFailure(failure({ message }))).toEqual({ kind: "other" });
  });
});
