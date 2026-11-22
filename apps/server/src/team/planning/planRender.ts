import type { DecisionRecord, PlanResult, WrittenPlan } from "./planSchemas.ts";

const cell = (text: string) => text.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
const row = (cells: ReadonlyArray<string>) => `| ${cells.map(cell).join(" | ")} |`;
const table = (head: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<string>>) =>
  [row(head), row(head.map(() => "---")), ...rows.map(row)].join("\n");

/** A heading in the plan's own style, so the decisions list reads like the rest of the page. */
function heading(markdown: string, text: string): string {
  if (/^## /m.test(markdown)) return `## ${text}`;
  if (/^\*\*[^*\n]+\*\*\s*$/m.test(markdown)) return `**${text}**`;
  return text;
}

function decisionLine({ decision }: DecisionRecord): string {
  const others = decision.options.filter((option) => option !== decision.picked);
  return `**${decision.title}:** ${decision.picked}${others.length > 0 ? ` (also looked at: ${others.join(", ")})` : ""}. ${decision.why}`;
}

/** The plan the team reads: the writer's text, then the decisions as a short list. */
export function renderPlan(written: WrittenPlan, decisions: ReadonlyArray<DecisionRecord>): string {
  const text = written.plan.trim();
  const main = decisions.filter((record) => record.main);
  const smaller = decisions.filter((record) => !record.main);
  const blocks = [text];
  if (main.length > 0) {
    blocks.push(
      `${heading(text, "Decisions")}\n\n${main.map((record) => `- ${decisionLine(record)}`).join("\n")}`,
    );
  }
  if (smaller.length > 0) {
    blocks.push(
      `Smaller choices: ${smaller.map(({ decision }) => `${decision.title}: ${decision.picked}`).join("; ")}.`,
    );
  }
  return `${blocks.join("\n\n")}\n`;
}

/** decision-log.md: every decision, every review round, and what the writer did with each point. */
export function renderDecisionLog(result: PlanResult): string {
  const reviewer = result.sameProvider
    ? `${result.reviewer} (no other provider was signed in, so the writer's provider reviewed in a fresh session)`
    : result.reviewer;
  const decisions = result.decisions.map((record) =>
    [
      `### ${record.number} ${record.decision.title}`,
      `Picked: ${record.decision.picked}. Looked at: ${record.decision.options.join(", ")}.`,
      `Why: ${record.decision.why}`,
      ...record.history.map((line) => `- ${line}`),
    ].join("\n\n"),
  );
  const rounds = table(
    ["Round", "Score", "Words", "Blockers", "Shoulds", "Nits"],
    result.rounds.map((round) => [
      String(round.round),
      `${round.score}/10`,
      String(round.words),
      ...(["blocker", "should", "nit"] as const).map((severity) =>
        String(round.problems.filter((problem) => problem.severity === severity).length),
      ),
    ]),
  );
  const log = table(
    ["Round", "Id", "Severity", "From", "Point", "Outcome", "Reason"],
    result.log.map((entry) => [
      String(entry.round),
      entry.id,
      entry.severity,
      entry.from,
      entry.point,
      entry.outcome,
      entry.reason,
    ]),
  );
  const nits = result.rounds.flatMap((round) =>
    round.problems
      .filter((problem) => problem.severity === "nit")
      .map((problem) => `- Round ${round.round}, ${problem.id}: ${problem.problem}`),
  );
  return [
    `# Decision log: ${result.plan.title}`,
    `Written by ${result.writer}, reviewed by ${reviewer}. ${result.stopReason}`,
    "## Decisions",
    ...decisions,
    "## Reviews",
    rounds,
    "## What the writer did with each point",
    result.log.length > 0 ? log : "Nothing to fix.",
    ...(nits.length > 0 ? ["## Nits, left as they are", nits.join("\n")] : []),
  ].join("\n\n");
}
