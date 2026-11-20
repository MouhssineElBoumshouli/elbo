# Elbo's look: two directions (slice 3, design only)

Static mockups, not the app: `chat.html` and `setup.html`, each with `?look=glass` or `?look=solid`; `look.css` holds both. Screenshots: `test-screenshots` branch, folder `2026-11-20-look/`. Pick one; slice 3 then builds it.

**Both directions share** (this is most of the work, and the same whichever you pick):

- **The rail**: Chats, Team (Today when solo), Setup (an amber dot when something needs you), Settings. Always visible, words under the icons. Today's Team entry in the sidebar header moves into it.
- **Simple mode**, on by default: the composer shows only the agent, what it may do ("Can edit files"), and the team state; runtime, access mode, branch and worktree pickers sit behind "More options". The right panel stays closed until "Changes" is clicked.
- **Plain words**: "Chats", "New chat", "on this computer", "own copy", "Working · 2 files", "Waiting for your answer", "Changes", "Yassine is also editing".
- **Elbo's colors**: the icon's teal `#0f766e` as the one accent (buttons, the active rail entry, focus, your messages); amber only for "needs you"; green only for "ready".
- **Check my setup**: a summary on top ("2 things need you"), rows grouped as AI and Tools, a colored status pill per row, buttons on the right.

## A · Glass (Synara-like)

- **What changes from today:** the desktop picture shows softly through the rail and chat list (Mica on Windows 11), and the chat sits on a floating white card with rounded corners and a soft shadow. Font Figtree (rounder, friendlier), 13.5 px, 12 px corners. Your messages are teal-tinted bubbles.
- **What it costs:** everything shared, plus the window material: a transparent window and `backgroundMaterial: "mica"` in the desktop shell, an `<html data-window-material="os">` switch, translucent colors under it only, and solid colors everywhere else (Windows 10, web, mobile, "Transparency effects" off, an inactive window). This needs the W9 check on your laptop first (title bar overlay, maximized, snapped, inactive, light and dark) and a GPU measurement. About one round more than B, plus a testing round on Windows.
- **Risks:** text on a busy wallpaper (kept readable: the chat card stays about 80% opaque); any GPU cost must be measured; the look differs between a Windows 11 laptop and everything else.

## B · Solid and minimal

- **What changes from today:** flat warm greys (stone instead of T3's cool zinc), white chat area, hairline borders, no shadows. Font Inter, 14 px (a bit larger than today), 8 px corners. The active rail entry has a teal bar on its left; your messages are light grey bubbles.
- **What it costs:** everything shared, and nothing more: no desktop window changes, so it looks the same on Windows 10 and 11, web and macOS. The cheapest to build and to test.
- **Risks:** it can read as "plain"; the identity rests on the teal, the rail and the type.

## How either stays cheap for upstream syncs

- **Colors through upstream's own theme system.** T3 already has built-in themes (`BUILT_IN_THEMES` in `packages/shared/src/themePalettes.ts`: a set of colors plus optional CSS). Elbo adds "Elbo" light and dark themes in our own file and makes them the default: about two `team-layer:` lines in upstream files. Users can still pick another theme.
- **Type, corners and spacing** in one CSS file of our own, loaded after `index.css`, overriding upstream's variables (`--font-sans`, `--radius`, ...). Fonts are bundled with the app (theme CSS may not fetch, and the app must work offline): about 50–100 KB for one variable font.
- **Our own components:** the rail, the setup page (already ours), the simple-mode "More options". Upstream screens are not rewritten.
- **Small marked hooks:** mount the rail in the layout, one condition per hidden control in simple mode, and the word list. Each is one `team-layer:` line, so a sync costs a re-applied line, not a merge of a redesigned file.
- **A on top of B:** glass only adds the window material and translucent values for the same tokens. Building B now and A's material in slice 4 (glass, as the plan already says) loses nothing.
