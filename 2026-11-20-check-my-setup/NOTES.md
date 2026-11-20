# 2026-11-20 — Check my setup + first start (slice 2)

main commit: ecdd3e0abf. Dev server with `--home-dir ~/.t3-dev` on Linux (WSL), headless Chromium.

- 01-check-my-setup.png — Settings → Check my setup: "Check my setup" is first under Agents; Claude, Codex and Replay (dev) ready, Git installed, GitHub CLI signed in. Clicked "Check again": it showed "Checking…" and came back. Opened it from the command palette too (Ctrl+K → "Check my setup").
- 02-first-start.png — /welcome: three steps. Step 2 shows the same agent rows and is done (one AI ready); "Start a chat" waits for a folder. "More options" opened upstream's welcome page.

Also seen (no picture): Settings → Diagnostics → "For developers" → "Warn about slow requests", off by default.
Not tested live: the signed-out / not-installed rows and the Sign in terminal (no broken provider on this machine), the native folder picker (desktop only), WSL rows (Windows only). These are covered by unit tests and the Windows install test.
