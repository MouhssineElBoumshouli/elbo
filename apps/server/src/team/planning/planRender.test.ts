import { assert, describe, it } from "@effect/vitest";

import { decision, problem, written } from "./planFixtures.testkit.ts";
import { renderDecisionLog, renderPlan } from "./planRender.ts";
import { numberDecisions } from "./planReview.ts";
import type { PlanResult } from "./planSchemas.ts";

const records = numberDecisions(
  [decision("Front end"), decision("Storage", "SQLite"), decision("Hosting", "School server")],
  "small",
);

describe("renderPlan", () => {
  it("adds the decisions as a short list in the plan's own heading style", () => {
    const page = renderPlan(written("# Club shop\n\n## Steps\n\nWeek 1: list page."), records);
    assert.include(
      page,
      "## Decisions\n\n- **Front end:** Plain pages (also looked at: React). The team knows HTML.",
    );
    assert.include(page, "Smaller choices: Hosting: School server.");
    assert.notInclude(page, "Experts");
    assert.notInclude(page, "| ");

    assert.include(renderPlan(written("**Steps**\n\nSaturday: page."), records), "**Decisions**");
    assert.match(renderPlan(written("Steps\n\nSaturday: page."), records), /\n\nDecisions\n\n- /);
  });
});

describe("renderDecisionLog", () => {
  const result: PlanResult = {
    size: "small",
    writer: "codex gpt-6-astra",
    reviewer: "codex gpt-6-astra",
    sameProvider: true,
    plan: written("Plan."),
    decisions: records,
    rounds: [
      {
        round: 1,
        score: 6,
        words: 320,
        problems: [problem("R1", "blocker"), problem("R2", "nit")],
      },
    ],
    log: [
      {
        round: 1,
        id: "R1",
        severity: "blocker",
        from: "reviewer",
        point: "Passwords in plain text.",
        outcome: "fixed",
        reason: "Hashed now.",
      },
    ],
    stopReason: "Stopped after round 1: no blocker was fixed, so no new review.",
    wordsBeforeShorten: 0,
  };

  it("says when the writer's own provider reviewed, and keeps every round and answer", () => {
    const log = renderDecisionLog(result);
    assert.include(log, "no other provider was signed in");
    assert.include(log, "| 1 | 6/10 | 320 | 1 | 0 | 1 |");
    assert.include(
      log,
      "| 1 | R1 | blocker | reviewer | Passwords in plain text. | fixed | Hashed now. |",
    );
    assert.include(log, "- Round 1, R2: R2 problem");
    assert.include(log, "### 0002 Storage");
  });
});
