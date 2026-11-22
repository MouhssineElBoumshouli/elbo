// team-layer: a second Codex or Claude account from "Check my setup", without advanced settings. Each
// account signs in to its own folder; Codex shares its settings with the first account and keeps
// only its sign-in apart, like upstream's added ChatGPT accounts.
import {
  ProviderInstanceId,
  type ProviderInstanceConfig,
  type ServerProvider,
} from "@t3tools/contracts";
import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";

import { randomUUID } from "../../../lib/utils";

const NAMES: Readonly<Record<string, string>> = { codex: "Codex", claudeAgent: "Claude" };

export function newAccountInstance(
  provider: ServerProvider,
  providers: ReadonlyArray<ServerProvider>,
  id: string = randomUUID().slice(0, 8),
): { readonly instanceId: ProviderInstanceId; readonly instance: ProviderInstanceConfig } {
  const instanceId = ProviderInstanceId.make(`${provider.driver}_${id}`);
  const count = providers.filter((entry) => entry.driver === provider.driver).length;
  const folder = `~/${TEAM_IDENTITY.homeDirName}/accounts/${instanceId}`;
  return {
    instanceId,
    instance: {
      driver: provider.driver,
      displayName: `${NAMES[provider.driver] ?? provider.driver} account ${count + 1}`,
      enabled: true,
      config:
        provider.driver === "codex"
          ? { enabled: true, shadowHomePath: folder }
          : { enabled: true, homePath: folder },
    },
  };
}
