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
import type { PlanDecision } from "./planSchemas.ts";

export type Checklists = Partial<Record<ExpertId | "quick-security", string>>;

/** At or under this, the work goes in time blocks and the architect keeps storage simple. */
export const SHORT_DEADLINE_DAYS = 7;

/** Ids of a checklist's items (`- S2: …`), so answers can be checked against it. */
export const checklistIds = (checklist: string) =>
  [...checklist.matchAll(/^- ([A-Z]+\d+):/gm)].map((match) => match[1] ?? "");

/** An expert's checklist; without a security engineer, the architect also answers 3 security lines. */
export function checklistFor(expert: ExpertId, checklists: Checklists, quickSecurity: boolean) {
  const own = checklists[expert]?.trim() ?? "";
  return expert === "architect" && quickSecurity
    ? `${own}\n${checklists["quick-security"]?.trim() ?? ""}`
    : own;
}

/**
 * The rules and the brief. Every turn starts with them when turns are separate calls, so the
 * provider's prompt cache sees the same opening; in one shared chat only the first turn needs them.
 */
export function opening(brief: PlanBrief, inChat: boolean): string {
  if (inChat) return "Same brief and rules as at the start of this chat.";
  return `You are part of a planning panel that helps a person or a student team plan a project before they build it. Each expert writes its own part, checks the others, and argues where it matters.

Rules for every expert:
- Write it like you'd explain it to a classmate: short sentences, everyday words. For example: "We keep everything in one small database file, because nobody on the team has run a database server before." Explain a technical word the first time you use it.
- Write for the team, never about this planning session: no talk of drafts, other experts' parts, the panel, or a breakdown someone supplied.
- Fit everything to this team: name people and their skills, the hours, the budget and the outside rules.
- Never accept a bad idea because the brief asks for it. If an idea in the brief is unsafe, too big for the time, cannot work on the budget, or breaks an outside rule, push back: say the problem and a better option.
- Do not invent facts about the team. If a fact you need is missing, add it to "questions".
- Every real choice gets 2 or 3 options. Each option says what is good, what is bad, and how it fits this team.

## The brief
${briefText(brief)}`;
}

export const role = (expert: ExpertId) => `## Your role: ${EXPERTS[expert].name}`;

const sectionLine = (expert: ExpertId, section: SectionId) =>
  section === "extra"
    ? `${EXPERTS[expert].extraTitle ?? SECTION_TITLES.extra} (section id "extra")`
    : `${SECTION_TITLES[section]} (section id "${section}")`;

const checklistBlock = (checklist: string) => `## Your checklist
Answer every item by its id in "checklist", in 1 or 2 short lines: relevant=true with the answer, or relevant=false with the reason it does not apply.
${checklist.trim()}`;

const panelLine = (panel: ReadonlyArray<ExpertId>) =>
  panel.map((id) => `${EXPERTS[id].name} (${id})`).join(", ");

export function sizePrompt(brief: PlanBrief): string {
  const suggested = suggestSize(brief.people.length, totalHours(brief), brief.deadlineDays);
  const experts = (Object.keys(EXPERTS) as ExpertId[])
    .map((id) => `- ${id}: ${EXPERTS[id].name}`)
    .join("\n");
  return `${opening(brief, false)}

${role("project-manager")}
Step: pick the plan's size, the kind of project, and the panel.

Sizes:
- small: a weekend, 1 person, under about 20 hours. One-page plan, 2 experts.
- medium: a few weeks, 1 to 3 people. All sections, short. 3 to 4 experts.
- large: a semester or a product, 3 or more people. All sections in full. 4 to 5 experts.
From the hours alone the size would be ${suggested}. Pick another only with a reason.

kind: app, website, hackathon (a timed event judged on a pitch and demo), research, ml, mobile (a phone app), or other.
isSoftware: true when the team builds software (an app, a website, a tool).

Experts you can put on the panel (the project manager is always on it):
${experts}
Pick only the experts this project needs: a designer when people use screens, an AI engineer only when AI is in it. More experts add noise.`;
}

export function draftPrompt(input: {
  readonly brief: PlanBrief;
  readonly expert: ExpertId;
  readonly size: PlanSize;
  readonly panel: ReadonlyArray<ExpertId>;
  readonly sections: ReadonlyArray<SectionId>;
  readonly checklist: string;
  readonly inChat: boolean;
}): string {
  const owned = input.sections
    .map((section) => `- ${sectionLine(input.expert, section)}`)
    .join("\n");
  const sized =
    input.size === "small"
      ? "This is a small plan: the whole plan fits on one page. Each summary is one or two short lines, details stay short, and only the stack gets a decision; scope is not a decision."
      : "The whole plan has room for only a few decisions: make at most 2, and only for choices that really matter to this team.";
  const storage =
    input.expert === "architect" && input.brief.deadlineDays <= SHORT_DEADLINE_DAYS
      ? "\nThe deadline is short: pick the simplest storage the team can run (for example SQLite or one file) unless the brief needs more."
      : "";
  return `${opening(input.brief, input.inChat)}

${role(input.expert)}
Plan size: ${input.size}. Panel: ${panelLine(input.panel)}.
Step: write your part of the plan. ${sized}${storage}

You write these sections, one entry each in "parts":
${owned}

${checklistBlock(input.checklist)}

## What to return
- parts: summary at most ${CAPS.summaryLines} short lines (${CAPS.summaryWords} words); details at most ${CAPS.detailsWords} words; diagram is a few lines of text art for "How the parts fit together", otherwise "".
- decisions: real choices in your sections only, with 2 or 3 options. "picked" is the name of one option. "why" at most ${CAPS.whyWords} words. "disagreement": where you disagree with an idea from the brief, say so; otherwise "".
- challenges: every idea in the brief you push back on, with the problem and a better option. Empty when there is none.
- risks: the risks in your area, with chance, impact and what we do.
- tasks: the work your sections need. area = the folder or part of the work it touches; hours = your estimate. Do not pick owners; the project manager does.
- questions: only facts about the project you really need and the brief does not give.`;
}

export function pushBackPrompt(input: {
  readonly brief: PlanBrief;
  readonly expert: ExpertId;
  readonly decision: PlanDecision;
  readonly message: string;
  readonly checklist: string;
}): string {
  return `${opening(input.brief, false)}

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
