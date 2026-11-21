// team-layer: Settings → Appearance → Glass (Windows 11) and its style; hidden where glass isn't
// offered.
import { SettingsRow } from "../../settings/settingsLayout";
import { Select, SelectItem, SelectPopup, SelectTrigger, SelectValue } from "../../ui/select";
import { Switch } from "../../ui/switch";
import {
  setTeamGlass,
  setTeamGlassFrosted,
  teamGlassOffered,
  useTeamGlass,
  useTeamGlassFrosted,
  useTeamReducedTransparency,
} from "./windowGlass";

const STYLE_LABELS = { frosted: "Frosted (Acrylic)", subtle: "Subtle (Mica)" } as const;

export function TeamGlassRow() {
  const on = useTeamGlass();
  const frosted = useTeamGlassFrosted();
  const reduced = useTeamReducedTransparency();
  if (!teamGlassOffered()) return null;
  const style = frosted ? "frosted" : "subtle";
  return (
    <>
      <SettingsRow
        title="Glass (Windows 11)"
        description={
          on && reduced
            ? "Windows' transparency effects are off, so the window stays solid. Turn them on in Windows Settings → Personalization → Colors."
            : "Windows draws a see-through background behind the sidebar. The chat stays solid, and so does the whole window when it isn't in front. This device only."
        }
        control={<Switch checked={on} onCheckedChange={setTeamGlass} aria-label="Glass" />}
      />
      {on ? (
        <SettingsRow
          title="Glass style"
          description="Frosted blurs whatever is behind the window. Subtle only tints with your desktop picture."
          control={
            <div className="w-full sm:w-44">
              <Select
                value={style}
                onValueChange={(value) => setTeamGlassFrosted(value === "frosted")}
              >
                <SelectTrigger size="sm" className="w-full min-w-0" aria-label="Glass style">
                  <SelectValue>{STYLE_LABELS[style]}</SelectValue>
                </SelectTrigger>
                <SelectPopup align="end" alignItemWithTrigger={false}>
                  <SelectItem value="frosted">{STYLE_LABELS.frosted}</SelectItem>
                  <SelectItem value="subtle">{STYLE_LABELS.subtle}</SelectItem>
                </SelectPopup>
              </Select>
            </div>
          }
        />
      ) : null}
    </>
  );
}
