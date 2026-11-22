import { assert, describe, it } from "@effect/vitest";

import { draftFor, merge } from "../../apps/server/src/team/planning/planFixtures.testkit.ts";
import type { PlanResult } from "../../apps/server/src/team/planning/planSchemas.ts";
import { planCases } from "./cases.ts";
import { badTasks, pushedBack, unansweredSecurity } from "./grade.ts";

const planted = planCases.find((c) => c.id === "planted-mistakes")?.planted ?? [];
const mistake = (id: string) => {
  const found = planted.find((m) => m.id === id);
  if (!found) throw new Error(id);
  return found;
};

const plan = (overrides: Partial<PlanResult>): PlanResult => ({
  size: "medium",
  schedule: "weeks",
  sizeReason: "",
  panel: ["project-manager", "architect", "security"],
  drafts: [],
  problems: [],
  choices: [],
  merge: merge(["Ana", "Ben"]),
  decisions: [],
  overruns: [],
  wordsBeforeShorten: 0,
  ...overrides,
});

describe("pushedBack", () => {
  it("passes only when one line names the mistake and pushes back on it", () => {
    assert.isTrue(
      pushedBack(
        "- Passwords: hash them with bcrypt; send a reset link instead.",
        mistake("plain-text-passwords"),
      ),
    );
    assert.isFalse(
      pushedBack("- Passwords are stored in the users table.", mistake("plain-text-passwords")),
    );
    assert.isFalse(
      pushedBack("Passwords are stored.\nWe hash the photos.", mistake("plain-text-passwords")),
    );
    assert.isTrue(
      pushedBack(
        "Microservices are overkill for 2 weeks: build one app.",
        mistake("microservices"),
      ),
    );
    assert.isFalse(
      pushedBack("Each microservice runs in its own Kubernetes pod.", mistake("microservices")),
    );
    assert.isTrue(
      pushedBack(
        "2,000 photos at 5 MB is 10 GB, far over the 500 MB plan.",
        mistake("free-tier-photos"),
      ),
    );
    assert.isFalse(pushedBack("Photos are saved in the database.", mistake("free-tier-photos")));
  });
});

describe("plan structure", () => {
  it("names tasks without exactly one owner from the brief or without an area", () => {
    const base = merge(["Ana", "Ben"]);
    const tasks = [
      ...base.tasks,
      { ...base.tasks[0]!, id: "T3", owner: "all" },
      { ...base.tasks[0]!, id: "T4", owner: "Ana and Ben" },
      { ...base.tasks[0]!, id: "T5", area: "" },
    ];
    assert.deepStrictEqual(badTasks(plan({ merge: { ...base, tasks } }), ["Ana", "Ben"]), [
      "T3 (all · app/)",
      "T4 (Ana and Ben · app/)",
      "T5 (Ana · no area)",
    ]);
  });

  it("names security items left unanswered, and is undefined without a security engineer", () => {
    const security = draftFor("security", {
      checklist: [
        { id: "S1", relevant: true, answer: "School login." },
        { id: "S2", relevant: false, answer: "" },
      ],
    });
    assert.deepStrictEqual(
      unansweredSecurity(plan({ drafts: [{ expert: "security", draft: security }] }), [
        "S1",
        "S2",
        "S3",
      ]),
      ["S2", "S3"],
    );
    assert.isUndefined(unansweredSecurity(plan({ drafts: [] }), ["S1"]));
  });
});
