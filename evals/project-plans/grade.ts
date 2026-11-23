import type { PlanTask } from "../../apps/server/src/team/planning/planSchemas.ts";
import type { PlantedMistake } from "./cases.ts";

/** Lines that talk about the planning session instead of the project; checked on both sides. */
export { methodTalk } from "../../apps/server/src/team/planning/planWords.ts";
export { wordCount } from "../../apps/server/src/team/planning/planLimits.ts";

/** About one printed page; the small plan's limit (planLimits.ts). */
export const ONE_PAGE_WORDS = 500;

/** Works on any plan's text, so the new flow and the plain chat are checked the same way. */
export function pushedBack(markdown: string, mistake: PlantedMistake): boolean {
  return markdown
    .split(/\n/)
    .some((line) => mistake.topic.test(line) && mistake.pushBack.test(line));
}

/** Tasks whose owner is not exactly one person from the brief, or that have no area. */
export function badTasks(
  tasks: ReadonlyArray<PlanTask>,
  people: ReadonlyArray<string>,
): ReadonlyArray<string> {
  return tasks
    .filter((task) => !people.includes(task.owner.trim()) || task.area.trim().length === 0)
    .map((task) => `${task.title} (${task.owner || "no owner"} · ${task.area || "no area"})`);
}

/** What the writer did with a push-back: kept the pick or changed it. */
export function pushBackVerdict(before: string, after: string): "defend" | "change" {
  return before.trim().toLowerCase() === after.trim().toLowerCase() ? "defend" : "change";
}

/**
 * Whether an answer argues from this team, not in general: it names someone on the team or a fact
 * from the brief (a deadline, the budget, an outside rule). A keyword check; read the answers too.
 */
export function fitsTeam(
  answer: string,
  facts: { readonly people: ReadonlyArray<string>; readonly details: ReadonlyArray<string> },
): boolean {
  const text = answer.toLowerCase();
  const words = facts.details.flatMap(
    (detail) => detail.toLowerCase().match(/[\p{L}\p{N}-]{4,}/gu) ?? [],
  );
  return [...facts.people.map((name) => name.toLowerCase()), ...words].some((term) =>
    text.includes(term),
  );
}
