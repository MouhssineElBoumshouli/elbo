import type { PlanResult } from "../../apps/server/src/team/planning/planSchemas.ts";

/** Lines that talk about the planning session instead of the project; checked on both sides. */
export { methodTalk } from "../../apps/server/src/team/planning/planWords.ts";
import type { PlantedMistake } from "./cases.ts";

/** About one printed page; the small plan's limit (planBudget.ts). */
export const ONE_PAGE_WORDS = 500;

export const wordCount = (text: string) => text.split(/\s+/).filter(Boolean).length;

/** Works on any plan's text, so the method and the plain chat are checked the same way. */
export function pushedBack(markdown: string, mistake: PlantedMistake): boolean {
  return markdown
    .split(/\n/)
    .some((line) => mistake.topic.test(line) && mistake.pushBack.test(line));
}

/** Tasks whose owner is not exactly one person from the brief, or that have no area. */
export function badTasks(plan: PlanResult, people: ReadonlyArray<string>): ReadonlyArray<string> {
  return plan.merge.tasks
    .filter((task) => !people.includes(task.owner.trim()) || task.area.trim().length === 0)
    .map((task) => `${task.id} (${task.owner || "no owner"} · ${task.area || "no area"})`);
}

/**
 * Security checklist items the security engineer left unanswered: missing, or with no answer or
 * reason. Undefined when the security engineer was not on the panel.
 */
export function unansweredSecurity(
  plan: PlanResult,
  ids: ReadonlyArray<string>,
): ReadonlyArray<string> | undefined {
  const security = plan.drafts.find((drafted) => drafted.expert === "security");
  if (security === undefined) return undefined;
  return ids.filter((id) => {
    const item = security.draft.checklist.find((answer) => answer.id === id);
    return item === undefined || item.answer.trim().length === 0;
  });
}
