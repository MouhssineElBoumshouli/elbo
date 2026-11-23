import { assert, describe, it } from "@effect/vitest";

import { planCases } from "./cases.ts";
import { badTasks, fitsTeam, pushBackVerdict, pushedBack } from "./grade.ts";

const planted = planCases.find((c) => c.id === "planted-mistakes")?.planted ?? [];
const mistake = (id: string) => {
  const found = planted.find((m) => m.id === id);
  if (!found) throw new Error(id);
  return found;
};

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
    // Both sides of the round 2 run, missed by the first pattern.
    assert.isTrue(
      pushedBack(
        "- **Use microservices, Docker and Kubernetes.** (raised by the project manager): Several deployments exceed this team's skills and time. Better: Use one Django application with clear folders.",
        mistake("microservices"),
      ),
    );
    assert.isTrue(
      pushedBack(
        "- Build one Python/Django application with separate accounts, recipes and photos modules. Defer microservices, the API gateway, Docker and Kubernetes.",
        mistake("microservices"),
      ),
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
    const task = {
      title: "List page",
      owner: "Ana",
      hours: 4,
      area: "app/",
      folders: ["app/"],
      when: "Week 1",
    };
    const tasks = [
      task,
      { ...task, title: "Pitch", owner: "all" },
      { ...task, title: "Login", owner: "Ana and Ben" },
      { ...task, title: "Tests", area: "" },
    ];
    assert.deepStrictEqual(badTasks(tasks, ["Ana", "Ben"]), [
      "Pitch (all · app/)",
      "Login (Ana and Ben · app/)",
      "Tests (Ana · no area)",
    ]);
  });
});

describe("push-back grading", () => {
  it("reads a kept pick as defended and a new one as changed", () => {
    assert.strictEqual(pushBackVerdict("Django", "django "), "defend");
    assert.strictEqual(pushBackVerdict("Django", "Node.js with Express"), "change");
  });

  it("accepts an answer that argues from the team, not one that argues in general", () => {
    const facts = {
      people: ["Sara", "Adam"],
      details: ["free only", "Student data must stay in the EU"],
    };
    assert.isTrue(fitsTeam("Sara knows Python, so Django is faster for you.", facts));
    assert.isTrue(fitsTeam("Student data has to stay with the school.", facts));
    assert.isFalse(fitsTeam("Microservices are complex and rarely worth it.", facts));
  });
});
