import { ProjectId, type TeamPlanRunState } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import {
  answersFromJson,
  briefFromAnswers,
  emptyAnswers,
  type PlanAnswers,
  planErrorWords,
  progressText,
  sameProviderNote,
  sizeSentence,
  suggestedSize,
} from "./planAnswers.logic";

const team: PlanAnswers = {
  ...emptyAnswers([
    { name: "adam-k", memberId: "m1", skills: "JavaScript, some React", hours: "8" },
    { name: "Sara", memberId: null, skills: "Python,SQL", hours: "8" },
    { name: "", memberId: null, skills: "", hours: "" },
  ]),
  what: "An app that takes attendance in class.",
  users: ["A teacher", "Classmates"],
  mustHaves: ["Students check in", " ", "Teacher sees who is there", "", ""],
  niceToHaves: "Statistics\n\nEmails",
  deadlineAmount: "6",
  deadlineUnit: "weeks",
  budget: "Free only",
  outsideRules: "Data stays in the EU",
  notSure: ["ai", "feel"],
  ai: "Yes, AI is part of it",
  feel: "Calm",
};

describe("briefFromAnswers", () => {
  it("turns the answers into the brief, with hours for the whole project", () => {
    const brief = briefFromAnswers(team);
    expect(brief).toEqual({
      what: "An app that takes attendance in class.",
      users: "A teacher, Classmates",
      mustHaves: ["Students check in", "Teacher sees who is there"],
      niceToHaves: ["Statistics", "Emails"],
      deadline: "6 weeks",
      deadlineDays: 42,
      people: [
        { name: "adam-k", skills: ["JavaScript", "some React"], hours: 48 },
        { name: "Sara", skills: ["Python", "SQL"], hours: 48 },
      ],
      budget: "Free only",
      outsideRules: ["Data stays in the EU"],
      ai: "",
      feel: "",
      notes: "",
    });
    expect(suggestedSize(brief)).toBe("medium");
    expect(sizeSentence(brief, "medium")).toBe(
      "This looks like a medium project: 2 people, 6 weeks.",
    );
  });

  it("takes hours in total for a project under a week, and a default when the deadline is not sure", () => {
    const weekend = briefFromAnswers({
      ...emptyAnswers([{ name: "You", memberId: "me", skills: "HTML", hours: "10" }]),
      deadlineAmount: "2",
      deadlineUnit: "days",
    });
    expect([weekend.deadlineDays, weekend.people[0]?.hours]).toEqual([2, 10]);
    expect(suggestedSize(weekend)).toBe("small");
    expect(sizeSentence(weekend, "small")).toBe(
      "This looks like a small project: 1 person, 2 days.",
    );
    const unsure = briefFromAnswers({ ...team, notSure: ["deadline"] });
    expect([unsure.deadline, unsure.deadlineDays]).toEqual(["", 42]);
  });
});

const running = (overrides: Partial<TeamPlanRunState>): TeamPlanRunState => ({
  runId: "run-1",
  projectId: ProjectId.make("project-1"),
  status: "running",
  step: "writing",
  round: 0,
  points: 0,
  writer: { driver: "codex", name: "Codex", model: "gpt-6-astra" },
  reviewer: { driver: "claudeAgent", name: "Claude", model: "claude-opus-5-5" },
  sameProvider: false,
  view: null,
  error: null,
  answering: null,
  version: 0,
  interrupted: null,
  answers: "{}",
  ...overrides,
});

describe("progress and errors", () => {
  it("says who is doing what", () => {
    expect(
      [
        running({}),
        running({ step: "reviewing", round: 1 }),
        running({ step: "fixing", round: 1, points: 2 }),
        running({ step: "reviewing", round: 2 }),
        running({ step: "fixing", points: 1 }),
        running({ status: "stopped", step: null }),
      ].map(progressText),
    ).toEqual([
      "Codex is writing the plan",
      "Claude is reviewing it",
      "Codex is fixing 2 points",
      "Claude is checking the fixes",
      "Codex is fixing 1 point",
      "Stopped. Nothing was saved.",
    ]);
    expect(sameProviderNote(running({}))).toBeNull();
    expect(
      sameProviderNote(
        running({
          sameProvider: true,
          reviewer: { driver: "codex", name: "Codex", model: "gpt-6-astra" },
        }),
      ),
    ).toBe("Only Codex is connected, so it reviews its own plan in a fresh session.");
  });

  it("uses the limit card's words when an account ran out", () => {
    const failed = running({
      status: "failed",
      step: null,
      error: {
        message:
          "Codex CLI command failed: You’ve hit your usage limit. Visit https://chatgpt.com/codex/settings/usage to purchase more credits or try again at 11:44 PM.",
        failureClass: null,
        code: null,
        driver: "codex",
      },
    });
    expect(planErrorWords(failed, undefined)).toEqual({
      title: "ChatGPT usage limit reached",
      description: "Your ChatGPT account reached its usage limit. It resets at 11:44 PM.",
    });
    expect(
      planErrorWords(
        running({
          status: "failed",
          error: { message: "Timed out.", failureClass: null, code: null, driver: "claudeAgent" },
        }),
        undefined,
      ),
    ).toEqual({ title: "Claude could not finish the plan", description: "Timed out." });
  });
});

describe("answers kept as JSON", () => {
  it("reads them back, keeping the fallback for anything missing or of the wrong shape", () => {
    const fallback = emptyAnswers([{ name: "You", memberId: null, skills: "", hours: "" }]);
    const saved = { ...fallback, what: "A to-do list", users: ["Just me"] };
    expect(answersFromJson(JSON.stringify(saved), fallback)).toEqual(saved);
    expect(answersFromJson('{"what": 3, "users": "Just me"}', fallback)).toEqual(fallback);
    expect(answersFromJson("{not json", fallback)).toBe(fallback);
    expect(answersFromJson(null, fallback)).toBe(fallback);
  });
});
