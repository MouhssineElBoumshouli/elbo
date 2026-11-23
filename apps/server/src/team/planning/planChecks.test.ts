import { assert, describe, it } from "@effect/vitest";

import { decision, problem, teamBrief, words, written } from "./planFixtures.testkit.ts";
import { answerPrompt, reviewPrompt, writerPrompt } from "./planPrompts.ts";
import { overWordLimit, suggestSize } from "./planLimits.ts";
import { withoutApiKeys } from "./planProvider.ts";
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
    // A small plan's limit is 500; up to 10% over is not a problem.
    assert.deepStrictEqual(checkProblems(words(550), "small"), []);
    const found = checkProblems(`${words(551)}\nThe other experts agreed.`, "small");
    assert.deepStrictEqual(
      found.map((entry) => [entry.id, entry.severity, entry.from]),
      [
        ["C1", "should", "check"],
        ["C2", "should", "check"],
      ],
    );
    assert.include(found[0]?.problem, "555 words");
    assert.include(found[1]?.problem, "The other experts agreed.");
  });

  it("keeps rules few and short: at most 2, 4 or 6 by size, one requirement under 20 words", () => {
    const ruled = (rule: string) => ({ ...decision("Choice"), rule });
    const four = [
      "Use Django.",
      "Use SQLite via the ORM.",
      "Hash passwords.",
      "Keep data in the EU.",
    ];
    assert.deepStrictEqual(checkProblems(words(10), "medium", four.map(ruled)), []);
    const tooMany = checkProblems(words(10), "small", four.map(ruled));
    assert.include(tooMany[0]?.problem, "4 code rules; a small plan has at most 2");
    const long = checkProblems(words(10), "large", [
      ruled(
        "Accept verified JPEG and PNG up to 5 MB and 20 million pixels, save them once at 1000 pixels, and enforce five photos per recipe.",
      ),
    ]);
    assert.include(long[0]?.problem, "Rules longer than 20 words");
    assert.strictEqual(long[0]?.severity, "should");
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
    assert.isFalse(overWordLimit(words(550), "small"));
    assert.isTrue(overWordLimit(words(551), "small"));
  });
});

describe("writer prompt", () => {
  it("asks for a rule only where an AI writing code could break the decision", () => {
    const prompt = writerPrompt(teamBrief, "medium");
    assert.include(prompt, "only when an AI writing the code could break this decision");
    assert.include(prompt, "Most decisions have none");
  });

  it("puts the project's own rules in the brief, and the reviewer flags a plan against them", () => {
    const brief = {
      ...teamBrief,
      projectRules: ["Never use SQLite; the school gives us PostgreSQL."],
    };
    const writer = writerPrompt(brief, "medium");
    assert.include(writer, "This project's own rules (from its AGENTS.md / CLAUDE.md)");
    assert.include(writer, "- Never use SQLite; the school gives us PostgreSQL.");
    assert.include(writer, "never pick an option they rule out");
    assert.notInclude(writerPrompt(teamBrief, "medium"), "This project's own rules");
    const review = reviewPrompt({
      brief,
      markdown: "Use SQLite.",
      written: written("Use SQLite."),
      round: 1,
      log: [],
    });
    assert.include(review, "Never use SQLite");
    assert.include(
      review,
      "goes against one of the project's own rules listed in the brief (at least a should)",
    );
  });

  it("asks for rules an agent can check, in the plan and in an answer", () => {
    const answer = answerPrompt({
      brief: teamBrief,
      decision: decision("Front end"),
      parts: [],
      tasks: [],
      ask: { kind: "push-back", message: "Why not React?" },
    });
    for (const prompt of [writerPrompt(teamBrief, "medium"), answer]) {
      assert.include(prompt, "specific enough to check in the code");
      assert.include(prompt, '"Store passwords only as Django password hashes."');
      assert.include(prompt, 'never a goal like "Keep it secure."');
    }
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
