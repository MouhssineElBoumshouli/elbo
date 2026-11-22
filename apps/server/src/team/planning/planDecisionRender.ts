import { EXPERTS } from "./planExperts.ts";
import type { DecisionRecord } from "./planSchemas.ts";

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
const row = (cells: ReadonlyArray<string>) => `| ${cells.map(cell).join(" | ")} |`;
export const table = (head: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<string>>) =>
  [row(head), row(head.map(() => "---")), ...rows.map(row)].join("\n");

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

export const decisionFileName = (record: DecisionRecord) =>
  `${record.number}-${slug(record.decision.title) || "decision"}.md`;

/** One line: what was picked and what else was looked at. Small plans and smaller choices use it. */
export function decisionLine(record: DecisionRecord): string {
  const { decision } = record;
  const others = decision.options.filter((option) => option.name !== decision.picked);
  return `**${decision.title}:** ${decision.picked}${others.length > 0 ? ` (also looked at: ${others.map((o) => o.name).join(", ")})` : ""}. ${decision.why}`;
}

export function decisionCard(record: DecisionRecord): string {
  const { decision } = record;
  const options = table(
    ["Option", "Good", "Bad", "Fit for this team"],
    decision.options.map((option) => [
      option.name === decision.picked ? `**${option.name}** (picked)` : option.name,
      option.good,
      option.bad,
      option.fit,
    ]),
  );
  return [
    `**Decision ${record.number}: ${decision.title}**`,
    options,
    `Why: ${decision.why} Proposed by the ${EXPERTS[record.owner].name}.`,
    ...(decision.disagreement.trim() ? [`> Disagreement: ${decision.disagreement}`] : []),
    ...(record.history.length > 0
      ? ["How we got here:", ...record.history.map((line) => `- ${line}`)]
      : []),
  ].join("\n\n");
}

const yamlList = (items: ReadonlyArray<string>) =>
  `[${items.map((item) => JSON.stringify(item)).join(", ")}]`;

/** A decision file in the rulebook's format, with the planning fields from section 7. */
export function renderDecision(record: DecisionRecord, date: string): string {
  const { decision } = record;
  return `---
title: ${JSON.stringify(decision.title)}
author: ${JSON.stringify(EXPERTS[record.owner].name)}
date: ${date}
files: []
commit: ""
options: ${yamlList(decision.options.map((option) => option.name))}
decided_by: ${JSON.stringify(record.decidedBy)}
status: ${record.status}
---

${decisionCard(record)}
`;
}
