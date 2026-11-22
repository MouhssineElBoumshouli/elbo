import * as Effect from "effect/Effect";

import type { PlanBrief } from "./planBrief.ts";
import { EXPERTS, type ExpertId } from "./planExperts.ts";
import type { Ask } from "./planMethod.ts";
import type { ExpertDraft, Merge, PlanDecision, ReviewProblem } from "./planSchemas.ts";

export const weekendBrief: PlanBrief = {
  what: "A to-do list for myself in the browser.",
  users: "Just me.",
  mustHaves: ["add a task", "tick it off", "keep tasks after a reload"],
  niceToHaves: ["due dates"],
  deadline: "this weekend",
  deadlineDays: 2,
  people: [{ name: "Lina", skills: ["HTML/CSS", "some JavaScript"], hours: 10 }],
  budget: "free only",
  outsideRules: [],
  ai: "no",
  feel: "calm",
  notes: "",
};

export const teamBrief: PlanBrief = {
  ...weekendBrief,
  what: "A club shop for our school club.",
  users: "Club members and the public.",
  deadline: "6 weeks",
  deadlineDays: 42,
  people: [
    { name: "Sara", skills: ["Python", "SQL"], hours: 48 },
    { name: "Yassine", skills: ["HTML/CSS"], hours: 48 },
  ],
};

export const decision = (title: string, section: PlanDecision["section"]): PlanDecision => ({
  title,
  section,
  options: [
    { name: "Plain pages", good: "simple", bad: "less interactive", fit: "Yassine knows HTML" },
    { name: "React", good: "rich", bad: "a build step", fit: "nobody knows it" },
  ],
  picked: "Plain pages",
  why: "The team knows HTML.",
  disagreement: "",
});

export function draftFor(expert: ExpertId, overrides: Partial<ExpertDraft> = {}): ExpertDraft {
  return {
    parts: EXPERTS[expert].sections.map((section) => ({
      section,
      summary: `${expert} summary for ${section}.`,
      details: `${expert} details for ${section}.`,
      diagram: "",
    })),
    decisions: [],
    risks: [{ risk: `${expert} risk`, chance: "medium", impact: "low", action: "watch it" }],
    tasks: [{ title: `${expert} task`, area: "app/", hours: 4 }],
    checklist: [],
    challenges: [],
    questions: [],
    ...overrides,
  };
}

export const merge = (people: ReadonlyArray<string>): Merge => ({
  title: "Test plan",
  summaries: [{ section: "what", summary: "Merged summary of what we build." }],
  areas: [{ name: "Pages", folders: ["app/"], owner: people[0] ?? "" }],
  tasks: people.map((owner, index) => ({
    id: `T${index + 1}`,
    title: `Task ${index + 1}`,
    owner,
    area: "app/",
    week: index + 1,
    dependsOn: [],
  })),
  halfwayDemo: "Add and tick a task.",
  risks: [1, 2, 3, 4].map((n) => ({
    risk: `Risk ${n}`,
    chance: "low" as const,
    impact: "low" as const,
    action: "watch",
    watcher: people[0] ?? "",
  })),
  glossary: [{ term: "API", meaning: "the part other parts ask for data" }],
});

/** A fake model: answers each step from `outputs` by its step name and records the order of steps. */
export function fakeAsk(outputs: {
  readonly size: { size: "small" | "medium" | "large"; panel: ReadonlyArray<ExpertId> };
  readonly drafts?: Partial<Record<ExpertId, ExpertDraft>>;
  readonly reviews?: ReadonlyArray<ReadonlyArray<ReviewProblem>>;
  readonly merge: Merge;
}) {
  const steps: string[] = [];
  const ask: Ask<never> = (request) => {
    steps.push(request.step);
    const [kind, first, second] = request.step.split(":");
    const answer = (): unknown => {
      switch (kind) {
        case "size":
          return { ...outputs.size, sizeReason: "fake", isSoftware: true };
        case "draft":
          return outputs.drafts?.[first as ExpertId] ?? draftFor(first as ExpertId);
        case "review":
          return { problems: outputs.reviews?.[Number(first) - 1] ?? [] };
        case "fix":
          return {
            draft: draftFor(second as ExpertId, { decisions: [decision("Fixed", "stack")] }),
            unresolved: [
              { question: `Choice from ${second}`, options: ["a", "b"], raisedBy: "security" },
            ],
          };
        case "merge":
          return outputs.merge;
        default:
          return {
            verdict: "defend",
            answer: "Still best.",
            decision: decision("Front end", "stack"),
          };
      }
    };
    return Effect.succeed(answer() as never);
  };
  return { ask, steps };
}
