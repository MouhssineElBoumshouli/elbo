// team-layer: the main window's preload runs sandboxed, where `require` only finds "electron".
// Any other package it imports must be bundled in, or the preload throws before it exposes
// `desktopBridge` and the page falls back to its elbo:// origin (no backend URL).
export const bundleIntoSandboxedPreload = (id: string): boolean =>
  id === "@clerk/electron" || id.startsWith("@clerk/electron/") || id.startsWith("@t3tools/");
