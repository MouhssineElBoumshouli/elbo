# 2026-11-21 — glass W9 check on real Windows, and the new composer row

`main` commit: f74c25bd6a (pictures 1–4 come from a test build of that code, run unpacked from
`%TEMP%\elbo-w9\app` with its own `APPDATA` and `T3CODE_HOME` in `%TEMP%`, so the real Elbo's
chats and settings were never touched). Windows 11 23H2 (22631), Transparency effects on.
Behind the window: a test window I drew (orange-blue gradient, gold and green circles,
"BEHIND THE WINDOW" text), so the blur is visible. Window captured from the screen (`shot.ps1`).

1. Frosted (Acrylic), dark, focused. Rail and sidebar show the colors behind, blurred by Windows;
   the chat card is solid. Taken with a 30% sidebar tint; the build ships 45% (tried live:
   calmer, muted text easier to read, still clearly frosted).
2. Frosted (Acrylic), light, focused, 45% tint.
3. Same, unfocused (another window in front): Windows turns it solid neutral grey.
4. Subtle (Mica), dark, focused, 30% tint: only a faint tint from the desktop picture (slightly
   blue, from the wallpaper's own color).
5. Dev server, headless Chromium, plain folder `plain-demo1`, new chat: "Full access ▾" next to the
   model picker, no row under the box. Clicking it opens the four modes.
6. Same in Git repo `team-demo22`: the ⋯ popover with "Machine and worktree" (label renamed from
   "Worktree" after this picture) and "Branch". Picking "Current checkout" inside it stuck.

Not photographed (budget): Mica light, Mica unfocused, the Settings rows (seen working:
"Glass (Windows 11)" switch and "Glass style" with Frosted (Acrylic) / Subtle (Mica)).

Why the old strip looked sharp: the installed .3 build with the Ocean theme, reproduced in the
test copy. The strip at the top of the sidebar was upstream's "Nightly" sidebar artwork (Ocean
and other built-in themes draw it), not the wallpaper. Ocean's dark colors are the navy. Dark Mica
under a 55% sidebar was almost invisible.

GPU while the page scrolls by itself (dummy 400-paragraph chat + 300-row sidebar list, 11 s,
Windows counters `GPU Engine(*engtype_3D)`, `gpu.ps1` + `scroll.js`):
- glass off: Elbo 13.9 %, dwm 7.5 %, 60 fps
- Mica: Elbo 7.7 %, dwm 9.9 %, 60 fps
- Acrylic: Elbo 7.6 %, dwm 8.2–9.2 %, 60 fps (two runs)
- idle (no scrolling), all three: Elbo 0.0 %, dwm under 1 %
Glass off, dark, Elbo theme, pixel colors: rail #121212, sidebar #171616, chat #1c1c1c (neutral).
