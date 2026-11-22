import * as Schema from "effect/Schema";

import { ExpertId, PlanSize, SectionId } from "./planExperts.ts";

// Every field is required: Codex's structured output rejects optional ones. Length caps live in
// planCaps.ts, not here, because providers disagree on which JSON Schema limits they accept.

const Level = Schema.Literals(["low", "medium", "high"]);

export const PlanOption = Schema.Struct({
  name: Schema.String,
  good: Schema.String,
  bad: Schema.String,
  fit: Schema.String,
});

export const PlanDecision = Schema.Struct({
  title: Schema.String,
  section: SectionId,
  options: Schema.Array(PlanOption),
  picked: Schema.String,
  why: Schema.String,
  disagreement: Schema.String,
});
export type PlanDecision = typeof PlanDecision.Type;

export const PlanPart = Schema.Struct({
  section: SectionId,
  summary: Schema.String,
  details: Schema.String,
  diagram: Schema.String,
});

export const DraftRisk = Schema.Struct({
  risk: Schema.String,
  chance: Level,
  impact: Level,
  action: Schema.String,
});

export const DraftTask = Schema.Struct({
  title: Schema.String,
  area: Schema.String,
  hours: Schema.Number,
});

export const ChecklistAnswer = Schema.Struct({
  id: Schema.String,
  relevant: Schema.Boolean,
  answer: Schema.String,
});

export const Challenge = Schema.Struct({
  idea: Schema.String,
  problem: Schema.String,
  better: Schema.String,
});
export type Challenge = typeof Challenge.Type;

export const ExpertDraft = Schema.Struct({
  parts: Schema.Array(PlanPart),
  decisions: Schema.Array(PlanDecision),
  risks: Schema.Array(DraftRisk),
  tasks: Schema.Array(DraftTask),
  checklist: Schema.Array(ChecklistAnswer),
  challenges: Schema.Array(Challenge),
  questions: Schema.Array(Schema.String),
});
export type ExpertDraft = typeof ExpertDraft.Type;

export const SizeAndPanel = Schema.Struct({
  size: PlanSize,
  sizeReason: Schema.String,
  isSoftware: Schema.Boolean,
  panel: Schema.Array(ExpertId),
});

export const ReviewProblem = Schema.Struct({
  from: ExpertId,
  to: ExpertId,
  problem: Schema.String,
  fix: Schema.String,
});
export type ReviewProblem = typeof ReviewProblem.Type;

export const Review = Schema.Struct({ problems: Schema.Array(ReviewProblem) });

export const OpenChoice = Schema.Struct({
  question: Schema.String,
  options: Schema.Array(Schema.String),
  raisedBy: ExpertId,
});
export type OpenChoice = typeof OpenChoice.Type;

export const FixedDraft = Schema.Struct({
  draft: ExpertDraft,
  unresolved: Schema.Array(OpenChoice),
});

export const PlanArea = Schema.Struct({
  name: Schema.String,
  folders: Schema.Array(Schema.String),
  owner: Schema.String,
});

export const PlanTask = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  owner: Schema.String,
  area: Schema.String,
  week: Schema.Number,
  dependsOn: Schema.Array(Schema.String),
});
export type PlanTask = typeof PlanTask.Type;

export const PlanRisk = Schema.Struct({
  risk: Schema.String,
  chance: Level,
  impact: Level,
  action: Schema.String,
  watcher: Schema.String,
});

export const Merge = Schema.Struct({
  title: Schema.String,
  summaries: Schema.Array(Schema.Struct({ section: SectionId, summary: Schema.String })),
  areas: Schema.Array(PlanArea),
  tasks: Schema.Array(PlanTask),
  halfwayDemo: Schema.String,
  risks: Schema.Array(PlanRisk),
  glossary: Schema.Array(Schema.Struct({ term: Schema.String, meaning: Schema.String })),
});
export type Merge = typeof Merge.Type;

export const PushBackReply = Schema.Struct({
  verdict: Schema.Literals(["defend", "change"]),
  answer: Schema.String,
  decision: PlanDecision,
});
export type PushBackReply = typeof PushBackReply.Type;

/** A decision as the plan keeps it: numbered, owned, and with its push-back history. */
export const DecisionRecord = Schema.Struct({
  number: Schema.String,
  owner: ExpertId,
  decidedBy: Schema.String,
  status: Schema.String,
  decision: PlanDecision,
  history: Schema.Array(Schema.String),
});
export type DecisionRecord = typeof DecisionRecord.Type;

/** The whole method's result; the runner saves it as plan.json so a push-back can reopen it. */
export const PlanResult = Schema.Struct({
  size: PlanSize,
  schedule: Schema.Literals(["weeks", "blocks"]),
  sizeReason: Schema.String,
  panel: Schema.Array(ExpertId),
  drafts: Schema.Array(Schema.Struct({ expert: ExpertId, draft: ExpertDraft })),
  problems: Schema.Array(ReviewProblem),
  choices: Schema.Array(OpenChoice),
  merge: Merge,
  decisions: Schema.Array(DecisionRecord),
  overruns: Schema.Array(Schema.String),
});
export type PlanResult = typeof PlanResult.Type;
