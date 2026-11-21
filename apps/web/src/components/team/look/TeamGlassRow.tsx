// team-layer: Settings → Appearance → Glass (Windows 11); hidden where glass isn't offered.
import { SettingsRow } from "../../settings/settingsLayout";
import { Switch } from "../../ui/switch";
import {
  setTeamGlass,
  teamGlassOffered,
  useTeamGlass,
  useTeamReducedTransparency,
} from "./windowGlass";

export function TeamGlassRow() {
  const on = useTeamGlass();
  const reduced = useTeamReducedTransparency();
  if (!teamGlassOffered()) return null;
  return (
    <SettingsRow
      title="Glass (Windows 11)"
      description={
        on && reduced
          ? "Windows' transparency effects are off, so the window stays solid. Turn them on in Windows Settings → Personalization → Colors."
          : "Your desktop picture shows softly behind the sidebar. The chat stays solid, and so does the whole window when it isn't in front. This device only."
      }
      control={<Switch checked={on} onCheckedChange={setTeamGlass} aria-label="Glass" />}
    />
  );
}
