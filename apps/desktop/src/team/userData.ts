import * as Effect from "effect/Effect";
import * as Path from "effect/Path";

import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";

/** Elbo's Electron profile folder. Unlike upstream, there is no T3 Code profile to migrate from or copy. */
export const resolveTeamUserDataPath = Effect.fn("desktop.team.resolveUserDataPath")(
  function* (input: { readonly appDataDirectory: string; readonly isDevelopment: boolean }) {
    const path = yield* Path.Path;
    return path.join(
      input.appDataDirectory,
      input.isDevelopment ? TEAM_IDENTITY.devProfileFolder : TEAM_IDENTITY.profileFolder,
    );
  },
);
