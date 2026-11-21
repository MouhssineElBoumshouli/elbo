// team-layer: Elbo's releases live on the fork's GitHub Releases, not in T3 Code's `t3` npm package,
// so the update track switch asks GitHub which Beta or Stable to move to.
import { ServerNpmReleaseError, ServerNpmReleaseInput } from "@t3tools/contracts";
import { desktopUpdateChannelOf } from "@t3tools/shared/cliRelease";
import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";
import { teamReleaseDatabaseMigration } from "@t3tools/shared/teamRelease";
import * as Cache from "effect/Cache";
import * as Duration from "effect/Duration";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
import { FetchHttpClient, HttpClient, HttpClientResponse } from "effect/http";

import { NpmRelease } from "../cloud/npmRelease.ts";

const GitHubRelease = Schema.Struct({
  tag_name: Schema.String,
  draft: Schema.Boolean,
  prerelease: Schema.Boolean,
  body: Schema.NullOr(Schema.String),
});
type GitHubRelease = typeof GitHubRelease.Type;
const decodeInput = Schema.decodeUnknownEffect(ServerNpmReleaseInput);
const RELEASES_URL = `https://api.github.com/repos/${TEAM_IDENTITY.updateRepository}/releases`;

/** `latest` is the newest Stable, `nightly` the newest Beta, anything else one exact version. */
export function pickTeamRelease(releases: ReadonlyArray<GitHubRelease>, spec: string) {
  for (const release of releases) {
    const version = release.tag_name.replace(/^v/, "");
    if (release.draft || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(version)) continue;
    const matches =
      spec === "latest" || spec === "nightly"
        ? release.prerelease === (spec === "nightly") && desktopUpdateChannelOf(version) === spec
        : version === spec;
    if (!matches) continue;
    const databaseMigration = teamReleaseDatabaseMigration(release.body);
    return { version, ...(databaseMigration === undefined ? {} : { databaseMigration }) };
  }
  return null;
}

const make = Effect.fn("TeamReleases.make")(function* () {
  const http = yield* HttpClient.HttpClient;
  const unreachable = new ServerNpmReleaseError({
    reason: `${TEAM_IDENTITY.name}'s releases on GitHub could not be reached.`,
  });
  const cache = yield* Cache.make({
    capacity: 32,
    timeToLive: Duration.minutes(1),
    lookup: Effect.fn("TeamReleases.lookup")(function* (spec: string) {
      // Unauthenticated GitHub allows 60 calls an hour; one page of the newest releases is enough.
      const releases = yield* http
        .get(RELEASES_URL, {
          urlParams: { per_page: "30" },
          headers: { accept: "application/vnd.github+json" },
        })
        .pipe(
          Effect.flatMap(HttpClientResponse.filterStatusOk),
          Effect.flatMap(HttpClientResponse.schemaBodyJson(Schema.Array(GitHubRelease))),
          Effect.scoped,
          Effect.timeout(Duration.seconds(15)),
          Effect.tapError((error) => Effect.logInfo("Elbo release lookup failed", { error })),
          Effect.mapError(() => unreachable),
        );
      return pickTeamRelease(releases, spec);
    }),
  });
  return NpmRelease.of({
    get: Effect.fn("TeamReleases.get")(function* (input) {
      const { spec } = yield* decodeInput(input).pipe(
        Effect.mapError(
          () => new ServerNpmReleaseError({ reason: "Invalid release version or track." }),
        ),
      );
      return yield* Cache.get(cache, spec);
    }),
  });
});

export const layer = Layer.effect(NpmRelease, make()).pipe(Layer.provide(FetchHttpClient.layer));
