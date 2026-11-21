// team-layer: Mica behind the main window on Windows 11 (team/DESIGN_DIRECTION.md section 3). The
// page asks for it (Settings → Appearance → Glass) and keeps its chat column opaque; the material
// only shows through a transparent window background. Unfocused, Windows draws it solid itself.
import * as HostProcess from "@t3tools/shared/HostProcess";
import { teamGlassSupported } from "@t3tools/shared/teamGlass";
import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";
import * as Electron from "electron";
import * as NodeOS from "node:os";

import * as ElectronTheme from "../electron/ElectronTheme.ts";
import * as DesktopIpc from "../ipc/DesktopIpc.ts";
import { TEAM_SET_WINDOW_GLASS_CHANNEL } from "../ipc/channels.ts";

const glassWindows = new WeakSet<Electron.BrowserWindow>();

/** Theme changes repaint the window background; a glass window keeps it transparent. */
export const teamWindowHasGlass = (window: Electron.BrowserWindow): boolean =>
  glassWindows.has(window);

export const setTeamWindowGlass = DesktopIpc.makeIpcMethod({
  channel: TEAM_SET_WINDOW_GLASS_CHANNEL,
  payload: Schema.Boolean,
  result: Schema.Void,
  handler: Effect.fn("desktop.ipc.team.setWindowGlass")(function* (on, event) {
    if (!teamGlassSupported(yield* HostProcess.Platform, NodeOS.release())) return;
    const window = Electron.BrowserWindow.getAllWindows().find(
      (candidate) => candidate.webContents.id === event?.sender.id,
    );
    if (window === undefined || window.isDestroyed()) return;
    if (on) {
      glassWindows.add(window);
      window.setBackgroundMaterial("mica");
      window.setBackgroundColor("#00000000");
      return;
    }
    glassWindows.delete(window);
    window.setBackgroundMaterial("none");
    // DesktopWindow's opaque background for the current light or dark mode.
    const dark = yield* (yield* ElectronTheme.ElectronTheme).shouldUseDarkColors;
    window.setBackgroundColor(dark ? "#000000" : "#ffffff");
  }),
});
