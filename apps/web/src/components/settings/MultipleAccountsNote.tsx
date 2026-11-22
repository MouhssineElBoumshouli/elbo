import { useAtomValue } from "@effect/atom-react";
import type { EnvironmentId, ProviderDriverKind } from "@t3tools/contracts";
import { InfoIcon } from "lucide-react";

import { serverEnvironment } from "../../state/server";
import { Alert, AlertDescription } from "../ui/alert";
import { APP_DISPLAY_NAME } from "~/branding"; // team-layer

const PROVIDER_NAMES = new Map<string, string>([
  ["codex", "Codex"],
  ["claudeAgent", "Claude"],
]);

/** Shown while adding a Claude or Codex account when the environment already has one signed in. */
export function MultipleAccountsNote({
  environmentId,
  driver,
}: {
  readonly environmentId: EnvironmentId;
  readonly driver: ProviderDriverKind;
}) {
  const providers = useAtomValue(serverEnvironment.providersValueAtom(environmentId));
  const providerName = PROVIDER_NAMES.get(driver);
  const hasSignedInAccount =
    providerName !== undefined &&
    providers?.some(
      (provider) => provider.driver === driver && provider.auth.status === "authenticated",
    );
  if (!hasSignedInAccount) return null;
  return (
    <Alert variant="info" role="note">
      <InfoIcon aria-hidden />
      <AlertDescription>
        {/* team-layer: Elbo supports a second account for when one runs out. */}
        <p>
          You can add a second {providerName} account for when one runs out. {APP_DISPLAY_NAME} will
          ask before it switches a chat to it.
        </p>
      </AlertDescription>
    </Alert>
  );
}
