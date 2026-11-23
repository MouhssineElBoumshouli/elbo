// team-layer: telling AI tools about a saved plan (team/PLANNING_FEATURE_PLAN.md section 7). Codex
// and most agents read AGENTS.md; Claude Code reads CLAUDE.md, which imports AGENTS.md with one
// line (https://code.claude.com/docs/en/memory). Elbo owns only its marked section in each file.

export const AGENTS_FILE = "AGENTS.md";
export const CLAUDE_FILE = "CLAUDE.md";
const PLAN_START = "<!-- elbo:plan:start -->";
const PLAN_END = "<!-- elbo:plan:end -->";
const IMPORT_START = "<!-- elbo:agents:start -->";
const IMPORT_END = "<!-- elbo:agents:end -->";
/** Rules past this many are left to the rulebook, so the section stays about 15 lines. */
const MAX_RULES = 8;

/** Elbo's section: that there is a plan, the active code rules, and where the rest is. */
export function planAgentsSection(rules: ReadonlyArray<string>): string {
  const shown = rules.slice(0, MAX_RULES);
  const more = rules.length - shown.length;
  return [
    PLAN_START,
    "## Project plan",
    "",
    "This project has a plan in `.team/plan.md` and its decisions in `.team/decisions/`. Read the plan before big changes; don't go against an active decision without asking.",
    ...(shown.length > 0
      ? [
          "",
          "Code rules:",
          ...shown.map((rule) => `- ${rule}`),
          ...(more > 0 ? [`- …and ${more} more in \`.team/rulebook.md\`.`] : []),
        ]
      : []),
    PLAN_END,
  ].join("\n");
}

function withSection(existing: string | null, section: string, start: string, end: string) {
  if (existing === null || existing.trim() === "") return `${section}\n`;
  const from = existing.indexOf(start);
  const to = existing.indexOf(end, from);
  if (from >= 0 && to >= 0) {
    return `${existing.slice(0, from)}${section}${existing.slice(to + end.length)}`;
  }
  return `${existing.replace(/\s*$/u, "")}\n\n${section}\n`;
}

/** AGENTS.md with Elbo's section added or replaced; everything else in the file stays as it was. */
export const mergeAgentsFile = (existing: string | null, rules: ReadonlyArray<string>) =>
  withSection(existing, planAgentsSection(rules), PLAN_START, PLAN_END);

const IMPORTS_AGENTS = /^\s*@(?:\.\/)?AGENTS\.md\s*$/mu;

/** CLAUDE.md that imports AGENTS.md; null when it already does. */
export function mergeClaudeFile(existing: string | null): string | null {
  if (existing === null || existing.trim() === "") return "@AGENTS.md\n";
  if (IMPORTS_AGENTS.test(existing)) return null;
  return `${IMPORT_START}\n@AGENTS.md\n${IMPORT_END}\n\n${existing}`;
}

/** The person's own lines in AGENTS.md and CLAUDE.md: Elbo's sections and the import left out. */
export function ownInstructionLines(files: ReadonlyArray<string | null>): ReadonlyArray<string> {
  return files.flatMap((text) => {
    if (text === null) return [];
    const own = [
      [PLAN_START, PLAN_END],
      [IMPORT_START, IMPORT_END],
    ].reduce((rest, [start, end]) => {
      const from = rest.indexOf(start!);
      const to = rest.indexOf(end!, from);
      return from >= 0 && to >= 0 ? rest.slice(0, from) + rest.slice(to + end!.length) : rest;
    }, text);
    return own
      .split("\n")
      .map((line) => line.replace(/^\s*(?:[-*+]|\d+\.)\s+/u, "").trim())
      .filter((line) => line !== "" && !line.startsWith("#") && !IMPORTS_AGENTS.test(line));
  });
}

/** The person's own lines for the planning brief, in order, cut at about `maxChars`. */
export function projectRulesForBrief(
  ownLines: ReadonlyArray<string>,
  maxChars = 1_200,
): ReadonlyArray<string> {
  const kept: string[] = [];
  let used = 0;
  for (const line of ownLines) {
    if (used + line.length > maxChars) break;
    kept.push(line);
    used += line.length;
  }
  return kept;
}

const NEGATIVE =
  /\b(?:never|don't|do not|doesn't|no|not|avoid|without|stop|forbidden|must not)\b/iu;
const IGNORED = new Set(
  "the and for with from that this use uses using all any every only also into your our are was be is it in on of to a an or as by at do".split(
    " ",
  ),
);
const termsOf = (line: string) =>
  new Set(
    (line.toLowerCase().match(/[\p{L}\p{N}][\p{L}\p{N}.+#-]*/gu) ?? [])
      .map((word) => word.replace(/[.-]+$/u, ""))
      .filter((word) => word.length >= 3 && !IGNORED.has(word) && !NEGATIVE.test(word)),
  );

const namedIn = (line: string, term: string) => {
  const at = line.toLowerCase().indexOf(term);
  return at >= 0 && /\p{Lu}/u.test(line.slice(at, at + term.length));
};

/** "Use SQLite; write no raw SQL." is two claims, one each way; each is compared on its own. */
const clausesOf = (line: string) =>
  line
    .split(/[;:.,]\s+|\s+(?:but|while|because)\s+/iu)
    .map((clause) => clause.trim())
    .filter(Boolean);

/**
 * A plan rule that says the opposite of one of the person's own lines about the same thing:
 * "Use React for the page." against "Never use React.". Claude may follow either side of a
 * contradiction, so such a rule is shown in the save preview instead of written.
 */
export function ruleConflict(rule: string, ownLines: ReadonlyArray<string>): string | null {
  const ruleClauses = clausesOf(rule);
  return (
    ownLines.find((line) =>
      clausesOf(line).some((own) =>
        ruleClauses.some((clause) => {
          if (NEGATIVE.test(own) === NEGATIVE.test(clause)) return false;
          const terms = termsOf(clause);
          const shared = [...termsOf(own)].filter((term) => terms.has(term));
          // One shared generic word ("code", "files") is not the same subject; a name ("React") is.
          return shared.length >= 2 || shared.some((term) => namedIn(own, term));
        }),
      ),
    ) ?? null
  );
}
