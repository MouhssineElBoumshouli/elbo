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
import { runMethod } from "./planMethod.ts";

const checklists = {
  architect: "- A1: Does the team know this stack?",
  security: "- S1: How do people log in?\n- S2: How are passwords stored?",
  "quick-security": "- QS1: Where do secrets live?",
};

describe("runMethod", () => {
  it.effect(
    "a small plan has two writers, no cross-review, and the architect answers quick security",
    () =>
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
        assert.include(fake.prompts["draft:architect"], "QS1");
        assert.include(fake.prompts["draft:architect"], "simplest storage");
      }),
  );

  it.effect(
    "a medium plan fixes every part in one turn and keeps only the parts the review named",
    () =>
      Effect.gen(function* () {
        const fake = fakeAsk({
          size: { size: "medium", panel: ["designer"] },
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
          "fix:1",
          "merge",
        ]);
        assert.notInclude(fake.prompts["draft:architect"], "QS1");
        assert.deepStrictEqual(
          result.problems.map((p) => p.to),
          ["architect"],
        );
        assert.deepStrictEqual(
          result.decisions.map((r) => r.decision.title),
          ["Fixed by architect"],
        );
      }),
  );

  it.effect("in one shared chat, later prompts do not repeat the brief or the parts", () =>
    Effect.gen(function* () {
      const fake = fakeAsk({
        size: { size: "medium", panel: [] },
        reviews: [[{ from: "security", to: "architect", problem: "p", fix: "f" }]],
        merge: merge(["Sara", "Yassine"]),
      });
      yield* runMethod({ brief: teamBrief, checklists, ask: fake.ask, sharedChat: true });
      assert.include(fake.prompts.size, "A club shop for our school club.");
      for (const step of ["draft:architect", "review:1", "fix:1", "merge"]) {
        assert.notInclude(fake.prompts[step], "A club shop for our school club.", step);
        assert.notInclude(fake.prompts[step], "summary for", step);
      }
    }),
  );

  it.effect("a plan over its word limit gets one shorten turn", () =>
    Effect.gen(function* () {
      const long = Array.from({ length: 600 }, () => "word").join(" ");
      const fake = fakeAsk({
        size: { size: "small", panel: [] },
        merge: merge(["Lina"], { sections: [{ section: "what", summary: long, details: "" }] }),
        shorter: merge(["Lina"]),
      });
      const result = yield* runMethod({ brief: weekendBrief, checklists, ask: fake.ask });
      assert.deepStrictEqual(fake.steps.slice(-2), ["merge", "shorten"]);
      assert.isAbove(result.wordsBeforeShorten, 600);
      assert.strictEqual(result.merge.sections[0]?.summary, "What we build, in short.");
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
  it("seats experts by kind: a one-day hackathon gets the pitch coach, not a security seat", () => {
    const panel = (kind: "app" | "hackathon", deadlineDays: number) =>
      normalizePanel({
        size: "medium",
        kind,
        isSoftware: true,
        deadlineDays,
        requested: ["security", "designer", "ai-engineer"],
      });
    assert.deepStrictEqual(panel("hackathon", 1), [
      "project-manager",
      "architect",
      "hackathon",
      "designer",
    ]);
    assert.deepStrictEqual(panel("app", 42), [
      "project-manager",
      "architect",
      "security",
      "designer",
    ]);
    assert.deepStrictEqual(
      normalizePanel({
        size: "medium",
        kind: "other",
        isSoftware: false,
        deadlineDays: 42,
        requested: [],
      }),
      ["project-manager", "architect", "designer"],
    );
  });

  it("records overruns without cutting text, and drops only whole extra options", () => {
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
    assert.strictEqual(value.parts[0]?.details, long);
    assert.strictEqual(value.parts[0]?.summary, "a\nb\nc\nd");
    assert.strictEqual(value.decisions[0]?.options.length, 3);
    assert.strictEqual(overruns.length, 3);
  });
});
