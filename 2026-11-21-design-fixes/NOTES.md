# 2026-11-21 — Design review fixes (after)

Before: `2026-11-21-design-review/` (main c4d0d7353e). After: main bad1f514c4 plus the part 2 changes
committed right after these pictures. Dev server, `~/.t3-dev-review`, headless Chromium 1440 × 900
(picture 6: 900 × 900), Elbo theme, simple mode on.

1. `1-long-chat-light.png` (before: 07): the chat now ends above the message box (no text under or
   below it); sidebar rows show title, project and status only; "Needs you"; the running chat in
   "Working"; model chip "Codex · Luna"; plan card "Plan: 1 file · Sara is working on it", "Sara is
   editing"; warning card "Sara is editing a file in this plan"; no "≡" minimap beside the chat.
2. `2-long-chat-dark.png` (before: 08): same in dark; "Working" is Elbo's accent (light grey, dimmed
   like every working row), no longer upstream's blue.
3. `3-access-menu-light.png` (before: 29): the access menu as a list with names and one-line
   descriptions; a new chat starts on "Ask before commands"; Full access is one click away. The
   strip under the box has only "⋯" (no "Team · synced"); no "or start without a project".
4. `4-team-home-light.png` (before: 11): catch-up as bullets, "Working on …", "In progress",
   "Own branch, not merged yet", Merging in one line.
5. `5-settings-simple-dark.png` (before: 20): simple mode shows General, Appearance, Check my setup
   and About, with "Show advanced settings"; "Chat notifications"; Simple mode's new description;
   no "boring sidebar in Labs" sentence.
6. `6-narrow-900-light.png` (before: 40): at 900 px the chat list folds away; the rail's "Chats"
   opens it, picking a chat folds it again; widening brings it back. Plan card "free".

Also checked live, no picture: the first message in a new team chat sent with no branch message
(new branch `elbo/run-sleep-command`); toast "Chat finished · … · Open chat"; palette placeholder
"Search commands, projects, and chats...", "Find in this chat", "Copy chat", "Link a pull request to
this chat", "Recent chats", triage line naming T3 Code as where reports go; tooltips "Show or hide
the terminal", "Show or hide files and changes", teammates' names on the header chip; About
"1.0.0 (dev build)"; themes "Classic" and "Rose"; "Menu opacity"; Today: one "Notes to future you",
"Tell the AI too", "Idle", Merging one line; Check my setup "AI" and "Tools"; "Show advanced
settings" on shows every section again, off shows the 4.
