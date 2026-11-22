import { assert, describe, it } from "@effect/vitest";

import { budgetDecisions, overWordLimit } from "./planBudget.ts";
import { decision, draftFor } from "./planFixtures.testkit.ts";
import { applyPushBack } from "./planPushBack.ts";
import { checklistIds } from "./planPrompts.ts";
import { withoutApiKeys } from "./planProvider.ts";
import { methodTalk } from "./planWords.ts";
import { claudeUsage, codexThreadId, codexUsage } from "./providerUsage.ts";

describe("budgetDecisions", () => {
  const drafts = [
    {
      expert: "architect" as const,
      draft: draftFor("architect", { decisions: ["A", "B", "C"].map((t) => decision(t, "stack")) }),
    },
    {
      expert: "security" as const,
      draft: draftFor("security", { decisions: [decision("D", "security")] }),
    },
  ];

  it("keeps the ranked decisions up to the size's limit as cards, first, and the rest as smaller choices", () => {
    const records = budgetDecisions(drafts, "small", [" d ", "nope", "B", "A"]);
    assert.deepStrictEqual(
      records.map((r) => [r.number, r.decision.title, r.main]),
      [
        ["0001", "D", true],
        ["0002", "B", true],
        ["0003", "A", false],
        ["0004", "C", false],
      ],
    );
  });

  it("keeps the first ones in plan order when nothing ranked matches", () => {
    assert.deepStrictEqual(
      budgetDecisions(drafts, "small", []).map((r) => r.main),
      [true, true, false, false],
    );
  });

  it("counts words against the size's limit", () => {
    const words = (n: number) => Array.from({ length: n }, () => "w").join(" ");
    assert.isFalse(overWordLimit(words(500), "small"));
    assert.isTrue(overWordLimit(words(501), "small"));
    assert.isFalse(overWordLimit(words(1500), "medium"));
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
      "Raised by the security engineer and the software architect.",
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
  const record = {
    number: "0001",
    owner: "architect" as const,
    decidedBy: "software architect, proposed",
    status: "proposed",
    decision: decision("Front end", "stack"),
    history: [],
    main: true,
  };

  it("a defended decision stays and the exchange is kept", () => {
    const kept = applyPushBack(record, "Adam", "I know React.", {
      verdict: "defend",
      answer: "Still best.",
      decision: { ...record.decision, picked: "React" },
    });
    assert.strictEqual(kept.decision.picked, "Plain pages");
    assert.deepStrictEqual(kept.history, [
      `Adam pushed back: "I know React."`,
      "The software architect defended it: Still best.",
    ]);
  });

  it("a changed decision takes the new pick", () => {
    const changed = applyPushBack(record, "Sara", "None of us can learn it in time.", {
      verdict: "change",
      answer: "Fair.",
      decision: { ...record.decision, picked: "React" },
    });
    assert.strictEqual(changed.decision.picked, "React");
    assert.match(changed.history[1] ?? "", /changed it/);
  });
});

describe("provider shell", () => {
  it("reads checklist ids", () => {
    assert.deepStrictEqual(checklistIds("- S1: a?\n- QS2: b?\nnot an item"), ["S1", "QS2"]);
  });

  it("drops billed API keys from the provider environment", () => {
    const env = withoutApiKeys({ ANTHROPIC_API_KEY: "k", OPENAI_API_KEY: "k", HOME: "/home/user" });
    assert.deepStrictEqual(env, { HOME: "/home/user" });
  });

  it("reads token counts and the session id from the CLIs' output", () => {
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
    assert.strictEqual(codexThreadId(codex), "019a-thread");
    assert.isUndefined(codexUsage(""));
    assert.isUndefined(codexThreadId("not json"));
  });
});
