import { briefText, type PlanBrief } from "./planBrief.ts";
import { PLAN_LIMITS, type PlanSize, SHORT_DEADLINE_DAYS } from "./planLimits.ts";
import type { ToFix } from "./planReview.ts";
import type { Decision, LogEntry, WrittenPlan } from "./planSchemas.ts";

const RULES = `- Write it like you'd explain it to a classmate: short sentences, everyday words. For example: "We keep everything in one small database file, because nobody on the team has run a database server before." Explain a technical word the first time you use it.
- Fit everything to this team: name people and their skills, the hours, the budget and the outside rules.
- Never accept a bad idea because the brief asks for it. If an idea is unsafe, too big for the time, cannot work on the budget, or breaks an outside rule, say so plainly and give a better option.
- Do not invent facts about the team. If something important is missing, say what you assumed.`;

const brief = (input: PlanBrief) => `## The brief\n${briefText(input)}`;

const people = (input: PlanBrief) => input.people.map((person) => person.name).join(", ");

const schedule = (input: PlanBrief) =>
  input.deadlineDays <= SHORT_DEADLINE_DAYS
    ? "The deadline is days or hours away: lay the steps out by day or by block of hours, keep the last block for rehearsal and fixes, and pick the simplest storage the team can run (for example SQLite or one file) unless the brief needs more."
    : "Lay the steps out by week, and keep the last week for testing and fixes.";

const shape = (input: PlanBrief, size: PlanSize) => {
  const limits = PLAN_LIMITS[size];
  return `## What to return
- title: the project's name in a few words.
- plan: the plan in Markdown, the way you'd answer "make me a project plan for this" in a chat: a short opening, then short sections with plain titles. It must have: the steps with who does what and when (${schedule(input)}); for each must-have, how the team knows it is done; what to cut first if time runs out; and your push-back on any bad idea in the brief. Under ${limits.words} words. No list or table of decisions: the app adds the decisions at the end.
- decisions: at most ${limits.decisions} real choices that matter to this team: what you picked, every option you looked at (the picked one included), and why in a sentence or two. rule: one short line the agents writing the code must follow because of this decision (for example "Use Django for the server." or "Never put secrets in the repo."), or "" when it is not a rule for the code.
- tasks: every task in the plan. owner is exactly one of: ${people(input)}. hours is your estimate, area the folder or part of the work it touches, when its slot in the schedule. The hours must fit the team's time with room to spare.
- doneChecks, pushBacks and cutFirst: the same as in the plan text, as data.`;
};

export function writerPrompt(input: PlanBrief, size: PlanSize): string {
  return `You help a person or a student team plan a project before they build it. Write the whole plan yourself.

${RULES}

${brief(input)}

${shape(input, size)}`;
}

const ledger = (log: ReadonlyArray<LogEntry>) =>
  log
    .map(
      (entry) =>
        `- ${entry.id} [${entry.severity}] ${entry.point} → ${entry.outcome}${entry.reason ? `: ${entry.reason}` : ""}`,
    )
    .join("\n");

const taskList = (written: WrittenPlan) =>
  written.tasks
    .map((task) => `- ${task.when}: ${task.title} (${task.owner}, ${task.hours} h, ${task.area})`)
    .join("\n");

export function reviewPrompt(input: {
  readonly brief: PlanBrief;
  readonly markdown: string;
  readonly written: WrittenPlan;
  readonly round: number;
  readonly log: ReadonlyArray<LogEntry>;
}): string {
  const earlier =
    input.round === 1
      ? ""
      : `
## Earlier rounds
This is review round ${input.round}. What you raised before, and what the writer did:
${ledger(input.log)}
Check only whether those are settled and whether a fix broke something. Reuse an id for a point that is still open; give a new id only to something a fix broke.
`;
  return `Review a project plan another AI wrote for a person or a student team. Review only: do not rewrite the plan.

Read the brief, then the plan and its task list. Find what would really hurt the team: an unsafe idea the plan accepts, a schedule or hours that cannot fit, a must-have with no path to done, a choice the team cannot build with their skills, budget or outside rules, a bad idea in the brief the plan does not push back on.
Hold the plan to its size. Do not ask for more features, sections or detail; a plan that grows is worse. Prefer a fix that cuts.

Severity:
- blocker: following the plan as written fails the brief or harms someone.
- should: a real problem the team will hit.
- nit: everything else, including wording and anything that only adds.

Return a score out of 10 for how well the team could follow this plan, and the problems, each with an id (R1, R2, ...), the severity, the problem, why it matters for this team, and a concrete fix. An empty list is a good answer.
${earlier}
${brief(input.brief)}

## The plan
${input.markdown}

## The task list (the app's data)
${taskList(input.written)}`;
}

export function fixPrompt(input: {
  readonly brief: PlanBrief;
  readonly size: PlanSize;
  readonly written: WrittenPlan;
  readonly problems: ReadonlyArray<ToFix>;
  readonly words: number;
}): string {
  const problems = input.problems
    .map(
      (problem) =>
        `- ${problem.id} [${problem.severity}] ${problem.problem} Why: ${problem.why} Suggested fix: ${problem.fix}`,
    )
    .join("\n");
  return `You wrote the project plan below. A reviewer and a few checks found problems. Fix them.

${RULES}
- Fix only the problems listed. You may decline one when it is wrong for this team or only adds scope; say why in one sentence.
- Do not make the plan longer: when a fix needs room, cut something less important. The plan is ${input.words} words now; after your fixes it must be under ${PLAN_LIMITS[input.size].words}.
- Keep the plan text and the data in step.

## The problems
${problems}

${brief(input.brief)}

## Your plan
${JSON.stringify(input.written)}

${shape(input.brief, input.size)}
- answers: one per problem id: outcome "fixed" or "declined", and the reason in one sentence.`;
}

/** Only the plan, not the brief: shortening needs nothing else. */
export function shortenPrompt(input: {
  readonly size: PlanSize;
  readonly written: WrittenPlan;
  readonly words: number;
}): string {
  return `The project plan below is ${input.words} words and must be under ${PLAN_LIMITS[input.size].words}. Return the same plan, shorter: shorter sentences, fewer details, small steps joined. Keep every push-back, done check, cut-first item and decision. Never cut a sentence off in the middle.

Return the same JSON fields with the same meaning. Only "plan" gets shorter; keep the other fields as they are unless the shorter text joins two tasks.

## The plan
${JSON.stringify(input.written)}`;
}

export function pushBackPrompt(input: {
  readonly brief: PlanBrief;
  readonly decision: Decision;
  readonly message: string;
}): string {
  return `You wrote a project plan for this team, and they pushed back on one of its decisions. Answer it.

${RULES}
- verdict "defend": the reason does not change the best choice for this team. Explain why with reasons that fit their situation, not by insisting. Return the decision unchanged.
- verdict "change": the reason is good. Return the decision with the new pick and an updated "why".
"answer" is two or three sentences, addressed to the team.

${brief(input.brief)}

## The decision
${JSON.stringify(input.decision)}

## The push-back
${input.message}`;
}

/** What a plain chat gets for the eval's baseline: the same brief, no method. @public */
export const baselinePrompt = (input: PlanBrief) =>
  `Make me a project plan for this.\n\n${briefText(input)}`;
