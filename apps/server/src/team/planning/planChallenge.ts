// team-layer: the challenge loop's rules (team/PLANNING_FEATURE_PLAN.md section 2, slice 5), as
// data: which plan parts a decision touches, how an answer changes the plan, and the decision states.
import type {
  Decision,
  DecisionRecord,
  PlanResult,
  PlanTask,
  PushBackReply,
  WrittenPlan,
} from "./planSchemas.ts";

/** The plan text in parts: the blocks between blank lines. A part is what an answer may rewrite. */
export const planParts = (text: string): ReadonlyArray<string> =>
  text
    .trim()
    .split(/\n[ \t]*\n/u)
    .map((part) => part.trim())
    .filter(Boolean);

const STOP_WORDS = new Set(
  "the and for with from that this these those into onto each one two use uses using only also all any not but per our you your their its are was were will can has have had via than then more most less over under about after before small simple plain basic first new other own same".split(
    " ",
  ),
);

const wordsOf = (text: string): ReadonlySet<string> =>
  new Set(
    (text.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}+#]*/gu) ?? []).filter(
      (word) => word.length >= 3 && !STOP_WORDS.has(word),
    ),
  );

/**
 * The words that point at this decision: from its title and options, kept only when they are rare
 * in the plan. "class" is in every part of an attendance plan; "sqlite" is where the database is.
 */
function decisionWords(decision: Decision, parts: ReadonlyArray<string>): ReadonlySet<string> {
  const partWords = parts.map(wordsOf);
  const most = Math.max(2, Math.floor(parts.length * 0.4));
  const candidates = wordsOf([decision.title, decision.picked, ...decision.options].join(" "));
  return new Set(
    [...candidates].filter((word) => {
      const seen = partWords.filter((words) => words.has(word)).length;
      return seen > 0 && seen <= most;
    }),
  );
}

const mentions = (text: string, words: ReadonlySet<string>) =>
  [...wordsOf(text)].some((word) => words.has(word));

/** The plan parts and tasks an answer on this decision may rewrite: the ones that mention it. */
export function touchedBy(
  decision: Decision,
  written: WrittenPlan,
): { readonly parts: ReadonlyArray<number>; readonly tasks: ReadonlyArray<number> } {
  const parts = planParts(written.plan);
  const words = decisionWords(decision, parts);
  const indexes = <T>(items: ReadonlyArray<T>, text: (item: T) => string) =>
    items.flatMap((item, index) => (mentions(text(item), words) ? [index] : []));
  return {
    parts: indexes(parts, (part) => part),
    tasks: indexes(written.tasks, (task) => `${task.title} ${task.area} ${task.folders.join(" ")}`),
  };
}

