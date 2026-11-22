import { assert, describe, it } from "@effect/vitest";

import { decision, problem, words } from "./planFixtures.testkit.ts";
import { overWordLimit, suggestSize } from "./planLimits.ts";
import { withoutApiKeys } from "./planProvider.ts";
import { applyPushBack } from "./planPushBack.ts";
import { checkProblems, logAnswers, numberDecisions, pickReviewer, toFix } from "./planReview.ts";
import { methodTalk } from "./planWords.ts";
import { claudeUsage, codexUsage } from "./providerUsage.ts";

describe("review loop rules", () => {
  it("picks the other provider to review, or the same one when it is the only one signed in", () => {
    assert.deepStrictEqual(pickReviewer("codex", ["codex", "claude"]), {
      provider: "claude",
      sameProvider: false,
    });
    assert.deepStrictEqual(pickReviewer("claude", ["codex", "claude"]), {
      provider: "codex",
      sameProvider: false,
    });
    assert.deepStrictEqual(pickReviewer("codex", ["codex"]), {
      provider: "codex",
      sameProvider: true,
    });
  });

  it("sends blockers and shoulds to the fix turn, never nits", () => {
    assert.deepStrictEqual(
      toFix([problem("R1", "nit"), problem("R2", "should"), problem("R3", "blocker")]).map(
        (found) => [found.id, found.from],
      ),
      [
        ["R2", "reviewer"],
        ["R3", "reviewer"],
      ],
    );
  });

  it("finds an over-long plan and lines about the method", () => {
    assert.deepStrictEqual(checkProblems(words(500), "small"), []);
    const found = checkProblems(`${words(501)}\nThe other experts agreed.`, "small");
    assert.deepStrictEqual(
      found.map((entry) => [entry.id, entry.severity, entry.from]),
      [
        ["C1", "should", "check"],
        ["C2", "should", "check"],
      ],
    );
    assert.include(found[0]?.problem, "505 words");
    assert.include(found[1]?.problem, "The other experts agreed.");
  });

  it("logs a problem the writer did not answer as such", () => {
    const entries = logAnswers(2, toFix([problem("R1", "blocker"), problem("R2", "should")]), [
      { id: "R1", outcome: "fixed", reason: "Done." },
    ]);
    assert.deepStrictEqual(
      entries.map((entry) => [entry.round, entry.id, entry.outcome, entry.point]),
      [
        [2, "R1", "fixed", "R1 problem"],
        [2, "R2", "no answer", "R2 problem"],
      ],
    );
  });

  it("keeps the size's number of decisions; the rest are smaller choices", () => {
    const records = numberDecisions(
      ["A", "B", "C"].map((title) => decision(title)),
      "small",
    );
    assert.deepStrictEqual(
      records.map((record) => [record.number, record.decision.title, record.main]),
      [
        ["0001", "A", true],
        ["0002", "B", true],
        ["0003", "C", false],
      ],
    );
  });

  it("sizes the plan from the team and counts words against its limit", () => {
    assert.strictEqual(suggestSize(1, 10, 2), "small");
    assert.strictEqual(suggestSize(3, 144, 42), "medium");
    assert.strictEqual(suggestSize(4, 400, 100), "large");
    assert.isFalse(overWordLimit(words(500), "small"));
    assert.isTrue(overWordLimit(words(501), "small"));
  });
});

describe("methodTalk", () => {
  it("finds lines about the planning session and lets ordinary project words pass", () => {
    const plan = [
      "The supplied manager breakdown supports 36 planned person-hours.",
      "Use the proposed 100-hour shared breakdown as a replacement mapping.",
      "The architect's draft picked Firebase.",
      "Other experts agreed on polling.",
      "T11 Draft the three-minute pitch (Noor · Presentation)",
      "Teachers use the admin panel to fix the list.",
    ].join("\n");
    assert.deepStrictEqual(methodTalk(plan), [
      "The supplied manager breakdown supports 36 planned person-hours.",
      "Use the proposed 100-hour shared breakdown as a replacement mapping.",
      "The architect's draft picked Firebase.",
      "Other experts agreed on polling.",
    ]);
  });
});

describe("push-back", () => {
  const record = { number: "0001", decision: decision("Front end"), main: true, history: [] };

  it("a defended decision stays and the exchange is kept", () => {
    const kept = applyPushBack(record, "Adam", "I know React.", {
      verdict: "defend",
      answer: "Still best.",
      decision: decision("Front end", "React"),
    });
    assert.strictEqual(kept.decision.picked, "Plain pages");
    assert.deepStrictEqual(kept.history, [
      `Adam pushed back: "I know React."`,
      "Kept: Still best.",
    ]);
  });

  it("a changed decision takes the new pick", () => {
    const changed = applyPushBack(record, "Sara", "None of us can learn it in time.", {
      verdict: "change",
      answer: "Fair.",
      decision: decision("Front end", "React"),
    });
    assert.strictEqual(changed.decision.picked, "React");
    assert.strictEqual(changed.history[1], "Changed: Fair.");
  });
});

describe("provider shell", () => {
  it("drops billed API keys from the provider environment", () => {
    const env = withoutApiKeys({ ANTHROPIC_API_KEY: "k", OPENAI_API_KEY: "k", HOME: "/home/user" });
    assert.deepStrictEqual(env, { HOME: "/home/user" });
  });

  it("reads token counts from the CLIs' output", () => {
    assert.deepStrictEqual(
      claudeUsage(
        JSON.stringify([
          { type: "assistant" },
          {
            type: "result",
            usage: {
              input_tokens: 10,
              cache_read_input_tokens: 900,
              cache_creation_input_tokens: 90,
              output_tokens: 50,
            },
          },
        ]),
      ),
      { inputTokens: 1000, cachedInputTokens: 900, outputTokens: 50 },
    );
    const codex = [
      `{"type":"thread.started","thread_id":"019a-thread"}`,
      `{"type":"turn.completed","usage":{"input_tokens":1200,"cached_input_tokens":800,"output_tokens":300}}`,
      "not json",
    ].join("\n");
    assert.deepStrictEqual(codexUsage(codex), {
      inputTokens: 1200,
      cachedInputTokens: 800,
      outputTokens: 300,
    });
    assert.isUndefined(codexUsage(""));
  });
});
