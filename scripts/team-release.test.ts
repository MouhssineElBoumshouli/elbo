import { teamReleaseDatabaseMigration } from "@t3tools/shared/teamRelease";
import { describe, expect, it } from "vite-plus/test";

import { teamReleaseMeta, teamReleaseNotes } from "./team-release.ts";

describe("team release", () => {
  it("publishes Betas as prereleases and Stable as the latest release", () => {
    expect(teamReleaseMeta({ channel: "beta", date: "20261121", runNumber: 2 })).toMatchObject({
      tag: expect.stringMatching(/^v\d+\.\d+\.\d+-nightly\.20261121\.2$/),
      prerelease: true,
    });
    expect(teamReleaseMeta({ channel: "stable", date: "", runNumber: 0 })).toMatchObject({
      tag: expect.stringMatching(/^v\d+\.\d+\.\d+$/),
      prerelease: false,
    });
  });

  it("writes notes the channel switch reads the database migration from", () => {
    const notes = teamReleaseNotes({
      channel: "beta",
      installerName: "Elbo-1.0.0-nightly.20261121.2-x64.exe",
      installerSha256: "ab".repeat(32),
      databaseMigration: 96,
    });
    expect(teamReleaseDatabaseMigration(notes)).toBe(96);
  });
});
