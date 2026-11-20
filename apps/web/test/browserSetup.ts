import { beforeEach } from "vite-plus/test";
import { commands } from "vite-plus/test/browser";

import { initializeI18n } from "../src/i18n/initializeI18n";
import { TEAM_SIMPLE_MODE_DEFAULT } from "../src/components/team/simple/simpleMode";

// team-layer: upstream's browser tests cover upstream's full composer, not Elbo's simple mode.
TEAM_SIMPLE_MODE_DEFAULT.on = false;

declare module "vite-plus/test/browser" {
  interface BrowserCommands {
    /** Defined in vite.config.ts. Moves Playwright's mouse off the page. */
    resetPointer: () => Promise<void>;
  }
}

// Playwright's mouse outlives each test and each file, so whatever the next test mounts
// under its last position starts hovered. Registered here rather than in render() so tests
// that mount without it are covered too. Before each test, not after: a timed-out test keeps
// running and can move the mouse after its own afterEach.
beforeEach(async () => {
  await commands.resetPointer();
});

// The app initializes GT at startup; components using its hooks need the same here.
initializeI18n(() => {});
