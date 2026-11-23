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
import {
  type PlanSaveInput,
  type PlanSavePreview,
  planSaveProblems,
  previewPlanSave,
} from "./planSave.ts";
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
      {
        title: "Build the list page",
        owner: "Sara",
        hours: 4,
        area: "List page",
        folders: ["app/web/"],
        when: "Week 1",
      },
      {
        title: "Write the pitch",
        owner: "Yassine",
        hours: 2,
        area: "Pitch",
        folders: [],
        when: "Week 2",
      },
      {
        title: "Deploy",
        owner: "Sara",
        hours: 3,
        area: "Hosting",
        folders: ["deployment/", "app/", "./"],
        when: "Week 3",
      },
      {
        title: "Test on the school Wi-Fi",
        owner: "Sara",
        hours: 1,
        area: "planning/acceptance",
        folders: ["school Wi-Fi"],
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

function inputFor(
  project: Project,
  plan: PlanResult,
  agentFiles: PlanSaveInput["agentFiles"] = null,
): PlanSaveInput {
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
    agentFiles,
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
        [
          "create",
          "Build the list page",
          "sara",
          ["app/web"],
          "From the plan · Week 1 · 4 h · List page",
        ],
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
        // Not code work: no paths, so it can never raise an overlap warning.
        [
          "create",
          "Test on the school Wi-Fi",
          "sara",
          [],
          "From the plan · Week 3 · 1 h · planning/acceptance",
        ],
      ],
    );
  });

  it("leaves the rulebook out when the plan has no code rules", () => {
    const preview = previewPlanSave(inputFor(empty, planWith([storage])));
    assert.deepStrictEqual(
      preview.files.map((file) => file.path),
      [".team/plan.md", ".team/decisions/0002-storage.md"],
    );
    assert.deepStrictEqual(preview.rules, { added: [], removed: [], held: [] });
  });

  it("keeps earlier decisions and their rules active when the next part is planned", () => {
    const saved = apply(empty, previewPlanSave(inputFor(empty, planWith([stack, storage]))));
    const next = previewPlanSave(inputFor(saved, planWith([decision("Front end")])));
    assert.deepStrictEqual(
      next.files.map((file) => [file.path, file.status]),
      [
        [".team/plan.md", "changed"],
        [".team/decisions/0004-front-end.md", "new"],
      ],
    );
    assert.deepStrictEqual(next.kept, [
      { number: "0002", title: "Server" },
      { number: "0003", title: "Storage" },
    ]);
    assert.deepStrictEqual(next.rules, { added: [], removed: [], held: [] });
  });

  it("writes how we got here, in place when only the history grew", () => {
    const plan = planWith([stack, storage]);
    const saved = apply(empty, previewPlanSave(inputFor(empty, plan)));
    const defended = {
      ...plan.decisions[0]!,
      status: "answered" as const,
      history: [
        { kind: "pushed-back" as const, by: "Sara", text: "Why not Flask?", updated: [] },
        {
          kind: "defended" as const,
          by: "Codex",
          text: "Django's admin saves a week.",
          updated: [],
        },
      ],
    };
    const again = previewPlanSave(
      inputFor(saved, { ...plan, decisions: [defended, plan.decisions[1]!] }),
    );
    const server = again.files.find((file) => file.path === ".team/decisions/0002-server.md")!;
    assert.strictEqual(server.detail, "adds how we got here");
    assert.include(server.content, "## How we got here");
    assert.include(server.content, "- **Codex defended:** Django's admin saves a week.");
    assert.include(server.content, "date: 2026-11-23\nfiles: []\ncommit: def");

    const against = {
      ...plan.decisions[0]!,
      decision: { ...stack, picked: "Flask", rule: "" },
      status: "against-advice" as const,
      advice: "Django",
      risk: "Flask needs its own login code.",
    };
    const picked = previewPlanSave(
      inputFor(saved, { ...plan, decisions: [against, plan.decisions[1]!] }),
    );
    const flask = picked.files.find((file) => file.path === ".team/decisions/0004-server.md")!;
    assert.include(flask.content, "decided_by: Sara El Amrani, against the advice");
    assert.include(flask.content, "Chosen against advice: the plan advised Django.");
    assert.include(picked.files[0]!.content, "Chosen against advice (the plan advised Django)");
  });

  it("changes nothing when the same plan is saved again", () => {
    const plan = planWith([stack, storage]);
    const saved = apply(empty, previewPlanSave(inputFor(empty, plan)));
    const again = previewPlanSave(inputFor(saved, plan));
    assert.deepStrictEqual(
      again.files.map((file) => file.status),
      ["unchanged", "unchanged", "unchanged"],
    );
    assert.deepStrictEqual(again.rules, { added: [], removed: [], held: [] });
    assert.deepStrictEqual(
      again.tasks.map((task) => task.action),
      ["keep", "keep", "keep", "keep"],
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
      held: [],
    });
    assert.include(saved.files[".team/decisions/0001-use-tabs.md"]!, "We use tabs.");
  });

  it("tells AI tools, and holds a rule that says the opposite of the person's own line", () => {
    const api = { ...decision("API"), picked: "Flask", rule: "Use Flask for the API." };
    const own = "# Shop\n\n- Never use Flask.\n";
    const preview = previewPlanSave(
      inputFor(empty, planWith([stack, api]), { agents: own, claude: null }),
    );
    assert.deepStrictEqual(preview.rules.held, [
      { number: "0003", rule: "Use Flask for the API.", line: "Never use Flask." },
    ]);
    assert.deepStrictEqual(preview.rules.added, [
      "Use Django for the server. (plan decision 0002)",
    ]);
    const agents = preview.files.find((file) => file.path === "AGENTS.md")!;
    assert.strictEqual(agents.status, "changed");
    assert.isTrue(agents.content.startsWith(own));
    assert.include(agents.content, "- Use Django for the server. (plan decision 0002)");
    assert.notInclude(agents.content, "Use Flask for the API.");
    const claude = preview.files.find((file) => file.path === "CLAUDE.md")!;
    assert.deepStrictEqual([claude.status, claude.content], ["new", "@AGENTS.md\n"]);
  });

  it("finds what would stop a save halfway before anything is written", () => {
    const preview = previewPlanSave(inputFor(empty, planWith([stack])));
    assert.deepStrictEqual(planSaveProblems(preview), []);
    const odd = {
      ...preview,
      tasks: [{ ...preview.tasks[0]!, paths: ["./", "../secrets"] }],
    };
    assert.deepStrictEqual(planSaveProblems(odd), [
      'Task "Build the list page": "./" names the whole repo. Name the files or folders instead.',
      'Task "Build the list page": "../secrets" leaves the repo. Use repo-relative paths.',
    ]);
  });
});
