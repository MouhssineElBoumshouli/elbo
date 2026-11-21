# Calm cleanup round (slice 3 follow-up)

Before: `2026-11-20-elbo-look/3-after-chat-light.png` and `5-after-chat-dark.png` (main 6763a6fcf0, same code as e6ffa78a51): teal accent, green-tinted greys, two orange "MCP server is not logged in" lines, details panel open, "Settled", icon row, "T3" glyph on "Chose: find another way".
After: main 7e328407cc. Dev server, `~/.t3-dev`, headless Chromium 1440 × 900.

- `1-after-chat-light.png`: the same team-demo22 chat in light: neutral greys, near-black accent, details panel closed, "Changes" toggle (no longer overlapping the "synced" chip), Elbo "e" on "Chose: find another way", "Done 54", no icon row in the sidebar.
- `2-after-chat-dark-changes-open.png`: dark, after clicking "Changes": the panel opens. The two orange lines are now one grey line, "Codex tools “notion” and “app-6ab…” need sign-in. Fix in Setup". These come from the chat's history (recorded before the server change), so old chats replay calm too.
- `3-after-plain-folder-more-options-light.png`: a new chat in a plain folder (`~/code/plain-demo1`, not Git) after "More options": the access picker ("Full access") and "Fewer options". With simple mode off, upstream's words, icon row and details panel come back.
- `4-after-splash.png`: the startup splash with Elbo's mark instead of T3's icon.
- `5-after-setup-dark.png`: Check my setup in dark: Claude, Codex (OpenAI mark), Git and GitHub logos instead of letters; neutral "All set" box; green only on the "Ready" pills.

Also checked without pictures: in a Git repo (team-demo22) More options shows New worktree, branch "From main (remote)", "Full access" and Fewer options; Fewer options returns to simple mode.
