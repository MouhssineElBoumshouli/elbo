// team-layer: "Some requests are slow" is for developers. Elbo hides it unless this per-device
// switch in Settings → Diagnostics is on.
import * as Schema from "effect/Schema";

import { readLocalStorageValue, useLocalStorage } from "../../hooks/useLocalStorage";
import { SettingsRow, SettingsSection } from "../settings/settingsLayout";
import { Switch } from "../ui/switch";

const SLOW_REQUEST_WARNINGS_KEY = "elbo:slow-request-warnings";

/** Read at each warning, so turning the switch on or off applies at once. */
export const slowRequestWarningsEnabled = () =>
  readLocalStorageValue(SLOW_REQUEST_WARNINGS_KEY, false, Schema.Boolean);

export function TeamDeveloperNoticesSection() {
  const [enabled, setEnabled] = useLocalStorage(SLOW_REQUEST_WARNINGS_KEY, false, Schema.Boolean);
  return (
    <SettingsSection title="For developers">
      <SettingsRow
        title="Warn about slow requests"
        description="Show a notice when a request to this computer takes longer than 15 seconds."
        control={
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => setEnabled(Boolean(checked))}
            aria-label="Warn about slow requests"
          />
        }
      />
    </SettingsSection>
  );
}
