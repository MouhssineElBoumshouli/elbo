// team-layer: the decision files a plan save writes (team/PLANNING_FEATURE_PLAN.md section 7).
// "Plan the next part" keeps earlier decisions active; only a decision this plan changes is
// replaced. Replacing a whole plan (slice 7) will mark the dropped ones as replaced.
import {
  TEAM_DECISIONS_DIRECTORY_NAME,
  TEAM_DIRECTORY_NAME,
  type TeamPlanDecisionStep,
} from "@t3tools/contracts";

import { readFrontMatter } from "../../mcp/toolkits/team/memory.ts";
import type { Decision, DecisionRecord } from "./planSchemas.ts";

export const DECISIONS = `${TEAM_DIRECTORY_NAME}/${TEAM_DECISIONS_DIRECTORY_NAME}`;
const HISTORY_HEADING = "## How we got here";
const AGAINST_ADVICE = "Chosen against advice:";

export interface ExistingDecision {
  readonly fileName: string;
  readonly raw: string;
}

export interface DecisionFileChange {
  readonly path: string;
  readonly status: "new" | "changed" | "unchanged";
  readonly content: string;
  readonly detail: string;
}

export interface DecisionFileInput {
  readonly decisions: ReadonlyArray<DecisionRecord>;
  readonly existing: ReadonlyArray<ExistingDecision>;
  readonly author: string;
  readonly date: string;
  readonly commit: string;
}

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, "-")
    .replace(/^-|-$/gu, "")
    .slice(0, 48) || "decision";

export const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** What a later save compares: what was picked, from what, and why. The history may grow freely. */
function decisionCore(decision: Decision): string {
  const others = decision.options.filter((option) => option !== decision.picked);
  return [
    `Picked: ${decision.picked}.${others.length > 0 ? ` Also looked at: ${others.join(", ")}.` : ""}`,
    decision.why,
    ...(decision.rule ? [`Rule for agents: ${decision.rule}`] : []),
  ].join("\n\n");
}

const coreOf = (body: string) =>
  body.split(new RegExp(`\\n\\n(?=${AGAINST_ADVICE}|${HISTORY_HEADING})`, "u"))[0]!.trim();

const STEP_LABEL: Record<TeamPlanDecisionStep["kind"], string> = {
  "pushed-back": "pushed back",
  defended: "defended",
  changed: "changed it",
  picked: "picked",
};

export function historyLine(step: TeamPlanDecisionStep): string {
  const updated = step.updated.length > 0 ? ` Updated: ${step.updated.join(", ")}.` : "";
  return `- **${step.by} ${STEP_LABEL[step.kind]}:** ${step.text}${updated}`;
}

function decisionBody(record: DecisionRecord): string {
  return [
    decisionCore(record.decision),
    ...(record.status === "against-advice"
      ? [`${AGAINST_ADVICE} the plan advised ${record.advice}. Risk: ${record.risk}`]
      : []),
    ...(record.history.length > 0
      ? [`${HISTORY_HEADING}\n\n${record.history.map(historyLine).join("\n")}`]
      : []),
  ].join("\n\n");
}

const yamlList = (items: ReadonlyArray<string>) =>
  `[${items.map((item) => item.replaceAll(",", ";")).join(", ")}]`;

function decisionFile(record: DecisionRecord, input: DecisionFileInput): string {
  const decidedBy =
    record.status === "against-advice"
      ? `${input.author}, against the advice`
      : `${input.author}, from the plan`;
  return `---
title: ${record.decision.title}
author: ${input.author}
date: ${input.date}
files: []
commit: ${input.commit}
options: ${yamlList(record.decision.options)}
decided_by: ${decidedBy}
status: active
from: plan
---

${decisionBody(record)}
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

const withBody = (raw: string, body: string) => {
  const end = raw.indexOf("\n---", 3);
  return end < 0 ? raw : `${raw.slice(0, end + 4)}\n\n${body}\n`;
};

/**
 * New decisions get the next free numbers; a changed one replaces the old file; one whose only
 * change is its history is updated in place. Earlier plan decisions this plan doesn't have stay.
 */
export function planDecisionFiles(input: DecisionFileInput) {
  const saved = savedDecisions(input.existing);
  let next =
    Math.max(0, ...input.existing.map((file) => Number(/^(\d+)/u.exec(file.fileName)?.[1] ?? 0))) +
    1;
  const files: DecisionFileChange[] = [];
  const active: Array<{ readonly number: string; readonly decision: Decision }> = [];
  const matched = new Set<string>();
  for (const record of input.decisions) {
    const { decision } = record;
    const current = saved.find(
      (entry) => entry.status === "active" && sameText(entry.title, decision.title),
    );
    if (current !== undefined) matched.add(current.fileName);
    if (current !== undefined && coreOf(current.body) === decisionCore(decision).trim()) {
      active.push({ number: numberLabel(current.number), decision });
      const body = decisionBody(record).trim();
      files.push(
        current.body === body
          ? {
              path: `${DECISIONS}/${current.fileName}`,
              status: "unchanged",
              content: current.raw,
              detail: "same decision",
            }
          : {
              path: `${DECISIONS}/${current.fileName}`,
              status: "changed",
              content: withBody(current.raw, body),
              detail: "adds how we got here",
            },
      );
      continue;
    }
    const number = numberLabel(next++);
    active.push({ number, decision });
    files.push({
      path: `${DECISIONS}/${number}-${slug(decision.title)}.md`,
      status: "new",
      content: decisionFile(record, input),
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
  const kept = saved
    .filter((entry) => entry.status === "active" && !matched.has(entry.fileName))
    .map((entry) => ({ number: numberLabel(entry.number), title: entry.title }));
  return { files, active, kept };
}
