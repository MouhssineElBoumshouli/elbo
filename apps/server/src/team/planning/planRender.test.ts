import { assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import { wordCount } from "./planCaps.ts";
import {
  decision,
  draftFor,
  fakeAsk,
  merge,
  teamBrief,
  weekendBrief,
} from "./planFixtures.testkit.ts";
import { runMethod } from "./planMethod.ts";
import { decisionFileName, renderDecision, renderPlan } from "./planRender.ts";

describe("renderPlan", () => {
  it.effect("a small plan is one page: a to-do list, top 3 risks, no log or glossary", () =>
    Effect.gen(function* () {
      const fake = fakeAsk({
        size: { size: "small", panel: [] },
        drafts: { architect: draftFor("architect", { decisions: [decision("Stack", "stack")] }) },
        merge: merge(["Lina"]),
      });
      const markdown = renderPlan(
        yield* runMethod({ brief: weekendBrief, checklists: {}, ask: fake.ask }),
      );
      assert.include(markdown, "- [ ] Task 1 (Lina · app/)");
      assert.include(markdown, "**Stack:** Plain pages (also looked at: React).");
      assert.notInclude(markdown, "Risk 4");
      assert.notInclude(markdown, "Decisions log");
      assert.notInclude(markdown, "Go deeper");
      assert.isBelow(wordCount(markdown), 500);
    }),
  );

  it.effect("a medium plan shows decision tables, push-backs on the brief and open choices", () =>
    Effect.gen(function* () {
      const fake = fakeAsk({
        size: { size: "medium", panel: [] },
        drafts: {
          security: draftFor("security", {
            challenges: [
              {
                idea: "Passwords in plain text",
                problem: "A leak exposes them.",
                better: "bcrypt",
              },
            ],
          }),
        },
        reviews: [[{ from: "security", to: "architect", problem: "p", fix: "f" }]],
        merge: merge(["Sara", "Yassine"]),
      });
      const markdown = renderPlan(
        yield* runMethod({ brief: teamBrief, checklists: {}, ask: fake.ask }),
      );
      assert.include(
        markdown,
        "**Passwords in plain text** (the security engineer): A leak exposes them. Better: bcrypt",
      );
      assert.include(markdown, "## Choices for you");
      assert.include(
        markdown,
        "| **Plain pages** (picked) | simple | less interactive | Yassine knows HTML |",
      );
      assert.include(markdown, "Decisions log");
      assert.include(markdown, "| 2 | T2 Task 2 (Yassine · app/) |");
    }),
  );
});

describe("renderDecision", () => {
  it("writes the rulebook front matter with the planning fields", () => {
    const record = {
      number: "0003",
      owner: "architect" as const,
      decidedBy: "software architect, proposed",
      status: "proposed",
      decision: decision("Database and hosting: Postgres on a free EU host", "stack"),
      history: [],
    };
    assert.strictEqual(
      decisionFileName(record),
      "0003-database-and-hosting-postgres-on-a-free-eu-host.md",
    );
    const file = renderDecision(record, "2026-11-22");
    assert.include(file, 'options: ["Plain pages", "React"]');
    assert.include(file, 'decided_by: "software architect, proposed"');
    assert.include(file, "status: proposed");
    assert.include(file, "date: 2026-11-22");
  });
});
