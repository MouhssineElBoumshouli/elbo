// team-layer: an on/off choice kept on this device (localStorage), shared by simple mode, the
// composer's "More options" and glass.
import { useSyncExternalStore } from "react";

export function readDeviceFlag(stored: string | null, fallback: boolean): boolean {
  if (stored === "on") return true;
  if (stored === "off") return false;
  return fallback;
}

export function deviceFlag(key: string, fallback: () => boolean) {
  const listeners = new Set<() => void>();
  const read = (): boolean => {
    try {
      return readDeviceFlag(window.localStorage.getItem(key), fallback());
    } catch {
      return fallback();
    }
  };
  const set = (on: boolean): void => {
    try {
      window.localStorage.setItem(key, on ? "on" : "off");
    } catch {}
    for (const listener of listeners) listener();
  };
  /** Same-tab changes and other windows' changes; returns the unsubscribe. */
  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    const onStorage = (event: StorageEvent) => {
      if (event.key === key) listener();
    };
    // Stores subscribe at module load, which unit tests run without a window.
    globalThis.window?.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      globalThis.window?.removeEventListener("storage", onStorage);
    };
  };
  const use = (): boolean => useSyncExternalStore(subscribe, read, fallback);
  return { read, set, subscribe, use };
}
