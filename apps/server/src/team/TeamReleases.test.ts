import { teamReleaseMigrationMarker } from "@t3tools/shared/teamRelease";
import { describe, expect, it } from "vite-plus/test";

import { pickTeamRelease } from "./TeamReleases.ts";

const release = (
  tag_name: string,
  prerelease: boolean,
  body: string | null = null,
  draft = false,
) => ({ tag_name, prerelease, draft, body }) as const;

// Newest first, as GitHub lists them.
const releases = [
  release("v1.0.1-nightly.20261130.9", true, null, true),
  release("v1.0.1-nightly.20261129.8", true, teamReleaseMigrationMarker(97)),
  release("pre-upstream-sync-2026-11-28", false),
  release("v1.0.0", false, teamReleaseMigrationMarker(96)),
  release("v1.0.0-nightly.20261121.2", true, "notes from before the marker"),
];

describe("pickTeamRelease", () => {
  it("finds the newest published Beta and Stable with their database migration", () => {
    expect(pickTeamRelease(releases, "nightly")).toEqual({
      version: "1.0.1-nightly.20261129.8",
      databaseMigration: 97,
    });
    expect(pickTeamRelease(releases, "latest")).toEqual({
      version: "1.0.0",
      databaseMigration: 96,
    });
  });

  it("finds one exact version, and nothing for a track with no release yet", () => {
    expect(pickTeamRelease(releases, "1.0.0-nightly.20261121.2")).toEqual({
      version: "1.0.0-nightly.20261121.2",
    });
    expect(pickTeamRelease(releases.slice(4), "latest")).toBeNull();
  });
});
