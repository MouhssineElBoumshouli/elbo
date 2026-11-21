// team-layer: Settings → Appearance → Glass (Windows 11), team/DESIGN_DIRECTION.md section 3. Off
// by default, per device; the style is Frosted (Acrylic) or Subtle (Mica). While it shows, Windows
// draws the material behind a transparent window and <html data-window-material="acrylic|mica">
// lets elbo.css make the window background and sidebar translucent.
import { type TeamWindowMaterial, teamWindowMaterial } from "@t3tools/shared/teamGlass";
import { useSyncExternalStore } from "react";

import { deviceFlag } from "../deviceFlag";

const glass = deviceFlag("elbo:window-glass:v1", () => false);
const frosted = deviceFlag("elbo:window-glass-frosted:v1", () => true);
const REDUCED_TRANSPARENCY = "(prefers-reduced-transparency: reduce)";

const bridge = () =>
  typeof window === "undefined" ? undefined : window.desktopBridge?.teamWindowGlass;

/** Only the desktop app on Windows 11 22H2 and later offers glass. */
export const teamGlassOffered = (): boolean => bridge()?.supported === true;

export const setTeamGlass = glass.set;
export const useTeamGlass = glass.use;
export const setTeamGlassFrosted = frosted.set;
export const useTeamGlassFrosted = frosted.use;

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
  let shown: TeamWindowMaterial | null = null;
  const sync = () => {
    const material = teamWindowMaterial({
      on: glass.read(),
      frosted: frosted.read(),
      supported: true,
      reducedTransparency: reducedTransparency(),
    });
    if (material === shown) return;
    shown = material;
    if (material === "none") delete document.documentElement.dataset.windowMaterial;
    else document.documentElement.dataset.windowMaterial = material;
    void desktop.set(material);
  };
  glass.subscribe(sync);
  frosted.subscribe(sync);
  subscribeReducedTransparency(sync);
  sync();
}
