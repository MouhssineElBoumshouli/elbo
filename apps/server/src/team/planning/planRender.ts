import { EXPERTS, type ExpertId, SECTION_TITLES, type SectionId } from "./planExperts.ts";
import type { DecisionRecord, PlanResult } from "./planSchemas.ts";

const FULL_ORDER: ReadonlyArray<SectionId> = [
  "what",
  "scope",
  "stack",
  "parts",
  "data",
  "security",
  "look",
  "ai",
  "extra",
  "work",
  "risks",
];
const SMALL_ORDER: ReadonlyArray<SectionId> = ["what", "scope", "stack", "risks", "work"];

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
const row = (cells: ReadonlyArray<string>) => `| ${cells.map(cell).join(" | ")} |`;
const table = (head: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<string>>) =>
  [row(head), row(head.map(() => "---")), ...rows.map(row)].join("\n");

const slug = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);

export const decisionFileName = (record: DecisionRecord) =>
  `${record.number}-${slug(record.decision.title) || "decision"}.md`;

function decisionBlock(record: DecisionRecord, small: boolean): string {
  const { decision } = record;
  if (small) {
    const others = decision.options.filter((option) => option.name !== decision.picked);
    return `**${decision.title}:** ${decision.picked}${others.length > 0 ? ` (also looked at: ${others.map((o) => o.name).join(", ")})` : ""}. ${decision.why}`;
  }
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

function sectionBody(plan: PlanResult, section: SectionId, expert: ExpertId | undefined): string {
  const small = plan.size === "small";
  const parts = plan.drafts
    .filter((drafted) => expert === undefined || drafted.expert === expert)
    .flatMap((drafted) => drafted.draft.parts.filter((part) => part.section === section));
  const merged =
    section === "extra" ? undefined : plan.merge.summaries.find((s) => s.section === section);
  const summary = merged?.summary ?? parts.map((part) => part.summary).join(" ");
  const out: string[] = [`**In short:** ${summary}`];
  if (!small) {
    for (const part of parts) {
      if (part.details.trim())
        out.push(`> Go deeper: ${part.details.trim().replace(/\n+/g, "\n> ")}`);
      if (part.diagram.trim()) out.push("```\n" + part.diagram.trim() + "\n```");
    }
  }
  const decisions = plan.decisions.filter(
    (record) =>
      record.decision.section === section && (expert === undefined || record.owner === expert),
  );
  out.push(...decisions.map((record) => decisionBlock(record, small)));
  return out.join("\n\n");
}

function workBody(plan: PlanResult): string {
  const { merge } = plan;
  const summary = merge.summaries.find((s) => s.section === "work")?.summary ?? "";
  const out: string[] = summary ? [`**In short:** ${summary}`] : [];
  if (plan.size === "small") {
    out.push(
      merge.tasks.map((task) => `- [ ] ${task.title} (${task.owner} · ${task.area})`).join("\n"),
    );
    return out.join("\n\n");
  }
  if (merge.areas.length > 0) {
    out.push(
      table(
        ["Area", "Folders", "Owner"],
        merge.areas.map((area) => [
          area.name,
          area.folders.map((f) => `\`${f}\``).join(", "),
          area.owner,
        ]),
      ),
    );
  }
  const weeks = [...new Set(merge.tasks.map((task) => task.week))].toSorted((a, b) => a - b);
  out.push(
    table(
      [plan.schedule === "blocks" ? "Block" : "Week", "Tasks"],
      weeks.map((week) => [
        String(week),
        merge.tasks
          .filter((task) => task.week === week)
          .map((task) => `${task.id} ${task.title} (${task.owner} · ${task.area})`)
          .join(" · "),
      ]),
    ),
  );
  if (merge.halfwayDemo.trim()) out.push(`Halfway demo: ${merge.halfwayDemo}`);
  return out.join("\n\n");
}

function risksBody(plan: PlanResult): string {
  const risks = plan.size === "small" ? plan.merge.risks.slice(0, 3) : plan.merge.risks;
  const summary = plan.merge.summaries.find((s) => s.section === "risks")?.summary ?? "";
  return [
    ...(summary ? [`**In short:** ${summary}`] : []),
    table(
      ["Risk", "Chance", "Impact", "What we do", "Who watches"],
      risks.map((risk) => [risk.risk, risk.chance, risk.impact, risk.action, risk.watcher]),
    ),
  ].join("\n\n");
}

/** The plan as one Markdown page, in the shape of team/PLANNING_EXAMPLE_ATTENDANCE.md. */
export function renderPlan(plan: PlanResult): string {
  const small = plan.size === "small";
  const present = new Set(plan.drafts.flatMap((d) => d.draft.parts.map((part) => part.section)));
  const order = (small ? SMALL_ORDER : FULL_ORDER).filter(
    (section) => section === "work" || section === "risks" || present.has(section),
  );
  const blocks: string[] = [];
  const titled: Array<{ title: string; body: string }> = [];
  for (const section of order) {
    if (section === "work") titled.push({ title: SECTION_TITLES.work, body: workBody(plan) });
    else if (section === "risks")
      titled.push({ title: small ? "Top risks" : SECTION_TITLES.risks, body: risksBody(plan) });
    else if (section === "extra") {
      for (const drafted of plan.drafts.filter((d) =>
        d.draft.parts.some((p) => p.section === "extra"),
      )) {
        titled.push({
          title: EXPERTS[drafted.expert].extraTitle ?? SECTION_TITLES.extra,
          body: sectionBody(plan, "extra", drafted.expert),
        });
      }
    } else
      titled.push({ title: SECTION_TITLES[section], body: sectionBody(plan, section, undefined) });
  }
  if (!small && plan.decisions.length > 0) {
    titled.push({
      title: "Decisions log",
      body: table(
        ["#", "Decision", "Options looked at", "Decided by"],
        plan.decisions.map((record) => [
          record.number,
          `${record.decision.title}: ${record.decision.picked}`,
          record.decision.options.map((option) => option.name).join(", "),
          record.decidedBy,
        ]),
      ),
    });
  }
  if (!small && plan.merge.glossary.length > 0) {
    titled.push({
      title: "Words used",
      body: plan.merge.glossary.map((entry) => `- **${entry.term}:** ${entry.meaning}`).join("\n"),
    });
  }

  blocks.push(`# Plan: ${plan.merge.title}`);
  blocks.push(
    `${plan.size[0]?.toUpperCase()}${plan.size.slice(1)} plan · ${plan.merge.tasks.length} tasks · Panel: ${plan.panel.map((id) => EXPERTS[id].name).join(", ")}. Decisions are proposals until you agree.`,
  );
  const challenges = plan.drafts.flatMap(({ expert, draft }) =>
    draft.challenges.map((challenge) => ({ expert, challenge })),
  );
  if (challenges.length > 0) {
    blocks.push(
      `## The panel pushes back on the brief\n\n${challenges
        .map(
          ({ expert, challenge }) =>
            `- **${challenge.idea}** (the ${EXPERTS[expert].name}): ${challenge.problem} Better: ${challenge.better}`,
        )
        .join("\n")}`,
    );
  }
  if (plan.choices.length > 0) {
    blocks.push(
      `## Choices for you\n\n${plan.choices
        .map(
          (choice) =>
            `- ${choice.question} (${choice.options.join(" / ")}), raised by the ${EXPERTS[choice.raisedBy].name}`,
        )
        .join("\n")}`,
    );
  }
  titled.forEach(({ title, body }, index) => blocks.push(`## ${index + 1}. ${title}\n\n${body}`));
  return `${blocks.join("\n\n")}\n`;
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

${decisionBlock(record, false)}
`;
}
