# 2026-11-21 — Screenshot tour for the design and wording review

`main` commit: c4d0d7353e. No code changes this round.

## How these were made

- Dev server (`vp run dev`) in a browser: headless Chromium, 1440 × 900 (picture 40: 900 × 900).
  The header says "Elbo Dev" because it is a dev server. Desktop-only rows (update track, glass)
  are missing from a browser; see picture 21.
- Fresh home folder `~/.t3-dev-review`, with nothing copied from the real install, so the sidebar
  only holds these demo projects. Elbo theme; light/dark follow the system setting (switched
  by the browser for each pair). Simple mode on (the default).
- `team-demo23`: a small "Pinboard" app with a team. Teammates Sara (holds `src/pins/search.ts`,
  `src/api/routes.ts`) and Omar (holds `src/auth/session.ts`), made by
  `apps/server/scripts/team-cold-start-seed.ts`. `solo-demo12`: the same app, plain Git, no team.
- Every chat was typed in the app and answered by Codex (GPT-6-Luna). Nothing is mocked:
  - finished: "Pin Search Ranking" (a question about search);
  - waiting for an answer: "Refresh Session Expiry on Activity" (wants Omar's file; warning card open);
  - running: "Soak Test Pin Store Reads" (a long command, so it kept running for every picture);
  - long chat with code: "Rank title matches above tags" (3 turns: code walkthrough, then a change to
    Sara's file with its plan card and warning card, where I clicked "Go anyway", then a test file);
  - solo: "Add Title Match Highlighting".

## Pictures

| File | What it shows |
|---|---|
| `01-welcome-light.png`, `02-welcome-dark.png` | First start / welcome page on a fresh home: 3 steps, AI step done. |
| `03-empty-no-projects-light.png`, `04-empty-no-projects-dark.png` | Empty state after "Skip for now": no projects yet. |
| `05-new-chat-light.png`, `06-new-chat-dark.png` | New chat in the team project: "Full access ▾" chip, "Team · synced", "⋯". |
| `07-long-chat-light.png`, `08-long-chat-dark.png` | The long chat: code block, user bubbles, plan card ("1 file planned, checked against claims"), the decided warning card ("Sara holds a file in this plan · You chose: Go anyway"), changed-file summary. Sidebar shows all states: finished (times), "Input", and the running chat in the open "Working" group. |
| `09-sidebar-states-waiting-chat-light.png`, `10-sidebar-states-waiting-chat-dark.png` | The waiting chat open: warning card with its five choices; sidebar row says "Input" with Omar's mark. |
| `11-team-home-team-light.png`, `12-team-home-team-dark.png` | Team home for the team project: catch-up line, people cards (You, Sara, Omar), Merging, Tasks, Recent handoffs, Notes (continues below the fold). |
| `13-today-solo-light.png`, `14-today-solo-dark.png` | Today for the solo project: catch-up, the chat holding `search.ts`, Merging, Notes, "Make this a team project". |
| `15-setup-all-ready-light.png`, `16-setup-all-ready-dark.png` | Check my setup, all ready. |
| `17-setup-problem-light.png`, `18-setup-problem-dark.png` | Check my setup with a problem: "1 thing needs you", Claude "not installed" with Install. Made by pointing Claude's binary path at a missing file in this test home; put back afterwards (Claude ready again). |
| `19-settings-general-light.png`, `20-settings-general-dark.png` | Settings → General (Simple mode, Notifications, Sidebar). |
| `21-settings-appearance-glass-light.png`, `22-settings-appearance-glass-dark.png` | Settings → Appearance, Interface section with "Glass (Windows 11)" on and "Glass style: Frosted (Acrylic)". **Stand-in:** a browser never offers glass, so for these two I added a fake desktop bridge in the page after it loaded (a reload removed it). The rows and their words are real; the window is not see-through here. Real glass: `2026-11-21-glass-w9/`. |
| `23-settings-providers-light.png`, `24-settings-providers-dark.png` | Settings → Providers, Codex selected (the account email is blurred by the app). |
| `25-settings-about-light.png`, `26-settings-about-dark.png` | Settings → About as the browser shows it ("Version 0.1.9"; the update track row is desktop-only). |
| `27-command-palette-light.png`, `28-command-palette-dark.png` | Command palette (Ctrl+K) over the long chat. |
| `29-access-menu-light.png`, `30-access-menu-dark.png` | "Full access ▾" open: the four permission modes. |
| `31-more-panel-light.png`, `32-more-panel-dark.png` | "⋯" open: "Machine and worktree" and "Branch". |
| `33-changes-panel-light.png`, `34-changes-panel-dark.png` | "Changes" clicked on the long chat: the details card (machine, editor, branch, Commit/push/PR, "Changes vs origin/main +14 −1"). |
| `35-diff-panel-dark.png` | The right panel's Diff after clicking "Changes vs origin/main": two files, `search.ts` expanded. |
| `36-toast-light.png`, `37-toast-dark.png` | A toast: "Thread completed · Pin Search Ranking · Open thread" while viewing another chat. Needs Settings → General → In-app notifications on (off by default). |
| `38-error-light.png`, `39-error-dark.png` | An error state that happened by itself: sending the first chat gave "Select a base branch before sending in New worktree mode." |
| `40-narrow-900-light.png` | The long chat at 900 px wide. |

## Things I noticed while taking them (for the reviewer, not fixed)

1. Error 38/39: the "⋯" panel already shows "From main (remote)", yet sending says no base branch
   is selected; picking "main" in the panel fixed it. In simple mode the branch is hidden, so the
   message points at something the user can't see.
2. Leftover T3 wording: palette "An agent investigates a T3 Code problem" (27); General "while T3 Code
   is open" (19); theme names "T3 Code" and "T3 Chat" in Appearance; Codex "Shadow home path"
   `~/.codex-t3/personal` (23).
3. General → Simple mode still says choices "wait behind 'More options'", which is now "⋯" (19).
4. Check my setup with one problem: "1 thing needs you. Each has one button." (17). Group labels
   are "AI" and "TOOLS" (different case).
5. Today (solo): "Notes to future you" and "Notes to future me" on one card; status "idle" in lower case (13).
6. Sidebar: the finished chat "Pin Search Ranking" stayed in the "Working" group with "Done"
   after its follow-up turn (36/37). The running row looks greyed in light mode (07) but blue in dark (08).
7. The last user bubble shows through under the composer at the bottom of a scrolled chat (07, 08, 40).
8. About in a browser says "Version 0.1.9" next to "based on T3 Code v0.1.10" (25).

Also seen, not photographed: "New chat" opens a project picker first; the solo project's rail item
says "Today", the team project's says "Team"; a file opened from the diff shows Sara's "SA" mark in
the file tree.
