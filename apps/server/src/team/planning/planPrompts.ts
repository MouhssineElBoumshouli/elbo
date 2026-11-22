import { briefText, type PlanBrief, totalHours } from "./planBrief.ts";
import { CAPS } from "./planCaps.ts";
import {
  EXPERTS,
  type ExpertId,
  type PlanSize,
  SECTION_TITLES,
  type SectionId,
  suggestSize,
} from "./planExperts.ts";
import type { ExpertDraft, OpenChoice, PlanDecision, ReviewProblem } from "./planSchemas.ts";

export type Checklists = Partial<Record<ExpertId, string>>;

/** At or under this, the work goes in time blocks instead of weeks. */
export const SHORT_DEADLINE_DAYS = 7;

/** Ids of a checklist's items (`- S2: …`), so answers can be checked against it. */
export const checklistIds = (checklist: string) =>
  [...checklist.matchAll(/^- ([A-Z]+\d+):/gm)].map((match) => match[1] ?? "");

// The same opening on every step keeps the provider's prompt cache warm (section 5).
function opening(brief: PlanBrief): string {
  return `You are part of a planning panel that helps a person or a student team plan a project before they build it. The panel works like a good team: each expert writes its own part, checks the others, and argues where it matters.

Rules for every expert:
- Write in plain words for the team in the brief. Short sentences. Explain any technical word the first time.
- Fit everything to this team: name people and their skills, the hours, the budget and the outside rules.
- Never accept a bad idea because the brief asks for it. If an idea in the brief is unsafe, too big for the time, cannot work on the budget, or breaks an outside rule, push back: say the problem and a better option.
- Do not invent facts about the team. If a fact you need is missing, add it to "questions".
- Every real choice gets 2 or 3 options. Each option says what is good, what is bad, and how it fits this team.

## The brief
${briefText(brief)}`;
}

const role = (expert: ExpertId) => `## Your role: ${EXPERTS[expert].name}`;

const sectionLine = (expert: ExpertId, section: SectionId) =>
  section === "extra"
    ? `${EXPERTS[expert].extraTitle ?? SECTION_TITLES.extra} (section id "extra")`
    : `${SECTION_TITLES[section]} (section id "${section}")`;

const checklistBlock = (checklist: string) => `## Your checklist
Answer every item by its id in "checklist": relevant=true with a short answer, or relevant=false with the reason it does not apply.
${checklist.trim()}`;

const panelLine = (panel: ReadonlyArray<ExpertId>) =>
  panel.map((id) => `${EXPERTS[id].name} (${id})`).join(", ");

export function sizePrompt(brief: PlanBrief): string {
  const suggested = suggestSize(brief.people.length, totalHours(brief), brief.deadlineDays);
  const experts = (Object.keys(EXPERTS) as ExpertId[])
    .map((id) => `- ${id}: ${EXPERTS[id].name}`)
    .join("\n");
  return `${opening(brief)}

${role("project-manager")}
Step: pick the plan's size and the panel.

Sizes:
- small: a weekend, 1 person, under about 20 hours. One-page plan, 2 experts.
- medium: a few weeks, 1 to 3 people. All sections, short. 3 to 4 experts.
- large: a semester or a product, 3 or more people. All sections in full. 4 to 5 experts.
From the hours alone the size would be ${suggested}. Pick another only with a reason.

Experts you can put on the panel (the project manager is always on it):
${experts}
Pick only the experts this project needs: a designer when people use screens, an AI engineer only when AI is in it, the others only for their kind of project. More experts add noise.
isSoftware: true when the team builds software (an app, a website, a tool).`;
}

export function draftPrompt(input: {
  readonly brief: PlanBrief;
  readonly expert: ExpertId;
  readonly size: PlanSize;
  readonly panel: ReadonlyArray<ExpertId>;
  readonly sections: ReadonlyArray<SectionId>;
  readonly checklist: string;
}): string {
  const owned = input.sections
    .map((section) => `- ${sectionLine(input.expert, section)}`)
    .join("\n");
  const small =
    input.size === "small"
      ? "\nThis is a small plan: the whole plan must fit on one page (under 450 words). Each summary is one or two short lines, details stay short, and only the stack gets a decision; scope is not a decision."
      : "";
  return `${opening(input.brief)}

${role(input.expert)}
Plan size: ${input.size}. Panel: ${panelLine(input.panel)}.
Step: write your part of the plan.${small}

You write these sections, one entry each in "parts":
${owned}

${checklistBlock(input.checklist)}

## What to return
- parts: summary at most ${CAPS.summaryLines} short lines (${CAPS.summaryWords} words); details at most ${CAPS.detailsWords} words; diagram is a few lines of text art for "How the parts fit together", otherwise "".
- decisions: one per real choice in your sections, with 2 or 3 options. "picked" is the name of one option. "why" at most ${CAPS.whyWords} words. "disagreement": where you disagree with an idea from the brief or another expert, say so; otherwise "".
- challenges: every idea in the brief you push back on, with the problem and a better option. Empty when there is none.
- risks: the risks in your area, with chance, impact and what we do.
- tasks: the work your sections need. area = the folder or part of the work it touches; hours = your estimate. Do not pick owners; the project manager does.
- questions: only facts you really need and the brief does not give.`;
}

