# Windows release plan (VISION.md step 6)

Status: plan only, 2026-11-19. Nothing here is built yet. Based on upstream v0.1.10.

Goal of this stage: classmates install our app on Windows and use it **without learning it**. "Easy" and "light" are main goals, not extras:

- **Easy:** open it, pick a folder, connect one AI, work. When something is broken, the app says what and offers the fix.
- **Light:** starts fast, stays quiet when idle, small install. Our team layer adds almost nothing while nothing happens.

Rule for every slice: our code in our own files, upstream files get one-line `team-layer:` hooks or a switch (UPSTREAM_SYNC.md, "How to keep syncs cheap").

## 1. Our own app identity

Today the build is "T3 Code (Beta)", id `com.t3tools.t3code`, data in `%USERPROFILE%\.t3`, protocol `t3code://`, updates from the repo the build runs in. Installed next to real T3 Code, both would use one database and one install folder. Everything below must differ.

| Thing                                  | Where today                                                                            | Ours                                                                                    |
| -------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Name (window, Start menu, installer)   | `apps/desktop/package.json` `productName`; `DesktopEnvironment.ts` `APP_BASE_NAME`     | The new name                                                                            |
| App id and Windows AppUserModelId      | `build-desktop-artifact.ts` `DESKTOP_APP_ID`; `DesktopEnvironment.ts` `appUserModelId` | `io.github.<you>.<name>` (taskbar pins, notifications and the install folder follow it) |
| T3 home (database, worktrees, secrets) | `DesktopStatePaths.ts`: `~/.t3`                                                        | `~/.<name>`                                                                             |
| Electron profile folder (`%APPDATA%`)  | `DesktopUserData.ts` (`t3code`)                                                        | `<name>`; this also separates the single-instance lock                                  |
| Protocol                               | `ElectronProtocol.ts`: `t3code`, `t3code-dev`; builder `protocols`                     | `<name>`, `<name>-dev`                                                                  |
| Installer file                         | builder `artifactName` `T3-Code-${version}-${arch}`                                    | `<Name>-${version}-${arch}`                                                             |
| Update feed                            | `GITHUB_REPOSITORY` / `T3CODE_DESKTOP_UPDATE_REPOSITORY`                               | Our fork's GitHub Releases (already works by setting the variable)                      |
| Icon                                   | `BRAND_ASSET_PATHS` (production and nightly icons)                                     | Our own `.ico` and PNGs, a nightly-style variant for Beta                               |
| `t3` command the app puts on PATH      | `DesktopCliShim.ts`: `t3.cmd`                                                          | `<name>.cmd`, so it never replaces real T3 Code's `t3`                                  |

How: one team file holds these values (`apps/desktop/src/team/identity.ts`, also read by the build script), and each upstream spot gets one `team-layer:` line that reads from it. About 8 small hooks. [verify] while building: the server's own default home when started from the shim, the WSL backend's home, and `DesktopHomeOwner`'s lock all take the home we pass.

Shared on purpose: provider sign-ins (`~/.claude`, `~/.codex`, ...) and `gh`. A person signed in for T3 Code or the CLIs is signed in for us too. That is easier, not a leak.

Off in our build: T3 Connect and app.t3.codes sign-in (they need upstream's Clerk keys, which we don't have and must not use). Local network and Tailscale connections keep working.

**Five names**, each free as an npm package, as a GitHub user or org name, and as a repo name (checked 2026-11-19 with `npm view` and the GitHub API). Trademarks and domains not checked. You pick:

| Name          | Idea                                                           |
| ------------- | -------------------------------------------------------------- |
| **Shoalcode** | A shoal: fish moving together without bumping into each other. |
| **Pairhive**  | Pair work, many people in one hive.                            |
| **Pairtide**  | Work that flows in together, like a tide.                      |
| **Hushcrew**  | A crew that works quietly: no surprise clashes, a quiet app.   |
| **Shoalwork** | Like Shoalcode, without "code" in the name.                    |

## 2. The Windows installer on GitHub Actions

Upstream's `release.yml` only runs in `pingdotgg/t3code` and uses paid Blacksmith runners. Its building part, `release-desktop.yml`, is a reusable workflow that takes the runner as an input. So:

