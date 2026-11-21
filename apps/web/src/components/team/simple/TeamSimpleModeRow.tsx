// team-layer: Settings → General → Simple mode, the second way in and out of simple mode.
import { SettingsRow } from "../../settings/settingsLayout";
import { Switch } from "../../ui/switch";
import { setTeamSimpleMode, useTeamSimpleMode } from "./simpleMode";

export function TeamSimpleModeRow() {
  const on = useTeamSimpleMode();
  return (
    <SettingsRow
      title="Simple mode"
      description="Plain words and fewer controls: a shorter sidebar and settings, and the machine, worktree and branch under “⋯” below the message box. This device only."
      control={<Switch checked={on} onCheckedChange={setTeamSimpleMode} aria-label="Simple mode" />}
    />
  );
}
