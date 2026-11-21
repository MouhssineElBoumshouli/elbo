#!/usr/bin/env node
// @effect-diagnostics nodeBuiltinImport:off - hashes the installer with node:crypto for the notes.
// team-layer: version and release notes for Elbo's own releases (.github/workflows/team-release.yml).
//   node scripts/team-release.ts meta --channel beta --date 20261121 --run-number 3
//   node scripts/team-release.ts notes --channel beta --installer <exe> --output <md>
import * as NodeCrypto from "node:crypto";

import * as NodeRuntime from "@effect/platform-node/NodeRuntime";
import * as NodeServices from "@effect/platform-node/NodeServices";
import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";
import {
  teamReleaseMigrationMarker,
  teamReleaseVersion,
  type TeamReleaseChannel,
} from "@t3tools/shared/teamRelease";
import * as Config from "effect/Config";
import * as Console from "effect/Console";
import * as Effect from "effect/Effect";
import * as FileSystem from "effect/FileSystem";
import * as Option from "effect/Option";
import * as Path from "effect/Path";
import { Command, Flag } from "effect/cli";

const RELEASES_URL = `https://github.com/${TEAM_IDENTITY.updateRepository}/releases`;

export function teamReleaseMeta(input: {
  readonly channel: TeamReleaseChannel;
  readonly date: string;
  readonly runNumber: number;
}) {
  const version = teamReleaseVersion(input);
  const beta = input.channel === "beta";
  return {
    version,
    tag: `v${version}`,
    name: beta ? `${TEAM_IDENTITY.name} Beta ${version}` : `${TEAM_IDENTITY.name} ${version}`,
    prerelease: beta,
  };
}

export function teamReleaseNotes(input: {
  readonly channel: TeamReleaseChannel;
  readonly installerName: string;
  readonly installerSha256: string;
  readonly databaseMigration: number;
}): string {
  const name = TEAM_IDENTITY.name;
  const channelLine =
    input.channel === "beta"
      ? `This is a **Beta**: new things first, maybe rough edges. Already have ${name} on Beta? Click the update button in the app instead.`
      : `This is a **Stable** release. Already have ${name}? Click the update button in the app instead.`;
  return `${channelLine}

## How to install (Windows 10 and 11, 64-bit)

1. Under **Assets** below, download \`${input.installerName}\`.
2. Open it. Windows shows **"Windows protected your PC"**, because ${name} is not code-signed yet. Click **More info**, then **Run anyway**. You only do this once per download.
3. ${name} installs for your user only (no admin needed) and opens. Pick a project folder, connect one AI, start a chat.

**Smart App Control:** if Windows says Smart App Control blocked the app and shows no "Run anyway", your PC has Smart App Control on (Windows Security → App & browser control). It blocks every unsigned app. Turning it off is hard to undo, so ask before you do it.

**Updates:** the app checks this page and shows an update button when a new version is out. Settings → About → Update track picks Stable or Beta.

${name} is based on ${TEAM_IDENTITY.basedOn.name} v${TEAM_IDENTITY.basedOn.version}. It keeps its own data in \`%USERPROFILE%\\${TEAM_IDENTITY.homeDirName}\` and can be installed next to ${TEAM_IDENTITY.basedOn.name}. All releases: ${RELEASES_URL}

SHA-256 of \`${input.installerName}\`: \`${input.installerSha256}\`

${teamReleaseMigrationMarker(input.databaseMigration)}
`;
}

/** Highest server migration id, as scripts/build-npm-launcher.ts reads it for upstream's npm package. */
const latestServerMigrationId = Effect.fn("latestServerMigrationId")(function* () {
  const fs = yield* FileSystem.FileSystem;
  const path = yield* Path.Path;
  const dir = yield* path.fromFileUrl(
    new URL("../apps/server/src/persistence/Migrations/", import.meta.url),
  );
  const ids = (yield* fs.readDirectory(dir)).flatMap((name) => {
    const id = /^(\d+)_\w+\.ts$/.exec(name)?.[1];
    return id === undefined ? [] : [Number(id)];
  });
  return Math.max(0, ...ids);
});

const channel = Flag.Literals("channel", ["beta", "stable"] as const).pipe(
  Flag.withDescription("beta (prerelease) or stable."),
);

const meta = Command.make(
  "meta",
  {
    channel,
    date: Flag.String("date").pipe(Flag.withDefault("")),
    runNumber: Flag.Int("run-number").pipe(Flag.withDefault(0)),
  },
  (input) =>
    Effect.gen(function* () {
      const lines = Object.entries(teamReleaseMeta(input)).map(([key, value]) => `${key}=${value}`);
      const outputPath = yield* Config.option(Config.NonEmptyString("GITHUB_OUTPUT"));
      if (Option.isSome(outputPath)) {
        const fs = yield* FileSystem.FileSystem;
        yield* fs.writeFileString(outputPath.value, `${lines.join("\n")}\n`, { flag: "a" });
      }
      yield* Console.log(lines.join("\n"));
    }),
).pipe(Command.withDescription("Print (and write to GITHUB_OUTPUT) the version, tag and name."));

const notes = Command.make(
  "notes",
  { channel, installer: Flag.String("installer"), output: Flag.String("output") },
  (input) =>
    Effect.gen(function* () {
      const fs = yield* FileSystem.FileSystem;
      const path = yield* Path.Path;
      const text = teamReleaseNotes({
        channel: input.channel,
        installerName: path.basename(input.installer),
        installerSha256: NodeCrypto.createHash("sha256")
          .update(yield* fs.readFile(input.installer))
          .digest("hex"),
        databaseMigration: yield* latestServerMigrationId(),
      });
      yield* fs.writeFileString(input.output, text);
      yield* Console.log(text);
    }),
).pipe(Command.withDescription("Write the Releases page notes for one installer."));

const command = Command.make("team-release").pipe(
  Command.withDescription("Elbo's release version and notes."),
  Command.withSubcommands([meta, notes]),
);

if (import.meta.main) {
  Command.run(command, { version: "0.0.0" }).pipe(
    Effect.provide(NodeServices.layer),
    NodeRuntime.runMain,
  );
}
