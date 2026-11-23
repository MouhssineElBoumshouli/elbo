// team-layer: saving a plan into the project (team/PLANNING_FEATURE_PLAN.md section 7), as data.
// From the plan and what the project already has, works out every file, rulebook line and task a
// save writes. Nothing here touches the disk; planSaveService.ts does, after showing this preview.
import type { TeamMember, TeamMemberId, TeamTask, TeamTaskId } from "@t3tools/contracts";
import {
  normalizeTeamPath,
  TEAM_DECISIONS_DIRECTORY_NAME,
  TEAM_DIRECTORY_NAME,
  TEAM_RULEBOOK_FILE_NAME,
} from "@t3tools/contracts";

import { readFrontMatter } from "../../mcp/toolkits/team/memory.ts";
import { readCodeRulesSection, replaceCodeRules } from "../../mcp/toolkits/team/rulebook.ts";
import { TEAM_RULEBOOK_TEMPLATE } from "../TeamProjectFiles.ts";
import type { Decision, PlanResult } from "./planSchemas.ts";

export const PLAN_FILE = `${TEAM_DIRECTORY_NAME}/plan.md`;
const DECISIONS = `${TEAM_DIRECTORY_NAME}/${TEAM_DECISIONS_DIRECTORY_NAME}`;
const RULEBOOK = `${TEAM_DIRECTORY_NAME}/${TEAM_RULEBOOK_FILE_NAME}`;
/** Marks what a save wrote, so a later save finds it again and never doubles it. */
const TASK_NOTE_START = "From the plan";
const RULE_MARK = /\(plan decision (\d{4})\)$/u;

export interface ExistingDecision {
  readonly fileName: string;
  readonly raw: string;
}

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
  };
  readonly tasks: ReadonlyArray<TaskChange>;
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 48) || "decision";

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** The part of a decision file a later save compares: what was picked, from what, and why. */
function decisionBody(decision: Decision): string {
  const others = decision.options.filter((option) => option !== decision.picked);
  return [
    `Picked: ${decision.picked}.${others.length > 0 ? ` Also looked at: ${others.join(", ")}.` : ""}`,
    decision.why,
    ...(decision.rule ? [`Rule for agents: ${decision.rule}`] : []),
  ].join("\n\n");
}

const yamlList = (items: ReadonlyArray<string>) =>
  `[${items.map((item) => item.replaceAll(",", ";")).join(", ")}]`;

function decisionFile(
  decision: Decision,
  input: Pick<PlanSaveInput, "author" | "date" | "commit">,
): string {
  return `---
title: ${decision.title}
author: ${input.author}
date: ${input.date}
files: []
commit: ${input.commit}
options: ${yamlList(decision.options)}
decided_by: ${input.author}, from the plan
status: active
from: plan
---

${decisionBody(decision)}
`;
}

interface SavedDecision {
  readonly fileName: string;
  readonly number: number;
  readonly title: string;
  readonly status: string;
  readonly body: string;
  readonly raw: string;
}

function savedDecisions(decisions: ReadonlyArray<ExistingDecision>): ReadonlyArray<SavedDecision> {
  return decisions.flatMap((file) => {
    const number = Number(/^(\d+)/u.exec(file.fileName)?.[1] ?? Number.NaN);
    const { fields, body } = readFrontMatter(file.raw);
    if (fields.get("from") !== "plan" || !Number.isFinite(number)) return [];
    return [
      {
        fileName: file.fileName,
        number,
        title: fields.get("title") ?? "",
        status: fields.get("status") ?? "active",
        body: body.trim(),
        raw: file.raw,
      },
    ];
  });
}

const numberLabel = (number: number) => String(number).padStart(4, "0");

const replaced = (raw: string, by: string) =>
  raw.replace(/^status:.*$/mu, `status: replaced by ${by}`);

/** Decision files: new ones get the next free numbers; a changed one replaces the old file. */
function planDecisions(input: PlanSaveInput) {
  const saved = savedDecisions(input.decisions);
  let next =
    Math.max(0, ...input.decisions.map((file) => Number(/^(\d+)/u.exec(file.fileName)?.[1] ?? 0))) +
    1;
  const files: FileChange[] = [];
  const active: Array<{ readonly number: string; readonly decision: Decision }> = [];
  for (const { decision } of input.plan.decisions) {
    const current = saved.find(
      (entry) => entry.status === "active" && sameText(entry.title, decision.title),
    );
    if (current !== undefined && current.body === decisionBody(decision).trim()) {
      active.push({ number: numberLabel(current.number), decision });
      files.push({
        path: `${DECISIONS}/${current.fileName}`,
        status: "unchanged",
        content: current.raw,
        detail: "same decision",
      });
      continue;
    }
    const number = numberLabel(next++);
    active.push({ number, decision });
    files.push({
      path: `${DECISIONS}/${number}-${slug(decision.title)}.md`,
      status: "new",
      content: decisionFile(decision, input),
      detail: current === undefined ? "new decision" : `replaces ${numberLabel(current.number)}`,
    });
    if (current !== undefined) {
      files.push({
        path: `${DECISIONS}/${current.fileName}`,
        status: "changed",
        content: replaced(current.raw, number),
        detail: `replaced by ${number}`,
      });
    }
  }
  return { files, active };
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
    // "deployment/, app/, docs/notes" names three folders; "Pitch" names none.
    const parts = task.area
      .split(/\s*,\s*/u)
      .map((part) => part.trim())
      .filter(Boolean);
    const paths = parts.filter(looksLikePath).map(normalizeTeamPath);
    const labels = parts.filter((part) => !looksLikePath(part));
    const note = [
      TASK_NOTE_START,
      task.when,
      `${task.hours} h`,
      ...(member === undefined && task.owner.trim() ? [`for ${task.owner.trim()}`] : []),
      ...(labels.length > 0 ? [labels.join(", ")] : []),
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
  const decisions = planDecisions(input);
  const links = decisions.active
    .map(
      ({ number, decision }) =>
        `- [${number} ${decision.title}](decisions/${decisionFileName(decisions.files, number)})`,
    )
    .join("\n");
  const planText = `${input.planText.trim()}\n\n## Decision files\n\n${links}\n`;

  const rulebookBefore = input.rulebook ?? TEAM_RULEBOOK_TEMPLATE;
  const rules = decisions.active.flatMap(({ number, decision }) =>
    decision.rule.trim() ? [`${decision.rule.trim()} (plan decision ${number})`] : [],
  );
  const rulebookAfter = replaceCodeRules(rulebookBefore, (item) => RULE_MARK.test(item), rules);
  const ownedBefore = readCodeRulesSection(rulebookBefore).filter((item) => RULE_MARK.test(item));
  const ownedAfter = readCodeRulesSection(rulebookAfter).filter((item) => RULE_MARK.test(item));

  return {
    files: [
      changeOf(PLAN_FILE, input.existingPlanText, planText, "the plan"),
      ...decisions.files,
      changeOf(RULEBOOK, input.rulebook, rulebookAfter, "Code rules from the plan"),
    ],
    rules: {
      added: ownedAfter.filter((item) => !ownedBefore.includes(item)),
      removed: ownedBefore.filter((item) => !ownedAfter.includes(item)),
    },
    tasks: planTasks(input),
  };
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
  return [
    "Files:",
    ...files,
    "",
    "Rulebook Code rules:",
    ...(rules.length > 0 ? rules : ["- no change"]),
    "",
    "Tasks:",
    ...tasks,
  ].join("\n");
}
