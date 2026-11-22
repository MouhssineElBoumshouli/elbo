import { decisionCard, decisionLine, table } from "./planDecisionRender.ts";
import { EXPERTS, SECTION_TITLES, type SectionId } from "./planExperts.ts";
import type { PlanResult } from "./planSchemas.ts";

export { decisionFileName, renderDecision } from "./planDecisionRender.ts";

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

const names = (ids: ReadonlyArray<keyof typeof EXPERTS>) => {
  const all = ids.map((id) => `the ${EXPERTS[id].name}`);
  return all.length <= 1 ? (all[0] ?? "") : `${all.slice(0, -1).join(", ")} and ${all.at(-1)}`;
};

function sectionBody(plan: PlanResult, section: SectionId): string {
  const small = plan.size === "small";
  const written = plan.merge.sections.find((entry) => entry.section === section);
  const out: string[] = written?.summary.trim() ? [`**In short:** ${written.summary.trim()}`] : [];
  if (!small && written?.details.trim()) {
    out.push(`> Go deeper: ${written.details.trim().replace(/\n+/g, "\n> ")}`);
  }
  if (!small) {
    const diagram = plan.drafts
      .flatMap((d) => d.draft.parts)
      .find((part) => part.section === section && part.diagram.trim())?.diagram;
    if (diagram) out.push("```\n" + diagram.trim() + "\n```");
  }
  if (section === "scope" && plan.merge.doneChecks.length > 0) {
    out.push(
      `**Done means:**\n${plan.merge.doneChecks.map((c) => `- ${c.mustHave}: ${c.done}`).join("\n")}`,
    );
  }
  const decisions = plan.decisions.filter((r) => r.main && r.decision.section === section);
  out.push(...decisions.map((r) => (small ? decisionLine(r) : decisionCard(r))));
  return out.join("\n\n");
}

function workBody(plan: PlanResult): string {
  const { merge } = plan;
  const out: string[] = [];
  const summary = merge.sections.find((s) => s.section === "work")?.summary.trim();
  if (summary) out.push(`**In short:** ${summary}`);
  if (plan.size === "small") {
    out.push(
      merge.tasks.map((task) => `- [ ] ${task.title} (${task.owner} · ${task.area})`).join("\n"),
    );
  } else {
    if (merge.areas.length > 0) {
      out.push(
        table(
          ["Area", "Folders", "Owner"],
          merge.areas.map((a) => [a.name, a.folders.map((f) => `\`${f}\``).join(", "), a.owner]),
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
  }
  if (merge.milestones.length > 0) {
    out.push(
      table(
        ["When", "Working by then", "Cut first if it slips"],
        merge.milestones.map((m) => [m.when, m.what, m.cutFirst]),
      ),
    );
  }
  return out.join("\n\n");
}

function risksBody(plan: PlanResult): string {
  const risks = plan.size === "small" ? plan.merge.risks.slice(0, 3) : plan.merge.risks;
  const summary = plan.merge.sections.find((s) => s.section === "risks")?.summary.trim();
  return [
    ...(summary ? [`**In short:** ${summary}`] : []),
    table(
      ["Risk", "Chance", "Impact", "What we do", "Who watches"],
      risks.map((r) => [r.risk, r.chance, r.impact, r.action, r.watcher]),
    ),
  ].join("\n\n");
}

/** The plan as one Markdown page, in the shape of team/PLANNING_EXAMPLE_ATTENDANCE.md. */
export function renderPlan(plan: PlanResult): string {
  const small = plan.size === "small";
  const { merge } = plan;
  const present = new Set(plan.drafts.flatMap((d) => d.draft.parts.map((part) => part.section)));
  const order = (small ? SMALL_ORDER : FULL_ORDER).filter(
    (section) => section === "work" || section === "risks" || present.has(section),
  );
  const extraTitle = plan.panel.map((id) => EXPERTS[id].extraTitle).find(Boolean);
  const titled = order.map((section) => {
    if (section === "work") return { title: SECTION_TITLES.work, body: workBody(plan) };
    if (section === "risks") {
      return { title: small ? "Top risks" : SECTION_TITLES.risks, body: risksBody(plan) };
    }
    const title =
      section === "extra" ? (extraTitle ?? SECTION_TITLES.extra) : SECTION_TITLES[section];
    return { title, body: sectionBody(plan, section) };
  });
  const smaller = plan.decisions.filter((r) => !r.main);
  if (smaller.length > 0) {
    titled.push({
      title: "Smaller choices",
      body: smaller.map((r) => `- ${decisionLine(r)}`).join("\n"),
    });
  }
  if (!small && merge.glossary.length > 0) {
    titled.push({
      title: "Words used",
      body: merge.glossary.map((entry) => `- **${entry.term}:** ${entry.meaning}`).join("\n"),
    });
  }

  const blocks = [
    `# Plan: ${merge.title}`,
    `${plan.size[0]?.toUpperCase()}${plan.size.slice(1)} plan · ${merge.tasks.length} tasks · Experts: ${plan.panel.map((id) => EXPERTS[id].name).join(", ")}. Decisions are proposals until you agree.`,
  ];
  if (merge.pushBacks.length > 0) {
    blocks.push(
      `## Where we disagree with the brief\n\n${merge.pushBacks
        .map(
          (p) =>
            `- **${p.idea}** (raised by ${names(p.raisedBy)}): ${p.problem} Better: ${p.better}`,
        )
        .join("\n")}`,
    );
  }
  if (merge.choices.length > 0) {
    blocks.push(
      `## Choices for you\n\n${merge.choices.map((c) => `- ${c.question} (${c.options.join(" / ")})`).join("\n")}`,
    );
  }
  titled.forEach(({ title, body }, index) => blocks.push(`## ${index + 1}. ${title}\n\n${body}`));
  return `${blocks.join("\n\n")}\n`;
}
