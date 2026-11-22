import * as Schema from "effect/Schema";

/** The answers to the planning questions (team/PLANNING_FEATURE_PLAN.md section 4). An empty answer means "not sure, suggest something". */
export const PlanPerson = Schema.Struct({
  name: Schema.String,
  skills: Schema.Array(Schema.String),
  /** Hours this person can give before the deadline, in total. */
  hours: Schema.Number,
});
export type PlanPerson = typeof PlanPerson.Type;

export const PlanBrief = Schema.Struct({
  what: Schema.String,
  users: Schema.String,
  mustHaves: Schema.Array(Schema.String),
  niceToHaves: Schema.Array(Schema.String),
  deadline: Schema.String,
  deadlineDays: Schema.Number,
  people: Schema.Array(PlanPerson),
  budget: Schema.String,
  outsideRules: Schema.Array(Schema.String),
  ai: Schema.String,
  feel: Schema.String,
  notes: Schema.String,
});
export type PlanBrief = typeof PlanBrief.Type;

export const decodeBrief = Schema.decodeUnknownEffect(Schema.fromJsonString(PlanBrief));

export const totalHours = (brief: PlanBrief) =>
  brief.people.reduce((sum, person) => sum + person.hours, 0);

const NOT_SURE = "not sure, suggest something";
const answer = (text: string) => (text.trim().length === 0 ? NOT_SURE : text.trim());
const list = (items: ReadonlyArray<string>) =>
  items.length === 0 ? NOT_SURE : items.map((item) => `- ${item}`).join("\n");

/** The brief every step reads, instead of the question chat. Plain lines keep it short (section 5: under ~600 tokens). */
export function briefText(brief: PlanBrief): string {
  const people = brief.people
    .map(
      (person) =>
        `- ${person.name}: ${person.skills.length > 0 ? person.skills.join(", ") : "no listed skills"}; ${person.hours} hours in total`,
    )
    .join("\n");
  return [
    `What: ${answer(brief.what)}`,
    `For whom: ${answer(brief.users)}`,
    `Must do on day one:\n${list(brief.mustHaves)}`,
    `Nice to have, can wait:\n${list(brief.niceToHaves)}`,
    `Deadline: ${answer(brief.deadline)} (${brief.deadlineDays} days)`,
    `Team (${totalHours(brief)} hours in total):\n${people}`,
    `Budget: ${answer(brief.budget)}`,
    `Outside rules:\n${brief.outsideRules.length === 0 ? "none" : list(brief.outsideRules)}`,
    `AI in it: ${answer(brief.ai)}`,
    `Feel: ${answer(brief.feel)}`,
    ...(brief.notes.trim().length > 0 ? [`Anything else: ${brief.notes.trim()}`] : []),
  ].join("\n");
}

/** Characters / 4, the same estimate section 5 uses. @public, for the eval. */
export const estimateTokens = (text: string) => Math.ceil(text.length / 4);
