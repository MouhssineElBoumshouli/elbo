import { assert, describe, it } from "@effect/vitest";
import {
  ProviderDriverKind,
  ProviderInstanceId,
  type ServerProvider,
  type ServerProviderModel,
} from "@t3tools/contracts";

import { written } from "./planFixtures.testkit.ts";
import { numberDecisions } from "./planReview.ts";
import { pickPlanSeats, planView, stepOf } from "./planRun.ts";

const model = (slug: string) => ({ slug, name: slug }) as unknown as ServerProviderModel;

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
    checkedAt: "2026-11-23T08:00:00.000Z",
    models:
      driver === "codex"
        ? [model("gpt-6-astra")]
        : [model("claude-sonnet-5-5"), model("claude-opus-5-5")],
    slashCommands: [],
    skills: [],
    ...overrides,
  };
}

describe("pickPlanSeats", () => {
  it("lets Codex write and Claude review on its strongest model", () => {
    const seats = pickPlanSeats([
      provider("claudeAgent", "claudeAgent"),
      provider("codex", "codex"),
    ]);
    assert.deepStrictEqual(
      [seats?.writer.agent, seats?.reviewer.agent, seats?.reviewer.effort, seats?.sameProvider],
      [
        { driver: "codex", name: "Codex", model: "gpt-6-astra" },
        { driver: "claudeAgent", name: "Claude", model: "claude-opus-5-5" },
        "high",
        false,
      ],
    );
  });

  it("uses the one connected AI for both and says so", () => {
    const seats = pickPlanSeats([
      provider("codex", "codex", { auth: { status: "unauthenticated" } }),
      provider("claudeAgent", "claudeAgent"),
    ]);
    assert.strictEqual(seats?.writer.agent.name, "Claude");
    assert.strictEqual(seats?.reviewer.agent.name, "Claude");
    assert.isTrue(seats?.sameProvider);
  });

  it("finds no seat when no AI is ready", () => {
    assert.isNull(
      pickPlanSeats([provider("codex", "codex", { enabled: false }), provider("cursor", "cursor")]),
    );
  });
});

describe("a run's steps and result", () => {
  it("names each turn's step", () => {
    assert.deepStrictEqual(["write", "review:2", "fix:1", "shorten"].map(stepOf), [
      { step: "writing", round: 0 },
      { step: "reviewing", round: 2 },
      { step: "fixing", round: 1 },
      { step: "shortening", round: 0 },
    ]);
  });

  it("shows the plan with its decisions, the scores and what the review changed", () => {
    const plan = written("## Steps\n\nWeek 1: list page.");
    const view = planView({
      size: "small",
      writer: "Codex gpt-6-astra",
      reviewer: "Claude claude-opus-5-5",
      sameProvider: false,
      plan,
      decisions: numberDecisions(plan.decisions, "small"),
      rounds: [
        {
          round: 1,
          score: 8,
          words: 12,
          problems: [
            { id: "R1", severity: "should", problem: "No port.", why: "", fix: "" },
            { id: "R2", severity: "nit", problem: "Wording.", why: "", fix: "" },
          ],
        },
      ],
      log: [
        {
          round: 1,
          id: "R1",
          severity: "should",
          from: "reviewer",
          point: "No port.",
          outcome: "fixed",
          reason: "Named it.",
        },
      ],
      stopReason: "Stopped after round 1: no blocker was fixed, so no new review.",
      wordsBeforeShorten: 0,
    });
    assert.include(view.markdown, "## Decisions");
    assert.deepStrictEqual(view.scores, [8]);
    assert.deepStrictEqual(
      view.changes.map((change) => [change.point, change.outcome]),
      [["No port.", "fixed"]],
    );
    assert.strictEqual(view.nits, 1);
  });
});