const draftsJson = (
  drafts: ReadonlyArray<{ readonly expert: ExpertId; readonly draft: ExpertDraft }>,
) =>
  drafts
    .map(({ expert, draft }) => {
      const { checklist: _checklist, ...shown } = draft;
      return `### ${EXPERTS[expert].name} (${expert})\n${JSON.stringify(shown)}`;
    })
    .join("\n\n");

export function reviewPrompt(input: {
  readonly brief: PlanBrief;
  readonly drafts: ReadonlyArray<{ readonly expert: ExpertId; readonly draft: ExpertDraft }>;
  readonly checklists: Checklists;
}): string {
  const reviewers = input.drafts
    .map(
      ({ expert }) =>
        `### ${EXPERTS[expert].name} (${expert})\n${input.checklists[expert]?.trim() ?? ""}`,
    )
    .join("\n\n");
  return `${opening(input.brief)}

Step: cross-review. Each expert below reads the OTHER experts' parts against its own checklist and returns only problems: a choice that breaks the brief, an outside rule, the budget, the hours, or the expert's checklist. Do not rewrite parts. Do not repeat praise. An empty list is a good answer when nothing is wrong.
"from" is the reviewer, "to" the expert whose part has the problem, "fix" a concrete change.

## The reviewers and their checklists
${reviewers}

## The parts
${draftsJson(input.drafts)}`;
}

export function fixPrompt(input: {
  readonly brief: PlanBrief;
  readonly expert: ExpertId;
  readonly draft: ExpertDraft;
  readonly problems: ReadonlyArray<ReviewProblem>;
  readonly checklist: string;
}): string {
  const problems = input.problems
    .map(
      (problem) =>
        `- From the ${EXPERTS[problem.from].name}: ${problem.problem} Suggested fix: ${problem.fix}`,
    )
    .join("\n");
  return `${opening(input.brief)}

${role(input.expert)}
Step: other experts reviewed your part. Fix each problem in your draft, or, when you disagree and the team must choose, put it in "unresolved" as a question with the options (raisedBy is the expert who raised it). Keep everything else as it was, with the same length limits.

## The problems
${problems}

## Your draft
${JSON.stringify(input.draft)}

${checklistBlock(input.checklist)}`;
}

export function mergePrompt(input: {
  readonly brief: PlanBrief;
  readonly size: PlanSize;
  readonly sections: ReadonlyArray<SectionId>;
  readonly drafts: ReadonlyArray<{ readonly expert: ExpertId; readonly draft: ExpertDraft }>;
  readonly choices: ReadonlyArray<OpenChoice>;
}): string {
  const people = input.brief.people.map((person) => person.name).join(", ");
  const timing =
    input.brief.deadlineDays <= SHORT_DEADLINE_DAYS
      ? `The deadline is days or hours away, so tasks go in time blocks: "week" is the block number (1 is the first block), and each title starts with its hours, e.g. "Hours 0-4: …". Keep the last block for rehearsal and fixes.`
      : `Tasks go by week, from week 1 to the deadline. Keep the last week for testing and fixes.`;
  const sized =
    input.size === "small"
      ? `This is a small plan: the whole plan must fit on one page (under 450 words). Summaries are one line each. Tasks are a short to-do list of at most 8 short lines, all in block 1. At most 3 risks.`
      : `${timing} Give each person whole areas where you can.`;
  return `${opening(input.brief)}

${role("project-manager")}
Step: merge the experts' parts into the final plan.
${sized}

Return:
- title: the project's name in a few words.
- summaries: one per section, rewritten in plain words for this team, at most ${CAPS.summaryLines} short lines. Say what the plan does; the decisions already show the options. Sections: ${input.sections.join(", ")}.
- areas: the parts of the work, the folders each one touches, and one owner each (one of: ${people}).
- tasks: every task from the parts, merged and ordered, ids T1, T2, ... Each has exactly one owner (one of: ${people}), one area, a week number, and the ids it depends on. Check the hours fit with a 30% buffer; drop or move to "later" what does not fit.
- halfwayDemo: what can be shown halfway, in one line.
- risks: the most important risks from all parts, each with who watches it.
- glossary: every technical word the plan uses, explained in one plain sentence.
${input.choices.length > 0 ? `\nChoices still open for the team (keep them out of the tasks until decided):\n${input.choices.map((choice) => `- ${choice.question} (${choice.options.join(" / ")})`).join("\n")}` : ""}

## The parts
${draftsJson(input.drafts)}`;
}

export function pushBackPrompt(input: {
  readonly brief: PlanBrief;
  readonly expert: ExpertId;
  readonly decision: PlanDecision;
  readonly message: string;
  readonly checklist: string;
}): string {
  return `${opening(input.brief)}

${role(input.expert)}
Step: the team pushed back on one of your decisions. Answer it.
- verdict "defend": the reason does not change the best choice for this team. Explain why with reasons that fit their situation, not by insisting. Return the decision unchanged.
- verdict "change": the reason is good. Return the decision with the new pick and an updated "why".
"answer" is at most ${CAPS.whyWords} words, addressed to the team.

## The decision
${JSON.stringify(input.decision)}

## The push-back
${input.message}

${checklistBlock(input.checklist)}`;
}

/** What a plain chat gets for the eval's baseline: the same brief, no method. @public */
export const baselinePrompt = (brief: PlanBrief) =>
  `Make me a project plan for this.\n\n${briefText(brief)}`;