const firstWords = (text: string) => {
  const words = text.replace(/^[#*\s-]+/u, "").split(/\s+/u);
  return words.length > 6 ? `${words.slice(0, 6).join(" ")}…` : words.join(" ");
};

/** A part's name for "what changed": its section heading, or its first words. */
function partLabel(parts: ReadonlyArray<string>, index: number): string {
  for (let at = index; at >= 0; at--) {
    const heading = /^#{1,4}\s+(.+)$/mu.exec(parts[at] ?? "")?.[1];
    if (heading !== undefined) return heading.trim();
  }
  return firstWords(parts[index] ?? "");
}

/** The plan after an answer: only parts and tasks that were sent may change; anything else is ignored. */
export function applyAnswer(
  written: WrittenPlan,
  sent: ReturnType<typeof touchedBy>,
  reply: Pick<PushBackReply, "parts" | "tasks">,
): { readonly written: WrittenPlan; readonly updated: ReadonlyArray<string> } {
  const parts = [...planParts(written.plan)];
  const changedParts = new Set<number>();
  for (const { index, text } of reply.parts) {
    const next = text.trim();
    if (!sent.parts.includes(index) || next === "" || next === parts[index]) continue;
    parts[index] = next;
    changedParts.add(index);
  }
  const tasks = [...written.tasks];
  const changedTasks: PlanTask[] = [];
  for (const { index, task } of reply.tasks) {
    const before = tasks[index];
    if (!sent.tasks.includes(index) || before === undefined) continue;
    if (JSON.stringify(before) === JSON.stringify(task)) continue;
    tasks[index] = task;
    changedTasks.push(task);
  }
  const labels = [
    ...new Set([...changedParts].toSorted((a, b) => a - b).map((i) => partLabel(parts, i))),
  ];
  return {
    written: { ...written, plan: parts.join("\n\n"), tasks },
    updated: [
      ...labels,
      ...(changedTasks.length === 0
        ? []
        : [
            changedTasks.length === 1
              ? `task "${changedTasks[0]!.title}"`
              : `${changedTasks.length} tasks`,
          ]),
    ],
  };
}

export type DecisionAsk =
  | { readonly kind: "push-back"; readonly message: string }
  | { readonly kind: "pick"; readonly option: string };

/** "React" and "React, a JavaScript library for screens" name the same option. */
function sameOption(a: string, b: string): boolean {
  const [x, y] = [a.trim().toLowerCase(), b.trim().toLowerCase()];
  const [short, long] = x.length <= y.length ? [x, y] : [y, x];
  return (
    long === short || (long.startsWith(short) && /^\s*[,(:;—–-]/u.test(long.slice(short.length)))
  );
}

/** The pick first, then every other option once: "Also looked at" never repeats the pick. */
function optionsAround(picked: string, ...lists: ReadonlyArray<ReadonlyArray<string>>) {
  const options = [picked];
  for (const option of lists.flat()) {
    if (!options.some((kept) => sameOption(kept, option))) options.push(option);
  }
  return options;
}

export const agreed = (record: DecisionRecord): DecisionRecord =>
  record.status === "against-advice" ? record : { ...record, status: "agreed" };

/** The decision after the writer's answer, with "How we got here" extended. */
export function answered(input: {
  readonly record: DecisionRecord;
  readonly ask: DecisionAsk;
  readonly reply: PushBackReply;
  readonly by: string;
  readonly writer: string;
  readonly updated: ReadonlyArray<string>;
}): DecisionRecord {
  const { record, ask, reply } = input;
  // The decision keeps its title, so a saved decision file is found again by it.
  const decision = { ...reply.decision, title: record.decision.title };
  const options = (picked: string) =>
    optionsAround(picked, record.decision.options, reply.decision.options);
  if (ask.kind === "push-back") {
    const changed = reply.verdict === "change" && decision.picked !== record.decision.picked;
    return {
      ...record,
      decision: changed ? { ...decision, options: options(decision.picked) } : record.decision,
      status: "answered",
      advice: changed ? "" : record.advice,
      risk: changed ? "" : record.risk,
      history: [
        ...record.history,
        { kind: "pushed-back", by: input.by, text: ask.message, updated: [] },
        {
          kind: changed ? "changed" : "defended",
          by: input.writer,
          text: reply.answer,
          updated: changed ? input.updated : [],
        },
      ],
    };
  }
  const advice = record.advice || record.decision.picked;
  const backToAdvice = ask.option === advice;
  return {
    ...record,
    decision: { ...decision, picked: ask.option, options: options(ask.option) },
    status: backToAdvice ? "agreed" : "against-advice",
    advice: backToAdvice ? "" : advice,
    risk: backToAdvice ? "" : reply.risk.trim(),
    history: [
      ...record.history,
      {
        kind: "picked",
        by: input.by,
        text: backToAdvice
          ? `${ask.option}, the advice again.`
          : `${ask.option}, against the advice (${advice}).`,
        updated: input.updated,
      },
    ],
  };
}

/** A plan saves only when none is left: every decision is agreed to, answered or picked. */
export const openDecisions = (decisions: ReadonlyArray<DecisionRecord>) =>
  decisions.filter((record) => record.status === "open");

/** The run with one decision replaced and the plan text or tasks an answer rewrote. */
export const withDecision = (
  result: PlanResult,
  record: DecisionRecord,
  written: WrittenPlan = result.plan,
): PlanResult => ({
  ...result,
  plan: written,
  decisions: result.decisions.map((candidate) =>
    candidate.number === record.number ? record : candidate,
  ),
});
