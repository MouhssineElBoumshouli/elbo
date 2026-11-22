import type { PlanBrief } from "./planBrief.ts";
import { PLAN_LIMITS } from "./planBudget.ts";
import { EXPERTS, type ExpertId, type PlanSize, type SectionId } from "./planExperts.ts";
import { type Checklists, opening, role, SHORT_DEADLINE_DAYS } from "./planPrompts.ts";
import type { ExpertDraft, Merge, OpenChoice, ReviewProblem } from "./planSchemas.ts";

type Drafts = ReadonlyArray<{ readonly expert: ExpertId; readonly draft: ExpertDraft }>;

/** In one shared chat the parts are already above; separate calls need them again. */
function partsBlock(drafts: Drafts, inChat: boolean): string {
  if (inChat)
    return "## The parts\nThe experts' answers earlier in this chat; where a part was fixed, the fixed version counts.";
  return `## The parts\n${drafts
    .map(({ expert, draft }) => {
      const { checklist: _checklist, ...shown } = draft;
      return `### ${EXPERTS[expert].name} (${expert})\n${JSON.stringify(shown)}`;
    })
    .join("\n\n")}`;
}

export function reviewPrompt(input: {
  readonly brief: PlanBrief;
  readonly drafts: Drafts;
  readonly checklists: Checklists;
  readonly inChat: boolean;
}): string {
  const reviewers = input.drafts
    .map(
      ({ expert }) =>
        `### ${EXPERTS[expert].name} (${expert})\n${input.checklists[expert]?.trim() ?? ""}`,
    )
    .join("\n\n");
  return `${opening(input.brief, input.inChat)}

Step: cross-review. Each expert below reads the OTHER experts' parts against its own checklist and returns only problems: a choice that breaks the brief, an outside rule, the budget, the hours, or the expert's checklist. Do not rewrite parts. An empty list is a good answer when nothing is wrong.
"from" is the reviewer, "to" the expert whose part has the problem, "fix" a concrete change.

## The reviewers and their checklists
${reviewers}

${partsBlock(input.drafts, input.inChat)}`;
}

export function fixAllPrompt(input: {
  readonly brief: PlanBrief;
  readonly drafts: Drafts;
  readonly problems: ReadonlyArray<ReviewProblem>;
  readonly inChat: boolean;
}): string {
  const authors = input.drafts.filter(({ expert }) => input.problems.some((p) => p.to === expert));
  const problems = authors
    .map(({ expert }) =>
      [
        `### For the ${EXPERTS[expert].name} (${expert})`,
        ...input.problems
          .filter((p) => p.to === expert)
          .map((p) => `- From the ${EXPERTS[p.from].name}: ${p.problem} Suggested fix: ${p.fix}`),
      ].join("\n"),
    )
    .join("\n\n");
  return `${opening(input.brief, input.inChat)}

Step: each expert below fixes the problems the cross-review found in its part. Return one entry in "fixes" per expert listed, with its whole part fixed and everything else kept, within the same limits.
When an expert disagrees and only the team can settle it, add it to "unresolved" as a question for the team about their project (for example "Will teachers use their own phones?"), with the options; raisedBy is the expert who raised it. Never ask the team how the experts' parts fit together: settle that yourselves.

## The problems
${problems}

${partsBlock(authors, input.inChat)}`;
}

export function mergePrompt(input: {
  readonly brief: PlanBrief;
  readonly size: PlanSize;
  readonly sections: ReadonlyArray<SectionId>;
  readonly drafts: Drafts;
  readonly choices: ReadonlyArray<OpenChoice>;
  readonly inChat: boolean;
}): string {
  const people = input.brief.people.map((person) => person.name).join(", ");
  const limits = PLAN_LIMITS[input.size];
  const timing =
    input.brief.deadlineDays <= SHORT_DEADLINE_DAYS
      ? `The deadline is days or hours away, so tasks go in time blocks: "week" is the block number (1 is the first block), and each title starts with its hours, e.g. "Hours 0-4: …". Keep the last block for rehearsal and fixes.`
      : `Tasks go by week, from week 1 to the deadline. Keep the last week for testing and fixes.`;
  const sized =
    input.size === "small"
      ? `This is a small plan: one page. Summaries are one line each and details are "". Tasks are a short to-do list of at most 8 short lines, all in block 1. At most 3 risks, 2 milestones, no glossary.`
      : `${timing} Give each person whole areas where you can. Details are at most ${input.size === "large" ? 120 : 60} words per section.`;
  return `${opening(input.brief, input.inChat)}

${role("project-manager")}
Step: write the final plan for the team from the experts' parts. The team reads only this, so rewrite everything in your own plain words; never mention the parts, drafts, the panel or anyone's breakdown.
The whole plan must stay under ${limits.words} words. ${sized}

Return:
- title: the project's name in a few words.
- sections: one per section (${input.sections.join(", ")}), each with a summary of at most 3 short lines and "details" (the "go deeper" text). Say what the plan does; decisions already show the options.
- pushBacks: every idea in the brief the experts pushed back on. When several experts object to the same point, make it one item and list all of them in raisedBy. Keep every distinct point.
- choices: only open questions the team must answer about their project (a fact or a preference you could not know), with options. Never repeat a decision here: decisions are already made and listed separately. Leave out anything about how the experts' work fits together. Empty is fine.
- mainDecisions: the titles of the at most ${limits.decisions} decisions that matter most, most important first, copied exactly. The rest stay in the plan as one line each.
- doneChecks: for each must-have, one line on how the team knows it is done.
- milestones: when, what is working by then, and what to cut first if it slips.
- areas: the parts of the work, the folders each one touches, and one owner each (one of: ${people}).
- tasks: every task, merged and ordered, ids T1, T2, ... Each has exactly one owner (one of: ${people}), one area, a week number, and the ids it depends on. Check the hours fit with a 30% buffer; move what does not fit to "later".
- risks: the most important risks, each with who watches it.
- glossary: every technical word the plan uses, explained in one plain sentence.
${input.choices.length > 0 ? `\nQuestions the experts left open (keep only real questions about the project):\n${input.choices.map((choice) => `- ${choice.question} (${choice.options.join(" / ")})`).join("\n")}\n` : ""}
${partsBlock(input.drafts, input.inChat)}`;
}

export function shortenPrompt(input: {
  readonly brief: PlanBrief;
  readonly size: PlanSize;
  readonly merge: Merge;
  readonly words: number;
  readonly inChat: boolean;
}): string {
  const limit = PLAN_LIMITS[input.size].words;
  return `${opening(input.brief, input.inChat)}

${role("project-manager")}
Step: the plan is ${input.words} words and must be under ${limit}. Return the same plan, shorter, in the same shape: tighten summaries and details, join small tasks, drop minor risks and glossary entries. Keep every push-back, done check, milestone and decision title. Rewrite sentences to be shorter; never cut one off in the middle.

## The plan
${input.inChat ? "Your last answer in this chat." : JSON.stringify(input.merge)}`;
}
