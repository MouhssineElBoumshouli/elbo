import { assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";

import {
  problem,
  scriptedAsk,
  teamBrief,
  weekendBrief,
  words,
  written,
} from "./planFixtures.testkit.ts";
import { runMethod } from "./planMethod.ts";

const fixed = (plan: ReturnType<typeof written>, answers: ReadonlyArray<[string, string]>) => ({
  plan,
  answers: answers.map(([id, outcome]) => ({ id, outcome, reason: `${id} ${outcome}` })),
});

const run = (
  writer: ReturnType<typeof scriptedAsk>,
  reviewer: ReturnType<typeof scriptedAsk>,
  brief = teamBrief,
) =>
  runMethod({
    brief,
    write: writer.ask,
    review: reviewer.ask,
    writer: "codex gpt-6-astra",
    reviewer: "claude claude-sonnet-5-5",
    sameProvider: false,
  });

describe("runMethod", () => {
  it.effect("reviews again after a fixed blocker and stops when only nits are left", () =>
    Effect.gen(function* () {
      const writer = scriptedAsk({
        write: written("First plan."),
        "fix:1": fixed(written("Fixed plan."), [
          ["R1", "fixed"],
          ["R2", "declined"],
        ]),
      });
      const reviewer = scriptedAsk({
        "review:1": {
          score: 5,
          problems: [problem("R1", "blocker"), problem("R2", "should"), problem("R3", "nit")],
        },
        "review:2": { score: 8, problems: [problem("R4", "nit")] },
      });
      const result = yield* run(writer, reviewer);

      assert.deepStrictEqual(writer.steps, ["write", "fix:1"]);
      assert.deepStrictEqual(reviewer.steps, ["review:1", "review:2"]);
      assert.notInclude(writer.prompts["fix:1"], "R3 problem");
      assert.include(reviewer.prompts["review:2"], "R1 [blocker] R1 problem → fixed: R1 fixed");
      assert.deepStrictEqual(
        result.rounds.map((round) => round.score),
        [5, 8],
      );
      assert.deepStrictEqual(
        result.log.map((entry) => [entry.id, entry.outcome, entry.reason]),
        [
          ["R1", "fixed", "R1 fixed"],
          ["R2", "declined", "R2 declined"],
        ],
      );
      assert.strictEqual(result.plan.plan, "Fixed plan.");
      assert.match(result.stopReason, /round 2: only nits left/);
      assert.strictEqual(result.size, "medium");
    }),
  );

  it.effect("a fixed should or a declined blocker earns no new review", () =>
    Effect.gen(function* () {
      const writer = scriptedAsk({
        write: written("Plan."),
        "fix:1": fixed(written("Plan."), [
          ["R1", "declined"],
          ["R2", "fixed"],
        ]),
      });
      const reviewer = scriptedAsk({
        "review:1": { score: 6, problems: [problem("R1", "blocker"), problem("R2", "should")] },
      });
      const result = yield* run(writer, reviewer);
      assert.deepStrictEqual(reviewer.steps, ["review:1"]);
      assert.match(result.stopReason, /no blocker was fixed/);
    }),
  );

  it.effect("stops after 3 review rounds", () =>
    Effect.gen(function* () {
      const blocker = { score: 4, problems: [problem("R1", "blocker")] };
      const fix = fixed(written("Plan."), [["R1", "fixed"]]);
      const writer = scriptedAsk({
        write: written("Plan."),
        "fix:1": fix,
        "fix:2": fix,
        "fix:3": fix,
      });
      const reviewer = scriptedAsk({
        "review:1": blocker,
        "review:2": blocker,
        "review:3": blocker,
      });
      const result = yield* run(writer, reviewer);
      assert.deepStrictEqual(reviewer.steps, ["review:1", "review:2", "review:3"]);
      assert.deepStrictEqual(writer.steps, ["write", "fix:1", "fix:2", "fix:3"]);
      assert.match(result.stopReason, /after 3 review rounds/);
    }),
  );

  it.effect("sends the word limit to the fix turn, then shortens a plan still over it", () =>
    Effect.gen(function* () {
      const long = written(words(600));
      const writer = scriptedAsk({
        write: long,
        "fix:1": fixed(long, [["C1", "fixed"]]),
        shorten: written(words(400)),
      });
      const reviewer = scriptedAsk({ "review:1": { score: 7, problems: [] } });
      const result = yield* run(writer, reviewer, weekendBrief);

      assert.strictEqual(result.size, "small");
      assert.deepStrictEqual(writer.steps, ["write", "fix:1", "shorten"]);
      assert.include(writer.prompts["fix:1"], "limit for a small plan is 500");
      assert.deepStrictEqual(
        result.log.map((entry) => [entry.id, entry.from]),
        [["C1", "check"]],
      );
      assert.isAbove(result.wordsBeforeShorten, 600);
      assert.strictEqual(result.plan.plan, words(400));
    }),
  );
});
