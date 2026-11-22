import type { ExpertDraft, Merge } from "./planSchemas.ts";

/** Field limits from section 5. Models are told them; this enforces them and records each overrun. */
export const CAPS = {
  summaryLines: 3,
  summaryWords: 60,
  detailsWords: 150,
  whyWords: 60,
  options: 3,
  shortWords: 40,
} as const;

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);

export const wordCount = (text: string) => words(text).length;

interface Capped<A> {
  readonly value: A;
  readonly overruns: ReadonlyArray<string>;
}

function capWords(text: string, limit: number, label: string, overruns: string[]): string {
  const all = words(text);
  if (all.length <= limit) return text.trim();
  overruns.push(`${label}: ${all.length} words, cap ${limit}`);
  return `${all.slice(0, limit).join(" ")} …`;
}

function capSummary(text: string, label: string, overruns: string[]): string {
  const lines = text
    .trim()
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);
  if (lines.length > CAPS.summaryLines) {
    overruns.push(`${label}: ${lines.length} lines, cap ${CAPS.summaryLines}`);
  }
  return capWords(lines.slice(0, CAPS.summaryLines).join("\n"), CAPS.summaryWords, label, overruns);
}

export function capDraft(draft: ExpertDraft, who: string): Capped<ExpertDraft> {
  const overruns: string[] = [];
  const value: ExpertDraft = {
    ...draft,
    parts: draft.parts.map((part) => ({
      ...part,
      summary: capSummary(part.summary, `${who} ${part.section} summary`, overruns),
      details: capWords(
        part.details,
        CAPS.detailsWords,
        `${who} ${part.section} details`,
        overruns,
      ),
    })),
    decisions: draft.decisions.map((decision) => {
      if (decision.options.length > CAPS.options) {
        overruns.push(
          `${who} "${decision.title}": ${decision.options.length} options, cap ${CAPS.options}`,
        );
      }
      return {
        ...decision,
        options: decision.options.slice(0, CAPS.options),
        why: capWords(decision.why, CAPS.whyWords, `${who} "${decision.title}" why`, overruns),
      };
    }),
    checklist: draft.checklist.map((item) => ({
      ...item,
      answer: capWords(item.answer, CAPS.shortWords, `${who} checklist ${item.id}`, overruns),
    })),
  };
  return { value, overruns };
}

export function capMerge(merge: Merge): Capped<Merge> {
  const overruns: string[] = [];
  const value: Merge = {
    ...merge,
    summaries: merge.summaries.map((entry) => ({
      ...entry,
      summary: capSummary(entry.summary, `plan ${entry.section} summary`, overruns),
    })),
  };
  return { value, overruns };
}
