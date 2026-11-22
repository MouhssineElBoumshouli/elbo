/**
 * Phrases that only make sense inside the planning session: notes between experts, parts and
 * drafts, a "supplied breakdown". A plan for the team never needs them. Each pattern is narrow on
 * purpose, so "draft the pitch" or "admin panel" pass.
 */
const METHOD_TALK: ReadonlyArray<RegExp> = [
  /\bsupplied (manager|plan|breakdown|drafts?|estimates?|parts?|tasks?|mapping)\b/i,
  /\bbreakdown\b/i,
  /\b(expert|manager|architect|engineer|designer|coach)('s|s'|s)? (drafts?|parts?|breakdown|estimates?|reviews?|notes?)\b/i,
  /\b(the|your|my|their|each|other) drafts?\b/i,
  /\bthe panel\b/i,
  /\bpanel (notes?|reviews?|members?)\b/i,
  /\b(other|another|each) experts?\b/i,
  /\bcross-?review/i,
  /\breplacement mapping\b/i,
  /\bmerged? (plan|parts|tasks)\b/i,
];

/** The lines of a plan that talk about the method instead of the project. */
export function methodTalk(markdown: string): ReadonlyArray<string> {
  return markdown
    .split("\n")
    .filter((line) => METHOD_TALK.some((pattern) => pattern.test(line)))
    .map((line) => line.trim());
}
