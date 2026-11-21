// team-layer: Elbo's release rules, shared by scripts/team-release.ts (the release workflow) and the
// server, which reads Elbo's GitHub Releases instead of T3 Code's npm package.
import { TEAM_IDENTITY } from "./teamIdentity.ts";

export type TeamReleaseChannel = "beta" | "stable";

/** Upstream's update channels keep their names underneath; only the words people see change. */
export const TEAM_CHANNEL_LABELS = { latest: "Stable", nightly: "Beta" } as const;

/**
 * Beta keeps upstream's nightly version shape so the updater needs no changes: within one base
 * version the date, then the run number, sort each Beta above the one before. Stable is the base.
 */
export function teamReleaseVersion(input: {
  readonly channel: TeamReleaseChannel;
  readonly date: string;
  readonly runNumber: number;
  readonly nextVersion?: string;
}): string {
  const base = input.nextVersion ?? TEAM_IDENTITY.nextVersion;
  if (!/^\d+\.\d+\.\d+$/.test(base)) throw new Error(`Invalid Elbo version '${base}'.`);
  if (input.channel === "stable") return base;
  if (!/^\d{8}$/.test(input.date)) throw new Error(`Invalid release date '${input.date}'.`);
  if (!Number.isInteger(input.runNumber) || input.runNumber < 1) {
    throw new Error(`Invalid run number '${input.runNumber}'.`);
  }
  return `${base}-nightly.${input.date}.${input.runNumber}`;
}

const MIGRATION_MARKER = /<!-- elbo-release database-migration=(\d+) -->/;

/** Hidden in the release notes: the channel switch needs it to know a release reads the database. */
export function teamReleaseMigrationMarker(databaseMigration: number): string {
  return `<!-- elbo-release database-migration=${databaseMigration} -->`;
}

export function teamReleaseDatabaseMigration(body: string | null | undefined): number | undefined {
  const match = body ? MIGRATION_MARKER.exec(body) : null;
  return match?.[1] === undefined ? undefined : Number(match[1]);
}
