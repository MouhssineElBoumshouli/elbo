import * as Effect from "effect/Effect";

import type { PlanBrief } from "./planBrief.ts";
import { EXPERTS, type ExpertId, type PlanKind } from "./planExperts.ts";
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

export const merge = (people: ReadonlyArray<string>, overrides: Partial<Merge> = {}): Merge => ({
  title: "Test plan",
  sections: [{ section: "what", summary: "What we build, in short.", details: "More about it." }],
  pushBacks: [],
  choices: [],
  mainDecisions: [],
  doneChecks: [{ mustHave: "Add a task", done: "Type a task, press Enter, it shows." }],
  milestones: [{ when: "Saturday evening", what: "Add and tick work", cutFirst: "styling" }],
  areas: [{ name: "Pages", folders: ["app/"], owner: people[0] ?? "" }],
  tasks: people.map((owner, index) => ({
    id: `T${index + 1}`,
    title: `Task ${index + 1}`,
    owner,
    area: "app/",
    week: index + 1,
    dependsOn: [],
  })),
  risks: [1, 2, 3, 4].map((n) => ({
    risk: `Risk ${n}`,
    chance: "low" as const,
    impact: "low" as const,
    action: "watch",
    watcher: people[0] ?? "",
  })),
  glossary: [{ term: "API", meaning: "the part other parts ask for data" }],
  ...overrides,
});

/** A fake model: answers each step from `outputs` by its step name and records every request. */
export function fakeAsk(outputs: {
  readonly size: {
    size: "small" | "medium" | "large";
    panel: ReadonlyArray<ExpertId>;
    kind?: PlanKind;
  };
  readonly drafts?: Partial<Record<ExpertId, ExpertDraft>>;
  readonly reviews?: ReadonlyArray<ReadonlyArray<ReviewProblem>>;
  readonly merge: Merge;
  readonly shorter?: Merge;
}) {
  const steps: string[] = [];
  const prompts: Record<string, string> = {};
  const ask: Ask<never> = (request) => {
    steps.push(request.step);
    prompts[request.step] = request.prompt;
    const [kind, first] = request.step.split(":");
    const answer = (): unknown => {
      switch (kind) {
        case "size":
          return { kind: "app", ...outputs.size, sizeReason: "fake", isSoftware: true };
        case "draft":
          return outputs.drafts?.[first as ExpertId] ?? draftFor(first as ExpertId);
        case "review":
          return { problems: outputs.reviews?.[Number(first) - 1] ?? [] };
        case "fix":
          // Fixes for two experts; the method must keep only those the review named.
          return {
            fixes: (["architect", "designer"] as const).map((expert) => ({
              expert,
              draft: draftFor(expert, { decisions: [decision(`Fixed by ${expert}`, "stack")] }),
            })),
            unresolved: [
              {
                question: "Will teachers use their own phones?",
                options: ["yes", "no"],
                raisedBy: "security",
              },
            ],
          };
        case "merge":
          return outputs.merge;
        case "shorten":
          return outputs.shorter ?? outputs.merge;
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
  return { ask, steps, prompts };
}
