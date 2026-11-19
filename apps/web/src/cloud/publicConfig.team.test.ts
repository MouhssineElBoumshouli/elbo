import { afterEach, expect, it, vi } from "vite-plus/test";

import { hasCloudPublicConfig } from "./publicConfig.ts";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

it("keeps T3 Connect sign-in off in Elbo even with a full production config", () => {
  vi.stubEnv("VITE_CLERK_PUBLISHABLE_KEY", `pk_live_${btoa("clerk.example.com$")}`);
  vi.stubEnv("VITE_CLERK_JWT_TEMPLATE", "t3-relay");
  vi.stubEnv("VITE_T3CODE_RELAY_URL", "https://relay.example.test");
  vi.stubGlobal("window", { location: new URL("https://example.com") });

  expect(hasCloudPublicConfig()).toBe(false);
});
