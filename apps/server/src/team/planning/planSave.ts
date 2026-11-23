// team-layer: saving a plan into the project (team/PLANNING_FEATURE_PLAN.md section 7), as data.
// From the plan and what the project already has, works out every file, rulebook line and task a
// save writes. Nothing here touches the disk; planSaveService.ts does, after showing this preview.
import type { TeamMember, TeamMemberId, TeamTask, TeamTaskId } from "@t3tools/contracts";
import {
  normalizeTeamPath,
  TEAM_DIRECTORY_NAME,
  TEAM_RULEBOOK_FILE_NAME,
  teamPathProblem,
} from "@t3tools/contracts";

import { readCodeRulesSection, replaceCodeRules } from "../../mcp/toolkits/team/rulebook.ts";
import { TEAM_RULEBOOK_TEMPLATE } from "../TeamProjectFiles.ts";
import {
  AGENTS_FILE,
  CLAUDE_FILE,
  mergeAgentsFile,
  mergeClaudeFile,
  ownInstructionLines,
  ruleConflict,
} from "./planAgentFiles.ts";
import {
  DECISIONS,
  type ExistingDecision,
  planDecisionFiles,
  sameText,
} from "./planSaveDecisions.ts";
import type { PlanResult } from "./planSchemas.ts";

export const PLAN_FILE = `${TEAM_DIRECTORY_NAME}/plan.md`;
const RULEBOOK = `${TEAM_DIRECTORY_NAME}/${TEAM_RULEBOOK_FILE_NAME}`;
/** Marks what a save wrote, so a later save finds it again and never doubles it. */
const TASK_NOTE_START = "From the plan";
const RULE_MARK = /\(plan decision (\d{4})\)$/u;

export interface PlanSaveInput {
  readonly plan: PlanResult;
  /** The plan as the team reads it (planRender.ts). */
  readonly planText: string;
  readonly existingPlanText: string | null;
  readonly rulebook: string | null;
  readonly decisions: ReadonlyArray<ExistingDecision>;
  readonly tasks: ReadonlyArray<TeamTask>;
  readonly members: ReadonlyArray<TeamMember>;
  /** Who saves the plan; the decisions say they decided them. */
  readonly author: string;
  readonly date: string;
  readonly commit: string;
  /** AGENTS.md and CLAUDE.md as they are, when the save tells AI tools about the plan; else null. */
  readonly agentFiles: { readonly agents: string | null; readonly claude: string | null } | null;
}

export interface FileChange {
  readonly path: string;
  readonly status: "new" | "changed" | "unchanged";
  readonly content: string;
  /** What changed, in a few words ("replaced by 0007"). */
  readonly detail: string;
}

export interface TaskChange {
  readonly action: "create" | "update" | "keep";
  readonly title: string;
  readonly ownerMemberId: TeamMemberId | null;
  /** The owner's name from the plan, kept in the note when no team member has it. */
  readonly owner: string;
  readonly paths: ReadonlyArray<string>;
  readonly note: string;
  readonly taskId: TeamTaskId | null;
}

export interface PlanSavePreview {
  readonly files: ReadonlyArray<FileChange>;
  readonly rules: {
    readonly added: ReadonlyArray<string>;
    readonly removed: ReadonlyArray<string>;
    /** Rules not written: each says the opposite of a line the person wrote in AGENTS.md or CLAUDE.md. */
    readonly held: ReadonlyArray<{
      readonly number: string;
      readonly rule: string;
      readonly line: string;
    }>;
  };
  readonly tasks: ReadonlyArray<TaskChange>;
  /** Decisions from an earlier plan that this one doesn't have; they stay active. */
  readonly kept: ReadonlyArray<{ readonly number: string; readonly title: string }>;
}

function changeOf(path: string, before: string | null, after: string, detail: string): FileChange {
  return {
    path,
    status: before === null ? "new" : before === after ? "unchanged" : "changed",
    content: after,
    detail,
  };
}

const looksLikePath = (area: string) => /[/.]/u.test(area) && !/\s/u.test(area.trim());

function ownerOf(name: string, members: ReadonlyArray<TeamMember>): TeamMember | undefined {
  const first = (text: string) => text.trim().split(/\s+/u)[0] ?? "";
  return (
    members.find((member) => sameText(member.displayName, name)) ??
    members.find((member) => sameText(first(member.displayName), first(name)))
  );
}

/** One team task per plan task, in plan order; a task saved before is kept or updated, never doubled. */
function planTasks(input: PlanSaveInput): ReadonlyArray<TaskChange> {
  return input.plan.plan.tasks.map((task) => {
    const member = ownerOf(task.owner, input.members);
    // Only code folders become paths: a claim's overlap warning must never fire on "planning/".
    // "./" names the whole repo, which a team task refuses.
    const paths = [
      ...new Set(
        task.folders
          .map((folder) => folder.trim())
          .filter(looksLikePath)
          .map(normalizeTeamPath)
          .filter((folder) => folder !== "" && folder !== "."),
      ),
    ];
    const note = [
      TASK_NOTE_START,
      task.when,
      `${task.hours} h`,
      ...(member === undefined && task.owner.trim() ? [`for ${task.owner.trim()}`] : []),
      ...(task.area.trim() ? [task.area.trim()] : []),
    ].join(" · ");
    const existing = input.tasks.find(
      (saved) =>
        saved.note?.startsWith(TASK_NOTE_START) === true && sameText(saved.title, task.title),
    );
    const ownerMemberId = member?.memberId ?? null;
    const action =
      existing === undefined
        ? "create"
        : existing.note === note && existing.ownerMemberId === ownerMemberId
          ? "keep"
          : "update";
    return {
      action,
      title: task.title.trim(),
      ownerMemberId,
      owner: task.owner.trim(),
      paths,
      note,
      taskId: existing?.taskId ?? null,
    };
  });
}

