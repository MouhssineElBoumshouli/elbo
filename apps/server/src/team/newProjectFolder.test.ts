import { assert, describe, it } from "@effect/vitest";
import * as Effect from "effect/Effect";
import * as Path from "effect/Path";

import { chosenProjectsParent, elboProjectsRoot } from "./newProjectFolder.ts";

describe("new project folder", () => {
  it.effect("defaults to Elbo projects in the person's home, not the app's data folder", () =>
    Effect.gen(function* () {
      const path = yield* Path.Path;
      assert.strictEqual(elboProjectsRoot("/home/sara", "linux", path), "/home/sara/Elbo projects");
      assert.strictEqual(
        elboProjectsRoot("/Users/sara", "win32", path),
        "/Users/sara/Documents/Elbo projects",
      );
      assert.strictEqual(chosenProjectsParent("~/code", "/home/sara", path), "/home/sara/code");
      assert.strictEqual(
        chosenProjectsParent(" /srv/projects/ ", "/home/sara", path),
        "/srv/projects",
      );
      assert.isNull(chosenProjectsParent("code/projects", "/home/sara", path));
    }).pipe(Effect.provide(Path.layer)),
  );
});
