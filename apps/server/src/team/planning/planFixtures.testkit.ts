import * as Effect from "effect/Effect";
import type * as Schema from "effect/Schema";

import type { PlanBrief } from "./planBrief.ts";
import type { Ask, StepRequest } from "./planMethod.ts";
import type { Decision, ReviewProblem, WrittenPlan } from "./planSchemas.ts";

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

export const decision = (title: string, picked = "Plain pages"): Decision => ({
  title,
  picked,
  options: ["Plain pages", "React"],
  why: "The team knows HTML.",
});

export function written(text: string, overrides: Partial<WrittenPlan> = {}): WrittenPlan {
  return {
    title: "Club shop",
    plan: text,
    decisions: [decision("Front end")],
    tasks: [
      { title: "Build the list page", owner: "Sara", hours: 4, area: "app/", when: "Week 1" },
    ],
    doneChecks: [{ mustHave: "add a task", done: "A task appears after Enter." }],
    pushBacks: [],
    cutFirst: ["due dates"],
    ...overrides,
  };
}

export const problem = (id: string, severity: ReviewProblem["severity"]): ReviewProblem => ({
  id,
  severity,
  problem: `${id} problem`,
  why: `${id} why`,
  fix: `${id} fix`,
});

export const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

/**
 * An `Ask` that answers each step from `script`: a value, or a function of the prompt. Every step
 * and prompt is kept, so a test can check which turns ran and what they were told.
 */
export function scriptedAsk(script: Record<string, unknown | ((prompt: string) => unknown)>) {
  const steps: string[] = [];
  const prompts: Record<string, string> = {};
  const ask: Ask<never> = <S extends Schema.Top>(request: StepRequest<S>) => {
    steps.push(request.step);
    prompts[request.step] = request.prompt;
    const entry = script[request.step];
    if (entry === undefined) return Effect.die(`no scripted answer for ${request.step}`);
    const value = typeof entry === "function" ? entry(request.prompt) : entry;
    return Effect.succeed(value as S["Type"]);
  };
  return { ask, steps, prompts };
}
