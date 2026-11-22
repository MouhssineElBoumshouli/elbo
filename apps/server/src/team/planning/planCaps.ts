import type { ExpertDraft, Merge } from "./planSchemas.ts";

/**
 * Field limits from section 5. Models are told them; this records each overrun. Text is never
 * cut: a plan over its word budget gets a shorten turn instead (planBudget.ts).
 */
export const CAPS = {
  summaryLines: 3,
  summaryWords: 60,
  detailsWords: 150,
  whyWords: 60,
  options: 3,
  checklistWords: 30,
} as const;

export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

interface Capped<A> {
  readonly value: A;
  readonly overruns: ReadonlyArray<string>;
}

function check(text: string, limit: number, label: string, overruns: string[]) {
  const words = wordCount(text);
  if (words > limit) overruns.push(`${label}: ${words} words, cap ${limit}`);
}

function checkSummary(text: string, label: string, overruns: string[]) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0).length;
  if (lines > CAPS.summaryLines)
    overruns.push(`${label}: ${lines} lines, cap ${CAPS.summaryLines}`);
  check(text, CAPS.summaryWords, label, overruns);
}

/** Records overruns; only whole extra options are dropped. */
export function capDraft(draft: ExpertDraft, who: string): Capped<ExpertDraft> {
  const overruns: string[] = [];
  for (const part of draft.parts) {
    checkSummary(part.summary, `${who} ${part.section} summary`, overruns);
    check(part.details, CAPS.detailsWords, `${who} ${part.section} details`, overruns);
  }
  for (const decision of draft.decisions) {
    if (decision.options.length > CAPS.options) {
      overruns.push(
        `${who} "${decision.title}": ${decision.options.length} options, cap ${CAPS.options}`,
      );
    }
    check(decision.why, CAPS.whyWords, `${who} "${decision.title}" why`, overruns);
  }
  for (const item of draft.checklist) {
    check(item.answer, CAPS.checklistWords, `${who} checklist ${item.id}`, overruns);
  }
  const value: ExpertDraft = {
    ...draft,
    decisions: draft.decisions.map((decision) => ({
      ...decision,
      options: decision.options.slice(0, CAPS.options),
    })),
  };
  return { value, overruns };
}

export function capMerge(merge: Merge): Capped<Merge> {
  const overruns: string[] = [];
  for (const entry of merge.sections) {
    checkSummary(entry.summary, `plan ${entry.section} summary`, overruns);
    check(entry.details, CAPS.detailsWords, `plan ${entry.section} details`, overruns);
  }
  return { value: merge, overruns };
}