/** Everything a save would write, without writing it. Saving the same plan again changes nothing. */
export function previewPlanSave(input: PlanSaveInput): PlanSavePreview {
  const decisions = planDecisionFiles({
    decisions: input.plan.decisions,
    existing: input.decisions,
    author: input.author,
    date: input.date,
    commit: input.commit,
  });
  const links = decisions.active
    .map(
      ({ number, decision }) =>
        `- [${number} ${decision.title}](decisions/${decisionFileName(decisions.files, number)})`,
    )
    .join("\n");
  const planText = `${input.planText.trim()}\n\n## Decision files\n\n${links}\n`;

  const rulebookBefore = input.rulebook ?? TEAM_RULEBOOK_TEMPLATE;
  const ownedBefore = readCodeRulesSection(rulebookBefore).filter((item) => RULE_MARK.test(item));
  const keptNumbers = new Set(decisions.kept.map((entry) => entry.number));
  const ownLines = ownInstructionLines([
    input.agentFiles?.agents ?? null,
    input.agentFiles?.claude ?? null,
  ]);
  const held: Array<{ readonly number: string; readonly rule: string; readonly line: string }> = [];
  const rules = [
    ...ownedBefore.filter((item) => keptNumbers.has(RULE_MARK.exec(item)?.[1] ?? "")),
    ...decisions.active.flatMap(({ number, decision }) => {
      const rule = decision.rule.trim();
      if (!rule) return [];
      const line = ruleConflict(rule, ownLines);
      if (line !== null) {
        held.push({ number, rule, line });
        return [];
      }
      return [`${rule} (plan decision ${number})`];
    }),
  ];
  const added = rules.filter((item) => !ownedBefore.includes(item));
  const removed = ownedBefore.filter((item) => !rules.includes(item));
  const rulesChange = added.length + removed.length > 0;

  return {
    files: [
      changeOf(PLAN_FILE, input.existingPlanText, planText, "the plan"),
      ...decisions.files,
      // Listed only when its code rules change, so "Files" and "Code rules" always agree.
      ...(rulesChange
        ? [
            changeOf(
              RULEBOOK,
              input.rulebook,
              replaceCodeRules(rulebookBefore, (item) => RULE_MARK.test(item), rules),
              "Code rules from the plan",
            ),
          ]
        : []),
      ...agentFileChanges(input.agentFiles, rules),
    ],
    rules: { added, removed, held },
    tasks: planTasks(input),
    kept: decisions.kept,
  };
}

function agentFileChanges(
  files: PlanSaveInput["agentFiles"],
  rules: ReadonlyArray<string>,
): ReadonlyArray<FileChange> {
  if (files === null) return [];
  const claude = mergeClaudeFile(files.claude);
  return [
    changeOf(
      AGENTS_FILE,
      files.agents,
      mergeAgentsFile(files.agents, rules),
      "plan and code rules for AI tools",
    ),
    ...(claude === null
      ? []
      : [changeOf(CLAUDE_FILE, files.claude, claude, "Claude Code reads AGENTS.md")]),
  ];
}

/** What would make the save stop halfway, checked before anything is written. */
export function planSaveProblems(preview: PlanSavePreview): ReadonlyArray<string> {
  const files = preview.files.flatMap((file) =>
    teamPathProblem(file.path) === null ? [] : [`${file.path}: ${teamPathProblem(file.path)}`],
  );
  const tasks = preview.tasks.flatMap((task) => [
    ...(task.title.trim() === "" ? ["A task has no title."] : []),
    ...task.paths.flatMap((path) => {
      const problem = teamPathProblem(path);
      return problem === null ? [] : [`Task "${task.title}": ${problem}`];
    }),
  ]);
  return [...files, ...tasks];
}

function decisionFileName(files: ReadonlyArray<FileChange>, number: string): string {
  const file = files.find(
    (entry) => entry.status !== "changed" && entry.path.startsWith(`${DECISIONS}/${number}-`),
  );
  return file?.path.slice(DECISIONS.length + 1) ?? `${number}.md`;
}

/** The preview as plain lines, for the runner's --dry-run and the agent's tool. */
export function describePlanSave(preview: PlanSavePreview): string {
  const files = preview.files.map(
    (file) =>
      `- ${file.status === "unchanged" ? "same" : file.status}: ${file.path} (${file.detail})`,
  );
  const rules = [
    ...preview.rules.added.map((line) => `- add: ${line}`),
    ...preview.rules.removed.map((line) => `- remove: ${line}`),
  ];
  const tasks = preview.tasks.map(
    (task) =>
      `- ${task.action}: ${task.title}${task.ownerMemberId === null ? "" : " (owner set)"}${task.paths.length > 0 ? ` [${task.paths.join(", ")}]` : ""} · ${task.note}`,
  );
  const kept = preview.kept.map((entry) => `- ${entry.number} ${entry.title}`);
  const held = preview.rules.held.map(
    (entry) =>
      `- not written: ${entry.rule} (says the opposite of "${entry.line}"; push back on decision ${entry.number})`,
  );
  return [
    "Files:",
    ...files,
    ...(kept.length > 0 ? ["", "Earlier decisions that stay active:", ...kept] : []),
    "",
    "Rulebook Code rules:",
    ...(rules.length > 0 ? rules : ["- no change"]),
    ...held,
    "",
    "Tasks:",
    ...tasks,
  ].join("\n");
}
