import { assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import { capDraft } from "./planCaps.ts";
import { normalizePanel } from "./planExperts.ts";
import {
  decision,
  draftFor,
  fakeAsk,
  merge,
  teamBrief,
  weekendBrief,
} from "./planFixtures.testkit.ts";
import { applyPushBack, pushBack, runMethod } from "./planMethod.ts";
import { checklistIds } from "./planPrompts.ts";
import { withoutApiKeys } from "./planProvider.ts";
import { claudeUsage, codexUsage } from "./providerUsage.ts";

const checklists = { security: "- S1: How do people log in?\n- S2: How are passwords stored?" };

describe("runMethod", () => {
  it.effect("a small plan has two writers and no cross-review", () =>
    Effect.gen(function* () {
      const fake = fakeAsk({
        size: { size: "small", panel: ["designer", "security"] },
        merge: merge(["Lina"]),
      });
      const result = yield* runMethod({ brief: weekendBrief, checklists, ask: fake.ask });
      assert.deepStrictEqual(result.panel, ["project-manager", "architect"]);
      assert.deepStrictEqual(fake.steps, [
        "size",
        "draft:project-manager",
        "draft:architect",
        "merge",
      ]);
    }),
  );

  it.effect("a medium plan reviews once and only experts with problems fix their part", () =>
    Effect.gen(function* () {
      const fake = fakeAsk({
        size: { size: "medium", panel: ["designer"] },
        drafts: {
          architect: draftFor("architect", { decisions: [decision("Front end", "stack")] }),
        },
        reviews: [
          [
            {
              from: "security",
              to: "architect",
              problem: "Firebase breaks the EU rule.",
              fix: "EU host",
            },
            { from: "security", to: "security", problem: "self", fix: "ignored" },
          ],
        ],
        merge: merge(["Sara", "Yassine"]),
      });
      const result = yield* runMethod({ brief: teamBrief, checklists, ask: fake.ask });
      assert.deepStrictEqual(fake.steps, [
        "size",
        "draft:project-manager",
        "draft:architect",
        "draft:security",
        "draft:designer",
        "review:1",
        "fix:1:architect",
        "merge",
      ]);
      assert.strictEqual(result.problems.length, 1);
      assert.deepStrictEqual(
        result.choices.map((c) => c.question),
        ["Choice from architect"],
      );
      assert.deepStrictEqual(
        result.decisions.map((r) => [r.number, r.decision.title, r.owner, r.status]),
        [["0001", "Fixed", "architect", "proposed"]],
      );
    }),
  );

  it.effect("a size set by the person wins over the panel's pick", () =>
    Effect.gen(function* () {
      const fake = fakeAsk({ size: { size: "medium", panel: [] }, merge: merge(["Lina"]) });
      const result = yield* runMethod({
        brief: weekendBrief,
        checklists,
        ask: fake.ask,
        size: "small",
      });
      assert.strictEqual(result.size, "small");
      assert.isFalse(fake.steps.some((step) => step.startsWith("review")));
    }),
  );
});

describe("panel and caps", () => {
  it("keeps the required experts and trims a long wish list to the size", () => {
    assert.deepStrictEqual(
      normalizePanel("medium", true, ["designer", "ai-engineer", "research", "ml"]),
      ["project-manager", "architect", "security", "designer"],
    );
    assert.deepStrictEqual(normalizePanel("medium", false, []), [
      "project-manager",
      "architect",
      "designer",
    ]);
  });

  it("trims over-long fields and extra options and records each overrun", () => {
    const long = Array.from({ length: 200 }, () => "word").join(" ");
    const draft = draftFor("architect", {
      parts: [{ section: "stack", summary: "a\nb\nc\nd", details: long, diagram: "" }],
      decisions: [
        {
          ...decision("Backend", "stack"),
          options: [1, 2, 3, 4].map((n) => ({ name: `O${n}`, good: "", bad: "", fit: "" })),
        },
      ],
    });
    const { value, overruns } = capDraft(draft, "architect");
    assert.strictEqual(value.parts[0]?.summary, "a\nb\nc");
    assert.strictEqual(value.parts[0]?.details.split(" ").length, 151);
    assert.strictEqual(value.decisions[0]?.options.length, 3);
    assert.strictEqual(overruns.length, 3);
  });
});

describe("push-back", () => {
  it.effect("a defended decision stays and the exchange is kept", () =>
    Effect.gen(function* () {
      const fake = fakeAsk({ size: { size: "small", panel: [] }, merge: merge([]) });
      const record = {
        number: "0002",
        owner: "architect" as const,
        decidedBy: "software architect, proposed",
        status: "proposed",
        decision: decision("Front end", "stack"),
        history: [],
      };
      const result = yield* pushBack({
        brief: teamBrief,
        record,
        message: "I know React, wouldn't it be faster?",
        by: "Mouhssine",
        checklists,
        ask: fake.ask,
      });
      assert.deepStrictEqual(fake.steps, ["push-back:0002"]);
      assert.strictEqual(result.decision.picked, "Plain pages");
      assert.deepStrictEqual(result.history, [
        `Mouhssine pushed back: "I know React, wouldn't it be faster?"`,
        "The software architect defended it: Still best.",
      ]);
    }),
  );

  it("a changed decision takes the new pick", () => {
    const record = {
      number: "0001",
      owner: "architect" as const,
      decidedBy: "software architect, proposed",
      status: "proposed",
      decision: decision("Front end", "stack"),
      history: [],
    };
    const changed = applyPushBack(record, "Sara", "None of us can learn it in time.", {
      verdict: "change",
      answer: "Fair, React it is not.",
      decision: { ...record.decision, picked: "React" },
    });
    assert.strictEqual(changed.decision.picked, "React");
    assert.match(changed.history[1] ?? "", /changed it/);
  });
});

describe("provider shell", () => {
  it("reads checklist ids", () => {
    assert.deepStrictEqual(checklistIds(checklists.security), ["S1", "S2"]);
  });

  it("drops billed API keys from the provider environment", () => {
    const env = withoutApiKeys({ ANTHROPIC_API_KEY: "k", OPENAI_API_KEY: "k", HOME: "/home/user" });
    assert.deepStrictEqual(env, { HOME: "/home/user" });
  });

  it("reads token counts from both CLIs", () => {
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
      `{"type":"thread.started"}`,
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
