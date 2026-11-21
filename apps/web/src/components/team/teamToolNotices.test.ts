import { describe, expect, it } from "vite-plus/test";

import type { TimelineEntry } from "../../session-logic";
import { withTeamToolNotices } from "./teamToolNotices";

const notice = (id: string, label: string, warning = true): TimelineEntry => ({
  id,
  kind: "work",
  createdAt: id,
  entry: {
    id,
    createdAt: id,
    label,
    tone: "info",
    itemType: "system_notice",
    ...(warning ? { sourceActivityKind: "runtime.warning" } : {}),
  },
});

describe("Codex tool sign-in notices", () => {
  it("keeps one quiet line per chat naming every tool, from old and new notices", () => {
    const other = notice("2", "Context compacted", false);
    const entries = [
      notice("1", "The notion MCP server is not logged in. Run `codex mcp login notion`."),
      other,
      notice(
        "3",
        "The app-6ab242dbeb5c8191ba5277534ef0c570 MCP server is not logged in. Run `codex mcp login app-6ab242dbeb5c8191ba5277534ef0c570`.",
      ),
      notice(
        "4",
        "Codex tool “notion” needs sign-in. Sign in or stop using it in Settings → Check my setup.",
        false,
      ),
    ];

    const result = withTeamToolNotices(entries);

    expect(result.map((entry) => entry.id)).toEqual(["1", "2"]);
    const merged = result[0]!;
    if (merged.kind !== "work") throw new Error("expected a work entry");
    expect(merged.entry.label).toBe(
      "Codex tools “notion” and “app-6ab242dbeb5c8191ba5…” need sign-in.",
    );
    expect(merged.entry.teamToolSignIn).toEqual(["notion", "app-6ab242dbeb5c8191ba5277534ef0c570"]);
    expect(merged.entry.sourceActivityKind).toBeUndefined();
    expect(result[1]).toBe(other);
  });

  it("leaves a chat without them as it is", () => {
    const entries = [notice("1", "Context compacted", false)];
    expect(withTeamToolNotices(entries)).toBe(entries);
  });
});
