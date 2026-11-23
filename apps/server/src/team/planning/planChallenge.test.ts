import { assert, describe, it } from "@effect/vitest";

import { agreed, answered, applyAnswer, openDecisions, touchedBy } from "./planChallenge.ts";
import { decision, written } from "./planFixtures.testkit.ts";
import type { DecisionRecord, PlanTask, PushBackReply } from "./planSchemas.ts";

const task = (title: string, area: string, folders: ReadonlyArray<string> = []): PlanTask => ({
  title,
  owner: "Sara",
  hours: 2,
  area,
  folders,
  when: "Week 1",
});

const plan = written(
  [
    "Build a club shop for our school club.",
    "## Steps",
    "Week 1: Sara sets up Django and the club's product list.",
    "Week 2: Adam builds the order page for the club with plain pages.",
    "## Hosting",
    "We put the club shop on PythonAnywhere's free plan.",
    "## Done checks",
    "A club member can order one product.",
  ].join("\n\n"),
  {
    tasks: [
      task("Set up the Django project", "Server", ["server/"]),
      task("Build the order page", "Pages", ["templates/"]),
      task("Ask the club about prices", "Talks"),
    ],
  },
);

const frontEnd = {
  ...decision("Front end"),
  picked: "Plain pages",
  options: ["Plain pages", "React"],
};
const server = { ...decision("Server"), picked: "Django", options: ["Django", "Flask"] };

const record = (overrides: Partial<DecisionRecord> = {}): DecisionRecord => ({
  number: "0001",
  decision: server,
  main: true,
  status: "open",
  history: [],
  advice: "",
  risk: "",
  ...overrides,
});

const reply = (overrides: Partial<PushBackReply> = {}): PushBackReply => ({
  verdict: "defend",
  answer: "Django's admin saves Sara a week.",
  decision: server,
  parts: [],
  tasks: [],
  risk: "",
  ...overrides,
});

describe("touchedBy", () => {
  it("sends only the parts and tasks that mention the decision, not the whole plan", () => {
    // "club" is in nearly every part, so it never points at a decision.
    assert.deepStrictEqual(touchedBy(server, plan), { parts: [2], tasks: [0] });
    assert.deepStrictEqual(touchedBy(frontEnd, plan), { parts: [3], tasks: [1] });
  });
});

describe("applyAnswer", () => {
  it("rewrites only what was sent, and names what changed", () => {
    const sent = touchedBy(server, plan);
    const flask = applyAnswer(plan, sent, {
      parts: [
        { index: 2, text: "Week 1: Sara sets up Flask and the club's product list." },
        { index: 4, text: "Hosting is gone." },
      ],
      tasks: [
        { index: 0, task: task("Set up the Flask project", "Server", ["server/"]) },
        { index: 2, task: task("Skip the talk", "Talks") },
      ],
    });
    assert.include(flask.written.plan, "Sara sets up Flask");
    assert.include(flask.written.plan, "## Hosting");
    assert.deepStrictEqual(
      flask.written.tasks.map((item) => item.title),
      ["Set up the Flask project", "Build the order page", "Ask the club about prices"],
    );
    assert.deepStrictEqual(flask.updated, ["Steps", 'task "Set up the Flask project"']);
  });
});

describe("decision states", () => {
  const pushBack = { kind: "push-back", message: "Why not Flask?" } as const;
  const common = { by: "Sara", writer: "Codex", updated: ["Steps"] };

  it("a defended decision is answered, unchanged, with the exchange kept", () => {
    const kept = answered({ record: record(), ask: pushBack, reply: reply(), ...common });
    assert.strictEqual(kept.status, "answered");
    assert.strictEqual(kept.decision.picked, "Django");
    assert.deepStrictEqual(
      kept.history.map((step) => [step.kind, step.by, step.updated]),
      [
        ["pushed-back", "Sara", []],
        ["defended", "Codex", []],
      ],
    );
  });

  it("a changed decision takes the new pick and keeps its title", () => {
    const changed = answered({
      record: record(),
      ask: pushBack,
      reply: reply({
        verdict: "change",
        decision: {
          ...server,
          title: "Back end",
          picked: "Flask",
          options: ["Flask, a small Python web framework", "FastAPI"],
        },
      }),
      ...common,
    });
    assert.strictEqual(changed.decision.picked, "Flask");
    // "Also looked at" keeps the old pick and never repeats the new one under a longer name.
    assert.deepStrictEqual(changed.decision.options, ["Flask", "Django", "FastAPI"]);
    assert.strictEqual(changed.decision.title, "Server");
    assert.deepStrictEqual(changed.history[1]!.updated, ["Steps"]);
  });

  it("a pick against the advice keeps the person's choice, the advice and the risk", () => {
    const pick = { kind: "pick", option: "Flask" } as const;
    const flask = answered({
      record: record(),
      ask: pick,
      reply: reply({ verdict: "change", risk: "Flask needs its own login code." }),
      ...common,
    });
    assert.strictEqual(flask.status, "against-advice");
    assert.strictEqual(flask.decision.picked, "Flask");
    assert.strictEqual(flask.advice, "Django");
    assert.strictEqual(flask.risk, "Flask needs its own login code.");
    assert.strictEqual(agreed(flask).status, "against-advice");

    const back = answered({
      record: flask,
      ask: { kind: "pick", option: "Django" },
      reply: reply({ verdict: "change" }),
      ...common,
    });
    assert.deepStrictEqual([back.status, back.advice, back.risk], ["agreed", "", ""]);
  });

  it("the plan saves only when no decision is still open", () => {
    const decisions = [record(), record({ number: "0002", status: "answered" })];
    assert.deepStrictEqual(
      openDecisions(decisions).map((item) => item.number),
      ["0001"],
    );
    assert.deepStrictEqual(openDecisions([agreed(decisions[0]!), decisions[1]!]), []);
  });
});
