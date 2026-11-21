/**
 * team-layer: Codex's "tool needs sign-in" notices as one quiet line per chat with "Fix in Setup"
 * (team/WINDOWS_RELEASE_PLAN.md, Check my setup). Covers the raw Codex text that chats recorded
 * before the server sent a quiet line, so old chats replay calm too.
 */
import type { TimelineEntry, WorkLogEntry } from "../../session-logic";

const RAW_CODEX_TEXT = /The (.+?) MCP server is not logged in\. Run `codex mcp login/u;
const QUIET_LINE = /^Codex tool “(.+?)” needs sign-in/u;
const NAME_MAX = 24;

/** The tool a sign-in notice is about, or null for any other entry. */
function teamToolSignInName(entry: WorkLogEntry): string | null {
  if (entry.itemType !== "system_notice") return null;
  return (RAW_CODEX_TEXT.exec(entry.label) ?? QUIET_LINE.exec(entry.label))?.[1] ?? null;
}

const shortName = (name: string) =>
  name.length > NAME_MAX ? `${name.slice(0, NAME_MAX - 1)}…` : name;

function teamToolSignInLabel(names: ReadonlyArray<string>): string {
  const quoted = names.map((name) => `“${shortName(name)}”`);
  return quoted.length === 1
    ? `Codex tool ${quoted[0]} needs sign-in.`
    : `Codex tools ${quoted.slice(0, -1).join(", ")} and ${quoted.at(-1)} need sign-in.`;
}

/** The first sign-in notice names every tool; the others leave. The same array when there are none. */
export function withTeamToolNotices(
  entries: ReadonlyArray<TimelineEntry>,
): ReadonlyArray<TimelineEntry> {
  const names: Array<string> = [];
  let firstIndex = -1;
  entries.forEach((entry, index) => {
    const name = entry.kind === "work" ? teamToolSignInName(entry.entry) : null;
    if (name === null) return;
    if (firstIndex === -1) firstIndex = index;
    if (!names.includes(name)) names.push(name);
  });
  if (firstIndex === -1) return entries;
  return entries.flatMap((entry, index): ReadonlyArray<TimelineEntry> => {
    if (entry.kind !== "work" || teamToolSignInName(entry.entry) === null) return [entry];
    if (index !== firstIndex) return [];
    const { sourceActivityKind: _warning, ...quiet } = entry.entry;
    return [
      { ...entry, entry: { ...quiet, label: teamToolSignInLabel(names), teamToolSignIn: names } },
    ];
  });
}