- **A new workflow of ours**, `team-release.yml`: started by hand or by a `team-v*` tag. It calls upstream's `release-desktop.yml` unchanged with `platform: win`, `arch: x64`, `runner: ubuntu-latest` (upstream builds Windows on Linux too) and `verify_runner: windows-latest` (upstream's check installs and starts the app on real Windows: `scripts/verify-windows-desktop-artifact.ts`). If the Linux build of the Windows app fails without signing, build on `windows-latest` instead. [verify]
- **A release job** in the same file publishes the installer, `latest.yml`/`nightly.yml` and blockmaps to our fork's GitHub Releases with the built-in `GITHUB_TOKEN` (`contents: write`), reusing `scripts/merge-release-update-manifests.ts`.
- `electron-builder`, NSIS, `electron-updater` and the update UI stay upstream's. x64 only for now; arm64 later if a classmate needs it.

**Cost: nothing.** The fork is public, and GitHub's standard runners are free for public repos, as is release storage. If the repo ever goes private: 2,000 free minutes a month, and Windows minutes count double.

**Code signing.**

Without it:

- SmartScreen shows "Windows protected your PC". The person clicks "More info", then "Run anyway". Once per download of a new installer.
- **Smart App Control** (on by default on some fresh Windows 11 installs) blocks unsigned apps with no "Run anyway". That person would have to turn it off, which may be hard to undo. Check this first with each classmate.
- Some antivirus tools flag new unsigned apps more often.
- Updates still work: `electron-updater` only checks the publisher when one is configured.

Options, cheapest real ones first:

