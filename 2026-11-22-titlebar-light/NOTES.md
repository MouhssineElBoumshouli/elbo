# Title bar in light mode

`main` at `2450e6f4c9`. Headless Chromium against `vp run dev --home-dir ~/.t3-dev`, light mode, 480×80 crop of the top-left corner.

The arrows only render in the desktop app, so the page ran with a stand-in `window.desktopBridge` (test-only script, not committed). Glass was simulated by setting `<html data-window-material="mica">`, which is what the real app sets. Windows' own Mica isn't in these pictures; the window behind is plain white.

1. **Before, Classic theme, glass on:** the Beta/Dev art is hidden on glass, but the title, sidebar toggle and arrows stay white, so they disappear.
2. **After, same state:** theme text colours; the back arrow is dark, and forward (disabled, nowhere to go) is muted.
3. **Before, Elbo theme (no art), glass off:** both arrows the same grey, so you can't tell which one works.
4. **After, same state:** back in full text colour, forward muted.

Also checked by computed colours, no pictures: Classic and Elbo, in light and dark, with glass on and off (8 states). With glass off, Classic still uses the white controls on its art (unchanged).
