import { assert, describe, it } from "@effect/vitest";
import {
  TeamId,
  TeamMemberId,
  TeamTaskId,
  type TeamMember,
  type TeamTask,
} from "@t3tools/contracts";

import { decision, written } from "./planFixtures.testkit.ts";
import { renderPlan } from "./planRender.ts";
import { numberDecisions } from "./planReview.ts";
import { type PlanSaveInput, type PlanSavePreview, previewPlanSave } from "./planSave.ts";
import type { PlanResult } from "./planSchemas.ts";

const teamId = TeamId.make("team-1");
const sara: TeamMember = {
  memberId: TeamMemberId.make("sara"),
  teamId,
  displayName: "Sara El Amrani",
  role: "member",
  lastSeenAt: "2026-11-23T08:00:00.000Z",
};

const planWith = (decisions: PlanResult["plan"]["decisions"]): PlanResult => {
  const plan = written("## Steps\n\nWeek 1: list page.", {
    decisions,
    tasks: [
      { title: "Build the list page", owner: "Sara", hours: 4, area: "app/web/", when: "Week 1" },
      { title: "Write the pitch", owner: "Yassine", hours: 2, area: "Pitch", when: "Week 2" },
      {
        title: "Deploy",
        owner: "Sara",
        hours: 3,
        area: "deployment/, app/, Hosting",
        when: "Week 3",
      },
    ],
  });
  return {
    size: "medium",
    writer: "codex gpt-6-astra",
    reviewer: "claude claude-opus-5-5",
    sameProvider: false,
    plan,
    decisions: numberDecisions(plan.decisions, "medium"),
    rounds: [],
    log: [],
    stopReason: "Stopped after round 1: only nits left.",
    wordsBeforeShorten: 0,
  };
};

const stack = {
  ...decision("Server"),
  picked: "Django",
  options: ["Django", "Flask"],
  rule: "Use Django for the server.",
};
const storage = { ...decision("Storage"), picked: "SQLite", options: ["SQLite", "Postgres"] };

/** What the project holds after a save, so the next save reads it back. */
interface Project {
  readonly files: Record<string, string>;
  readonly tasks: ReadonlyArray<TeamTask>;
}

const humanDecision = `---
title: Use tabs
author: Sara
date: 2026-11-01
files: []
commit: abc
---

We use tabs.
`;

const empty: Project = { files: { ".team/decisions/0001-use-tabs.md": humanDecision }, tasks: [] };

function inputFor(project: Project, plan: PlanResult): PlanSaveInput {
  return {
    plan,
    planText: renderPlan(plan.plan, plan.decisions),
    existingPlanText: project.files[".team/plan.md"] ?? null,
    rulebook: project.files[".team/rulebook.md"] ?? null,
    decisions: Object.entries(project.files)
      .filter(([path]) => path.startsWith(".team/decisions/"))
      .map(([path, raw]) => ({ fileName: path.slice(".team/decisions/".length), raw })),
    tasks: project.tasks,
    members: [sara],
    author: "Sara El Amrani",
    date: "2026-11-23",
    commit: "def",
  };
}

function apply(project: Project, preview: PlanSavePreview): Project {
  const files = { ...project.files };
  for (const file of preview.files) files[file.path] = file.content;
  const tasks = [...project.tasks];
  preview.tasks.forEach((task, index) => {
    if (task.action !== "create") return;
    tasks.push({
      taskId: TeamTaskId.make(`task-${tasks.length + index}`),
      teamId,
      title: task.title,
      status: "todo",
      note: task.note,
      paths: task.paths,
      ownerMemberId: task.ownerMemberId,
      thread: null,
      createdAt: "2026-11-23T08:00:00.000Z",
      updatedAt: "2026-11-23T08:00:00.000Z",
    });
  });
  return { files, tasks };
}

describe("previewPlanSave", () => {
  it("lists every new file, rule and task on a first save, numbering after the team's decisions", () => {
    const preview = previewPlanSave(inputFor(empty, planWith([stack, storage])));
    assert.deepStrictEqual(
      preview.files.map((file) => [file.path, file.status]),
      [
        [".team/plan.md", "new"],
        [".team/decisions/0002-server.md", "new"],
        [".team/decisions/0003-storage.md", "new"],
        [".team/rulebook.md", "new"],
      ],
    );
    const server = preview.files[1]!.content;
    assert.include(server, "options: [Django, Flask]");
    assert.include(server, "decided_by: Sara El Amrani, from the plan");
    assert.include(server, "status: active");
    assert.include(preview.files[0]!.content, "[0002 Server](decisions/0002-server.md)");
    assert.deepStrictEqual(preview.rules.added, [
      "Use Django for the server. (plan decision 0002)",
    ]);
    assert.notInclude(preview.files[3]!.content, "The rules a new teammate would get wrong.");
    assert.deepStrictEqual(
      preview.tasks.map((task) => [
        task.action,
        task.title,
        task.ownerMemberId,
        task.paths,
        task.note,
      ]),
      [
        ["create", "Build the list page", "sara", ["app/web"], "From the plan · Week 1 · 4 h"],
        [
          "create",
          "Write the pitch",
          null,
          [],
          "From the plan · Week 2 · 2 h · for Yassine · Pitch",
        ],
        [
          "create",
          "Deploy",
          "sara",
          ["deployment", "app"],
          "From the plan · Week 3 · 3 h · Hosting",
        ],
      ],
    );
  });

  it("changes nothing when the same plan is saved again", () => {
    const plan = planWith([stack, storage]);
    const saved = apply(empty, previewPlanSave(inputFor(empty, plan)));
    const again = previewPlanSave(inputFor(saved, plan));
    assert.deepStrictEqual(
      again.files.map((file) => file.status),
      ["unchanged", "unchanged", "unchanged", "unchanged"],
    );
    assert.deepStrictEqual(again.rules, { added: [], removed: [] });
    assert.deepStrictEqual(
      again.tasks.map((task) => task.action),
      ["keep", "keep", "keep"],
    );
  });

  it("replaces a changed decision with a new file and moves its rule", () => {
    const saved = apply(empty, previewPlanSave(inputFor(empty, planWith([stack, storage]))));
    const flask = { ...stack, picked: "Flask", rule: "Use Flask for the server." };
    const changed = previewPlanSave(inputFor(saved, planWith([flask, storage])));
    assert.deepStrictEqual(
      changed.files.map((file) => [file.path, file.status, file.detail]),
      [
        [".team/plan.md", "changed", "the plan"],
        [".team/decisions/0004-server.md", "new", "replaces 0002"],
        [".team/decisions/0002-server.md", "changed", "replaced by 0004"],
        [".team/decisions/0003-storage.md", "unchanged", "same decision"],
        [".team/rulebook.md", "changed", "Code rules from the plan"],
      ],
    );
    assert.include(changed.files[2]!.content, "status: replaced by 0004");
    assert.deepStrictEqual(changed.rules, {
      added: ["Use Flask for the server. (plan decision 0004)"],
      removed: ["Use Django for the server. (plan decision 0002)"],
    });
    assert.include(saved.files[".team/decisions/0001-use-tabs.md"]!, "We use tabs.");
  });
});