| Option                     | Cost                                                           | Catch                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SignPath Foundation**    | Free for open-source projects                                  | Needs approval and an OSI license (MIT qualifies). The publisher shown is "SignPath Foundation", not us. Signing runs from GitHub Actions, which suits us. |
| **Azure Artifact Signing** | About $10 a month [verify on Azure's price page]               | Upstream's build already supports it (`azureSignOptions`). Individuals could only sign up from the USA and Canada as of March 2026, so probably not you.   |
| **Certum Open Source**     | From €69 (with card reader); cloud version costs more [verify] | A card reader can't sign on GitHub Actions; CI needs the cloud (SimplySign) version.                                                                       |
| Regular OV certificate     | About $200+ a year                                             | No instant SmartScreen trust either: reputation still builds up with downloads.                                                                            |

**Recommendation for the classmates beta:** ship unsigned, with a one-page install guide (the SmartScreen clicks, with a picture) and the SHA-256 of each installer in the release notes. Apply to SignPath now, because approval takes time. Sign before Stable, or before anyone outside the class installs it.

## 3. Release channels and the update button

Upstream already has two update channels (`latest`, `nightly`), a channel switch in Settings (`UpdateTrackSwitchDialog`), an update pill in the sidebar and an update toast. We reuse all of it and only add the labels.

| Channel    | What it is                               | Built how                                                                                      | Update button                            |
| ---------- | ---------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **Dev**    | Your local builds and test builds        | `vp run dist:desktop:win:x64`, or the workflow with no release                                 | None (no feed, like upstream's previews) |
| **Beta**   | For classmates who want new things first | Upstream's `nightly` channel underneath: GitHub prerelease, version `X.Y.Z-nightly.YYYYMMDD.N` | Yes, labelled "Beta"                     |
| **Stable** | The default                              | Upstream's `latest` channel: a normal GitHub release, version `X.Y.Z`                          | Yes                                      |

Keeping upstream's version pattern means no changes to its updater code; only the word "Nightly" becomes "Beta" (one hook). Our version numbers are our own (start at `1.0.0`); About shows "based on T3 Code v0.1.10".

How it fits the sync policy (only stable upstream tags):

- An upstream sync lands on `main` like today. The next build from it goes out as **Beta** only.
- **Stable** is a Beta that classmates used for about a week with no blocker. Never straight from a fresh sync.
- A Stable fix for something urgent can be built from a tag on `main` without waiting for new upstream code.

## 4. Easy to use

Your feedback: connecting providers was buggy and confusing, and the UI was hard to read. Four pieces, all in our own folder (`apps/web/src/components/team/easy/` and a server service), with switches in upstream files.

**a. "Check my setup".** One screen, also opened from the first start, the rail and the command palette (and as an MCP tool so the agent can say "your Codex sign-in expired"). One row per provider:

- Working, or not, with the reason in plain words: "Claude Code is not installed", "Codex is signed out", "Codex is too old for this app; update it".
- One fix button per reason: Install, Sign in, Update. Upstream already has the parts: provider status, `installed`, `auth.status`, version advisories (`providerStatus.ts`), and the install and sign-in terminals the welcome page uses (`AgentInstallTerminal`, `ProviderAuthTerminal`). We reuse them and show only the one next step.
- **Provider extras that aren't signed in.** Codex reports each MCP server's state (`mcpServer/startupStatus/updated`, `mcpServerStatus/list` in `CodexAdapterV2.ts`). Servers that need a login get a row: "Codex tool 'linear' needs sign-in", with "Sign in" (runs `codex mcp login <name>` in a terminal) and "Don't use in this app". In chats, the same problem shows **once** as a quiet line with a Fix link instead of an orange error in every chat. That chat change is a small upstream hook; if it helps every T3 user, offer it upstream as a PR.
- Also checked: Git installed, `gh` installed and signed in (W4: "installed it? Restart the app"), free disk, and the size of our combine copies (section 5).
- Undo and reverse states: every "Don't use" can be turned back on from the same row.

**b. First start.** Three steps, nothing else: pick a project folder, connect one AI (the same rows as "Check my setup", the first working one is enough), start a chat. Upstream's welcome page (`WelcomePage.tsx`: agents, projects, phone) stays as the "more" page; our first start goes in front of it through `FirstRunGate.tsx` (one hook). Team things wait until a second person shows up ("Make this a team project" on the Today page).

**c. Simple mode, on by default.** One setting, `simpleMode`, in our layer. It hides advanced options until "Show advanced options" is clicked. Candidates (to pick in the slice, by looking at the screens with fresh eyes): runtime and access mode pickers beyond the default, worktree and branch options in the composer, right panel tabs other than Files, provider instances not connected, and settings sections a beginner never needs. Plain labels through one word list in our file ("Environment" becomes "This computer", for example). Each hide is one `team-layer:` condition at the spot, so a sync costs a re-applied line. Advanced users turn it off once.

**d. The no-help test.** One classmate who has never seen the app, on their own Windows laptop, installing from the release page. You only watch and write down: every pause over about 10 seconds, every wrong click, every question, every word they misread, time to the first answer from the AI. No hints; if they are stuck for 2 minutes, help and mark it as a blocker. Then fix the top three and run it again with someone new. Notes go to PROGRESS.md (no names).

## 5. Light and smooth

**What to measure** on the installed app, on your Windows laptop, against upstream's own installer of the same version (so the difference is our cost):

| What                | How                                                                                                                            | Target                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Cold start          | Time from click to a usable chat list, 5 runs after a reboot (screen recording or `Measure-Command` + log line)                | About the same as upstream, under ~3 s on a normal laptop |
| Memory              | Sum of all app processes (main, renderer, GPU, server) after 10 minutes idle with one project open; provider CLIs listed apart | Within ~5% of upstream                                    |
| Idle CPU            | Average over 5 minutes, window open and window hidden (`Get-Counter '\Process(*)\% Processor Time'`)                           | Near 0% hidden; no visible gap to upstream                |
| Wake-ups when idle  | Processes our server starts per minute while nothing happens (server log at debug, or Process Monitor)                         | **0 for us** when no team card waits                      |
| Install size        | Installer size, and the install folder size                                                                                    | No more than upstream plus our icon                       |
| Disk used over time | Size of `~/.<name>` including combine copies                                                                                   | Combine copies capped and cleaned (below)                 |

A small PowerShell script in `team/scripts/` collects all of it into one line for PROGRESS.md. Upstream's resource monitor and diagnostics (`ResourceTelemetryDiagnostics`) show the per-process view; use them before writing anything new.

**Our own cost today** (from the code, not measured):

- Four loops every 15 s on the server: `TeamQuestions`, `TeamWarmup`, `TeamPushedBranches`, `TeamWait`. The team state poller runs every 15 s while things change, backing off to 15 minutes. `TeamMergeCheck` fetches every 2 minutes.
- Combine copies: one full copy of the project per team project, **including installed packages** (`node_modules` can be gigabytes).

Fixes, planned as one slice:

- Nothing runs for a project with no team and nothing waiting. Solo projects: no timers at all.
- One team ticker instead of four loops, and each check skips at once when it has nothing to do.
- Slower checks while no client is connected or the window is hidden (how the server learns this: [verify]).
- Combine copies: delete a copy when its pair is gone or after 7 days unused; show their size in "Check my setup" with a "Free up space" button.
- W3 (one `git cat-file --batch` instead of one process per file) when the measurements show Git calls cost on Windows.

Real speed fixes in upstream code go back to T3 as small PRs, one problem each, with numbers (only when you ask me to open one).

## 6. The glass and the real left rail

This stage builds UI_PLAN.md slice 5 (glass) and a real left rail: a narrow icon column with four entries: **Chats, Today/Team, Check my setup, Settings**. Today the Team home entry sits in the sidebar header (`SidebarChrome.tsx`); the rail replaces that and gives simple mode a fixed, obvious place for everything. The rail is our own component, mounted with one hook in the layout.

How it stays smooth:

- **First, the W9 test**: a one-file Electron window with `backgroundMaterial: "mica"` and T3's title bar settings, on your laptop: maximized, snapped, inactive, light and dark, transparency on and off. No glass work before this answer.
- The OS draws the material (Mica samples the wallpaper once; it does not blur live). The page only uses translucent colors under one `<html>` attribute. **No CSS `backdrop-filter` on large surfaces**; small popovers only if measured.
- Measure the GPU process: idle CPU and while scrolling a long chat, glass on vs off. If glass costs more than ~1% idle or drops frames when scrolling, it ships off by default.
- Nothing repaints while idle: no animations that loop, the presence chip updates only when data changes.
- Solid colors on Windows 10, older Windows 11, "Transparency effects" off, web and mobile.

## 7. Native Windows checks

**Automatic** (our own `team-windows-tests.yml` on GitHub's free `windows-latest`, since upstream's uses a paid runner; run by hand and on each Beta tag):

| Item         | What the job does                                                                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| W15          | Runs the team tests (`src/team/`, `src/mcp/toolkits/team/`, `src/cli/team.test.ts`; client-runtime and contracts team tests). Every failure is a finding. |
| W5, W8       | Already unit tests; on Windows they also run against real paths.                                                                                          |
| W1, W10      | A test holds a file open the Windows way and checks the rename is retried and a slow read keeps the last state.                                           |
| W12          | A test with `core.autocrlf=true` checks hashes still match.                                                                                               |
| W7           | A test makes a worktree with a path over 260 characters.                                                                                                  |
| W13          | A unit test fakes `EPERM` on symlink and checks the copy fallback.                                                                                        |
| W3           | Logs how long 20 state reads take, as a number to watch (not a pass/fail).                                                                                |
| Packaged app | The release workflow's `verify_runner` installs the NSIS build silently, starts it and checks the server answers.                                         |

**By hand on your laptop** (about an hour, after each Stable candidate):

1. `winver`: note the build (22621 or later for Mica).
2. Install from the release page: SmartScreen text, install folder, Start menu name (W17). Real T3 Code installed too: both open, separate data.
3. Smart App Control state (Windows Security, App & browser control).
4. Open a project without `gh`: plain message. Install `gh` while the app runs (W4).
5. Sign out of Git Credential Manager, make a claim: no window pops up (W2).
6. A project on an exFAT USB stick: the "safe.directory" message (W6).
7. Glass: maximized, snapped, inactive, light, dark, transparency off (W9).
8. `icacls %USERPROFILE%\.<name>\userdata\secrets`: only you, SYSTEM, Administrators (W11).
9. A project through the WSL backend: which sign-ins it uses (W18).
10. Update: install Beta N, publish N+1, click the update button, app restarts on N+1.
11. Uninstall, reinstall: data still there.
12. Measurements from section 5.

W14 and W16 (developing on native Windows) stay out of scope.

## 8. Order of slices

Each slice ships on its own, is tested, committed, pushed and logged.

1. **Identity.** After you pick the name: the identity file, hooks, icon. A local unsigned build installs next to T3 Code without sharing data.
2. **Installer on Actions.** `team-release.yml`, first Beta on the fork's Releases. Proven by updating Beta 1 to Beta 2 on your laptop.
3. **Windows CI.** `team-windows-tests.yml`, fix what fails.
4. **Measure, then make us quiet.** Baseline against upstream, then the idle fixes from section 5, measured again.
5. **Check my setup**, including Codex MCP sign-ins and the quiet chat line.
6. **First start.**
7. **Simple mode** and plain labels.
8. **Left rail**, then **glass** after the W9 test.
9. **Your manual checklist** round.
10. **No-help test** with one classmate, fix the top three, repeat with a second.
11. **Signing** (if SignPath approved), then **Stable 1.0**.

Later, after slice 2: **one unsigned Mac build** for a single test with a friend who has a Mac. Unsigned means macOS blocks the first open; he opens System Settings → Privacy & Security → "Open Anyway" once. No auto-updates without signing: each new version is a manual download.

Not in this stage: signed macOS and Linux builds of our app, Windows on ARM, the mobile app under our name, the Microsoft Store.

**What you need to do yourself:**

- Pick the name (section 1), and say whether you want to draw the icon or have me make a simple one.
- On GitHub: check Actions is enabled on the fork (Settings → Actions → Allow all actions) and that workflows may write (Settings → Actions → General → Workflow permissions → Read and write). Approve the first workflow run if GitHub asks.
- Apply to SignPath Foundation (a form; they want a project page and a short code signing policy, which I can write).
- On your laptop: install Betas, run the manual checklist, send me the measurement lines.
- Find two classmates for the no-help test and ask about Smart App Control first.
