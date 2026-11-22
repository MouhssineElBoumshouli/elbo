import { ProviderDriverKind, ProviderInstanceId, type ServerProvider } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { newAccountInstance } from "./newAccount";

const provider = (instanceId: string, driver: string) =>
  ({
    instanceId: ProviderInstanceId.make(instanceId),
    driver: ProviderDriverKind.make(driver),
  }) as ServerProvider;

describe("newAccountInstance", () => {
  it("gives each new account its own sign-in folder", () => {
    const codex = provider("codex", "codex");
    const claude = provider("claudeAgent", "claudeAgent");
    expect(newAccountInstance(codex, [codex, claude], "a1b2c3d4")).toEqual({
      instanceId: "codex_a1b2c3d4",
      instance: {
        driver: "codex",
        displayName: "Codex account 2",
        enabled: true,
        config: { enabled: true, shadowHomePath: "~/.elbo/accounts/codex_a1b2c3d4" },
      },
    });
    expect(newAccountInstance(claude, [codex, claude], "e5f6").instance.config).toEqual({
      enabled: true,
      homePath: "~/.elbo/accounts/claudeAgent_e5f6",
    });
  });
});
