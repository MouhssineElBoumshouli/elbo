// team-layer: Settings → Appearance → Glass (Windows 11), team/DESIGN_DIRECTION.md section 3. Off
// by default, per device. While it shows, the desktop puts Mica behind a transparent window and
// <html data-window-material="os"> lets elbo.css make the window background and sidebar translucent.
import { teamGlassActive } from "@t3tools/shared/teamGlass";
import { useSyncExternalStore } from "react";

import { deviceFlag } from "../deviceFlag";

const glass = deviceFlag("elbo:window-glass:v1", () => false);
const REDUCED_TRANSPARENCY = "(prefers-reduced-transparency: reduce)";

const bridge = () =>
  typeof window === "undefined" ? undefined : window.desktopBridge?.teamWindowGlass;

/** Only the desktop app on Windows 11 22H2 and later offers glass. */
export const teamGlassOffered = (): boolean => bridge()?.supported === true;

export const setTeamGlass = glass.set;
export const useTeamGlass = glass.use;

function reducedTransparency(): boolean {
  return window.matchMedia(REDUCED_TRANSPARENCY).matches;
}

function subscribeReducedTransparency(listener: () => void) {
  const query = window.matchMedia(REDUCED_TRANSPARENCY);
  query.addEventListener("change", listener);
  return () => query.removeEventListener("change", listener);
}

/** Windows' "Transparency effects" off: glass stays solid, and the setting says why. */
export function useTeamReducedTransparency(): boolean {
  return useSyncExternalStore(subscribeReducedTransparency, reducedTransparency, () => false);
}

/** Keeps the window and the page in step with the choice and Windows' transparency setting. */
export function startTeamWindowGlass(): void {
  const desktop = bridge();
  if (desktop?.supported !== true) return;
  let shown: boolean | null = null;
  const sync = () => {
    const active = teamGlassActive({
      on: glass.read(),
      supported: true,
      reducedTransparency: reducedTransparency(),
    });
    if (active === shown) return;
    shown = active;
    if (active) document.documentElement.dataset.windowMaterial = "os";
    else delete document.documentElement.dataset.windowMaterial;
    void desktop.set(active);
  };
  glass.subscribe(sync);
  subscribeReducedTransparency(sync);
  sync();
}
