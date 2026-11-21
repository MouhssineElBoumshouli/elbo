import { describe, expect, it } from "vite-plus/test";

import { desktopUpdateChannelOf } from "./cliRelease.ts";
import { compareSemverVersions } from "./semver.ts";
import {
  teamReleaseDatabaseMigration,
  teamReleaseMigrationMarker,
  teamReleaseVersion,
} from "./teamRelease.ts";

const beta = (date: string, runNumber: number) =>
  teamReleaseVersion({ channel: "beta", date, runNumber, nextVersion: "1.0.0" });

describe("Elbo release versions", () => {
  it("sorts each Beta above the one before, and the Stable above its Betas", () => {
    const ordered = [
      beta("20261121", 1),
      beta("20261121", 2),
      beta("20261121", 10),
      beta("20261122", 3),
      teamReleaseVersion({ channel: "stable", date: "", runNumber: 0, nextVersion: "1.0.0" }),
      teamReleaseVersion({ channel: "beta", date: "20261201", runNumber: 4, nextVersion: "1.0.1" }),
    ];
    for (let index = 1; index < ordered.length; index += 1) {
      expect(compareSemverVersions(ordered[index]!, ordered[index - 1]!)).toBe(1);
    }
  });

  it("puts Betas on upstream's nightly update channel and Stable on latest", () => {
    expect(desktopUpdateChannelOf(beta("20261121", 1))).toBe("nightly");
    expect(desktopUpdateChannelOf("1.0.0")).toBe("latest");
  });

  it("refuses versions the updater could not order", () => {
    expect(() => beta("2026-11-21", 1)).toThrow();
    expect(() => beta("20261121", 0)).toThrow();
    expect(() =>
      teamReleaseVersion({ channel: "stable", date: "", runNumber: 0, nextVersion: "1.0" }),
    ).toThrow();
  });
});

describe("release notes migration marker", () => {
  it("reads back the number it writes, and nothing from notes without one", () => {
    expect(teamReleaseDatabaseMigration(`notes\n\n${teamReleaseMigrationMarker(47)}\n`)).toBe(47);
    expect(teamReleaseDatabaseMigration("plain notes")).toBeUndefined();
    expect(teamReleaseDatabaseMigration(null)).toBeUndefined();
  });
});
