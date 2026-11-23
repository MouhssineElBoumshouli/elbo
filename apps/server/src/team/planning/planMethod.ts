import * as Effect from "effect/Effect";
import type * as Schema from "effect/Schema";

import { type PlanBrief, totalHours } from "./planBrief.ts";
import { overWordLimit, type PlanSize, suggestSize, wordCount } from "./planLimits.ts";
import { fixPrompt, reviewPrompt, shortenPrompt, writerPrompt } from "./planPrompts.ts";
import { renderPlan } from "./planRender.ts";
import {
  checkProblems,
  fixedBlocker,
  logAnswers,
  MAX_ROUNDS,
  numberDecisions,
  toFix,
} from "./planReview.ts";
import {
  FixReply,
  type LogEntry,
  type PlanResult,
  Review,
  type ReviewRound,
  WrittenPlan,
} from "./planSchemas.ts";

export interface StepRequest<S extends Schema.Top> {
  /** e.g. `review:2`; names the turn in logs, usage rows and test fakes. */
  readonly step: string;
  readonly prompt: string;
  readonly schema: S;
  /** For a fix turn: how many points the writer fixes, for the progress line. */
  readonly points?: number | undefined;
}

/** One model turn. The runner backs it with a provider; tests back it with fixed outputs. */
export type Ask<E> = <S extends Schema.Top>(
  request: StepRequest<S>,
) => Effect.Effect<S["Type"], E, S["DecodingServices"]>;

/**
 * One writer, reviewed by a different AI (like the council and sol-loop skills): write, review,
 * fix blockers and shoulds, and review again only after a fixed blocker, for at most 3 rounds.
 */
export const runMethod = Effect.fn("planning.runMethod")(function* <E, F>(input: {
  readonly brief: PlanBrief;
  readonly write: Ask<E>;
  readonly review: Ask<F>;
  /** e.g. "codex gpt-6-astra"; recorded in the result. */
  readonly writer: string;
  readonly reviewer: string;
  readonly sameProvider: boolean;
  readonly size?: PlanSize | undefined;
}) {
  const { brief } = input;
  const size =
    input.size ?? suggestSize(brief.people.length, totalHours(brief), brief.deadlineDays);
  const page = (written: WrittenPlan) =>
    renderPlan(written, numberDecisions(written.decisions, size));

  let written = yield* input.write({
    step: "write",
    prompt: writerPrompt(brief, size),
    schema: WrittenPlan,
  });
  const rounds: ReviewRound[] = [];
  const log: LogEntry[] = [];
  let stopReason = `Stopped after ${MAX_ROUNDS} review rounds.`;

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const markdown = page(written);
    const review = yield* input.review({
      step: `review:${round}`,
      prompt: reviewPrompt({ brief, markdown, written, round, log }),
      schema: Review,
    });
    rounds.push({
      round,
      score: review.score,
      words: wordCount(markdown),
      problems: review.problems,
    });
    const problems = [...toFix(review.problems), ...checkProblems(markdown, size)];
    if (problems.length === 0) {
      stopReason = `Stopped after round ${round}: only nits left.`;
      break;
    }
    const reply = yield* input.write({
      step: `fix:${round}`,
      points: problems.length,
      prompt: fixPrompt({ brief, size, written, problems, words: wordCount(markdown) }),
      schema: FixReply,
    });
    written = reply.plan;
    const answered = logAnswers(round, problems, reply.answers);
    log.push(...answered);
    if (!fixedBlocker(answered)) {
      stopReason = `Stopped after round ${round}: no blocker was fixed, so no new review.`;
      break;
    }
  }

  const before = page(written);
  const shortened = overWordLimit(before, size)
    ? yield* input.write({
        step: "shorten",
        prompt: shortenPrompt({ size, written, words: wordCount(before) }),
        schema: WrittenPlan,
      })
    : undefined;
  const plan = shortened ?? written;
  const result: PlanResult = {
    size,
    writer: input.writer,
    reviewer: input.reviewer,
    sameProvider: input.sameProvider,
    plan,
    decisions: numberDecisions(plan.decisions, size),
    rounds,
    log,
    stopReason,
    wordsBeforeShorten: shortened ? wordCount(before) : 0,
  };
  return result;
});
