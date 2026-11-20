// team-layer: Settings → General → Simple mode, the second way in and out of simple mode.
import { SettingsRow } from "../../settings/settingsLayout";
import { Switch } from "../../ui/switch";
import { setTeamSimpleMode, useTeamSimpleMode } from "./simpleMode";

export function TeamSimpleModeRow() {
  const on = useTeamSimpleMode();
  return (
    <SettingsRow
      title="Simple mode"
      description="Under a new chat, show only the team state and what the AI may do. Worktree and branch choices wait behind “More options”. This device only."
      control={<Switch checked={on} onCheckedChange={setTeamSimpleMode} aria-label="Simple mode" />}
    />
  );
}
