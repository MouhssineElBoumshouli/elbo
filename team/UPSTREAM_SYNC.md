# Syncing with upstream T3 Code

How to pull in pingdotgg/t3code, and where our team layer hooks into upstream files.

## Policy

- **No weekly syncs.** Between syncs, we build our own features.
- **Only stable release tags** (`vX.Y.Z`, e.g. `v0.1.10`). Never `main`, nightly or preview tags: a tested release is a safer base than daily main.
- **Sync only when** (1) a release has something we want, (2) a provider stops working, or (3) there is a security fix.

Upstream moves about 1,300 commits a week, so a sync is always big. "How to keep syncs cheap" below matters more than a calendar.

## Steps

1. **Pick the tag and look first.** `git fetch upstream --tags`, then `git tag -l 'v*' --sort=-creatordate | grep -v -- '-' | head` (stable tags have no `-nightly`/`-preview` suffix). `git log --oneline main..vX.Y.Z | wc -l`. Check `git diff --stat main...vX.Y.Z -- $(git grep -l 'team-layer' -- ':!team/')`: a hooked file upstream deleted or rewrote needs its hook moved, not just merged.
2. **Safety tag.** `git tag pre-upstream-sync-YYYY-MM-DD main && git push origin pre-upstream-sync-YYYY-MM-DD`.
3. **Branch.** `git switch -c sync/upstream-YYYY-MM-DD main`. `main` does not move until step 9. Push the branch after every commit.
4. **Merge the tag, not main.** `git merge --no-ff vX.Y.Z`. For each conflict: take upstream's version, then put our `team-layer:` edit back on top. When upstream rewrote a hooked file, `git checkout --theirs` it and re-apply our hooks from `git diff <old base> main -- <file>`: easier than reading big conflict hunks. `routeTree.gen.ts`: take theirs and regenerate (see lessons). Upstream's pre-commit runs fmt, lint and knip on the merge commit, so those must pass before the merge commits.
5. **Install.** `vp i`.
6. **Typecheck, one package at a time.** In each package: `GOMEMLIMIT=2500MiB npx effect-tsgo tsrs --noEmit` (contracts, client-runtime, web, then server alone). Count only `error TS` lines; `suggestion` lines are upstream's. The server check takes ~15 s and ~3 GB. A clean merge is not a clean build: an upstream Effect bump can break our files with no conflict. Fix root causes first (a missing module turns into hundreds of `unknown` errors).
7. **Tests, one run at a time**, from each package's folder.
   - Server: `vp test run src/team/ src/mcp/toolkits/team/ src/cli/team.test.ts src/auth/ChatGptRpcScopes.test.ts`, plus the upstream tests of every hooked server file (`ThreadSettlementService`, the Claude and Codex adapters, `ws`, `ProviderTurnStartService`, `RunExecutionService`).
   - Web: `src/components/team/`, `MessagesTimeline.logic`, `session-logic`, `Sidebar.logic`; browser project: `ThreadNotificationCoordinator.badge.browser`.
   - client-runtime: `src/work-log/`, `src/state/teamMarkers`, `src/state/teamMerging`. Contracts: `teamFeed`, `teamCards`.
8. **Check hooks still cover every path** (see the checklist below), then a live run per `team/WORKING_RULES.md`. Screenshots go to `test-screenshots`.
9. **Land.** `git switch main && git merge --no-ff sync/upstream-YYYY-MM-DD && git push origin main`. Add a PROGRESS.md entry, and update the file list below if it changed.

## Hook coverage checklist

Markers surviving is not enough. After every sync, check:

- **Turn note and briefing:** every provider turn goes through `RunExecutionService` (`withTeamTurnText`). Look for new callers of `session.startTurn` / `compactThread` / `resumeTurn`, and for code that rebuilds the prompt text after it (`ProviderTurnStartService.startWithHandoffs` did).
- **Claude:** `makeClaudeQueryOptions` has one caller and carries `teamContext` and our PreToolUse `hooks` (merged into upstream's own hooks object).
- **Codex:** `buildCodexTurnStartParams` has one caller and passes `teamContext`; one `turn/start`.
- **MCP tool timeouts** stay above the warning card's 55 minutes (upstream: Codex `CODEX_T3_MCP_TOOL_TIMEOUT_SEC`, Claude `CLAUDE_T3_MCP_TOOL_TIMEOUT_MS`, both 65 min now).
- **Team MCP tools** are registered inside the MCP transport (`server.ts`), next to upstream's `layerTools` and `layerToolSearch`. If `McpHttpServer.layer` changes, change ours the same way. Each team tool carries upstream's caller-bound annotation (`McpSchema.EnabledWhen`).
- **Git on the team state repos** (bare) names the repo with `GIT_DIR`; look for new Git calls there and for new hardening in upstream's Git runner (`GitVcsDriverCore.executeRaw`).
- **New providers** get the briefing through the turn text unless listed in `BRIEFED_BY_ADAPTER` (`teamTurnText.ts`); the guard is after-the-turn for every provider except Claude.
- **Settlement:** every auto-settle dispatch goes through the filtered candidates in `ThreadSettlementService`.
- **Cards in the UI:** every place that renders a chat timeline (side chats embed `ChatView`); sidebar row status and notifications read the team feed.

## Upstream files we hook into

Every edit carries a `team-layer` comment, so `git grep -n team-layer -- ':!team/'` is the source of truth. As of 2026-11-19 (v0.1.10):

- **Server wiring:** `apps/server/src/server.ts` (team layers; the MCP transport with the team tools), `ws.ts` (team RPC handlers) + `ws.test.ts` (team services mocked), `binCli.ts` (`t3 team`), `auth/RpcAuthorization.ts`, `observability/RpcInstrumentation.ts`, `mcp/McpHttpServer.ts` (`layer` tagged `@public`: unused here).
- **Turns and providers:** `orchestration-v2/RunExecutionService.ts` (turn text), `ProviderTurnStartService.ts` (handoff turns keep the turn text), `ThreadSettlementService.ts` (+ its test: no auto-settle while a card is in play), `Adapters/ClaudeAdapterV2.ts`, `CodexAdapterV2.ts`, `provider/CodexDeveloperInstructions.ts`, `packages/provider-core/src/server/runtimeInstructions.ts`.
- **Contracts and client runtime:** `packages/contracts/src/index.ts`, `rpc.ts`, `clientRpcPermissions.ts`; `packages/client-runtime/package.json` (exports), `src/rpc/client.ts`, `src/work-log/presentation.ts` (+ its test: "Could not change 1 file").
- **Web:** `ChatView.tsx`, `CommandPalette.tsx`, `RightPanelTabs.tsx` (marks inside `RightPanelTab`), `sidebar/SidebarThreadRow.tsx` (holder marks, "card counts as input"), `sidebar/SidebarChrome.tsx` (Team home entry), `routeTree.gen.ts` (generated), `ThreadNotificationCoordinator.tsx` (+ `.badge.browser.test.ts`: one team test), `chat/ChatHeader.tsx`, `chat/MessagesTimeline.tsx`, `chat/MessagesTimeline.logic.ts`, `chat/TimelineWorkGroupRows.tsx` ("Waiting for your input"), `files/FileBrowserPanel.tsx`, `files/FilePreviewPanel.tsx`, `session-logic.ts`, `apps/web/vite.config.ts`.
- **Tooling:** root `vite.config.ts` (lint: three style rules off for team files, `team/parked` ignored), `knip.jsonc` (team scripts as entries), `scripts/dev-runner.ts`, `.gitignore`. No marker possible (JSON): `packages/source-control-github/package.json` (`./server/gitHubAuthStatus` export, used by `TeamHost`). Fork-only text: `AGENTS.md` (fork note), `CLAUDE.md`, `README.md`.

## How to keep syncs cheap

- **Hook where upstream is stable.** Services, contracts and adapter entry points change less than UI components. Of 34 conflicts on 2026-11-19, the costly ones were all in big UI files (`MessagesTimeline`, `Sidebar`, `ChatView`, the right panel) that upstream split into new files.
- **Hooks are one line that calls our code.** Logic lives in `team/` files; the upstream file only imports and calls. A rewritten upstream file then costs a re-applied call, not a re-written feature (the timeline card row moved to `team/TeamCardTimelineRow.tsx` for this reason).
- **Follow upstream's tooling, scoped.** Upstream added lint rules, knip export checks and new Effect diagnostics that its pre-commit enforces. Fix the meaningful findings in our code; turn off only pure style rules, only for team files, in one marked place.
- **Don't widen upstream's API for us.** Every export we add to an upstream package (like `gitHubAuthStatus`) or every private function a team test calls becomes a conflict when upstream tidies it. Prefer building what we need in our own files (`mergeOrder.ts` builds its own PR helper).
- **Keep the hook list and checklist above current**, and read the release notes of the target tag before merging.

## What was hard (2026-10-11 sync, 805 commits)

- **Upstream replaced its orchestrator** (orchestration-v2). Thread activities, which our cards were built on, were gone, and about 20 team files used removed services. This took a planned port (`team/V2_PORT_PLAN.md`), not conflict fixes: cards moved to our own store and reach clients through the team feed; app-sent messages became upstream's system notifications; provider hooks moved to the v2 adapters and `RunExecutionService`.
- **Effect moved APIs**: `effect/unstable/*` became `effect/*`, `Stream.scan` takes its seed as a function, `HostProcess` became a namespace. Mostly mechanical, but spread across every file.
- **Tests**: our mocked snapshot queries no longer matched anything, so team tests now run on a real v2 orchestrator (`team/teamOrchestrator.testkit.ts`). Two kinds of event race only showed up there: separate typed streams reordering events, and subscribing after a snapshot.
- **Memory**: a full server typecheck while other things ran likely restarted the laptop. Run checks one at a time.
- **Our ws.ts security wrapper** was no longer needed: upstream's scope checks now cover those methods (our test passes on plain upstream). The test stays and guards it on every sync.

## 2026-10-14 sync (242 commits)

- **No conflicts, but 319 server type errors**, all from one Effect 4.0.4 change: `crypto.randomUUIDv4` is now a function (`randomUUIDv4()`). Six calls in our files; the errors spread through `binCli.ts` into upstream's CLI tests. Fix the root in our files first, then re-run.
- **Check that hooks still cover every path**, not just that markers survived: `makeClaudeQueryOptions` still has one caller, Codex's MCP config still carries our timeout, and the briefing showed in a live Codex session log.
- **First page load after a sync** sits on the splash for about a minute while Vite re-optimizes (the lockfile changed); reload once.
- **Stopping the dev server**: the PID from `setsid ... & echo $!` is gone at once. Find the owners of the two ports (`ss -H -ltnp`), check their folder, and stop their process group.

## 2026-11-19 sync to v0.1.10 (6,422 commits)

The first sync to a release tag instead of main. 34 conflicted files, about 90 spots.

- **Upstream split big UI files.** Sidebar rows moved to `sidebar/SidebarThreadRow.tsx`, right panel tabs became a `RightPanelTab` component and `ChatRightPanel`, timeline rows moved to `Timeline*Rows.tsx`, and `ThreadNotificationCoordinator` became a non-React service (`startThreadNotifications(registry, router)`), so it reads the team feed through the atom registry (`state/teamFeed.ts`: `readTeamThreadCards`, `subscribeTeamThreadCards`). Its two old tests were deleted; ours only held team-feed mocks, and our team check now lives in upstream's `.badge.browser.test.ts`.
- **A silent runtime break, found only by typechecking:** Effect's MCP server now marks tool dependencies as request-level (`McpRequest<"Requires", …>`), discharged only by the transport. Our team tools sat on top of `McpHttpServer.layer`, outside the transport, so every team tool call would have died without an `McpInvocationContext`. They now go in the transport's registrations (`server.ts`).
- **Two more silent breaks, found only by the team tests:** upstream now runs every Git command with `safe.bareRepository=explicit`, so Git refused our bare team state repos found from `cwd`. Worse than a failed write, `GitTeamService.load` read the refusal as "no origin" and would have reloaded every shared team as solo after a restart. Every Git call on a state repo now names it with `GIT_DIR`. And `McpToolAccess` now refuses to build a toolkit whose caller-bound tools lack `McpSchema.EnabledWhen: hiddenFromOutsideClients`; the six team tools carry it.
- **Effect 4.1.3:** `effect/Crypto` is gone (use `SecureRandom.uuidV4()` from `effect/crypto/SecureRandom`); code that touches it now needs `Digest`/`SecureRandom`, so tests provide `NodeCrypto.layer` next to `NodeServices.layer`. Missing that one module produced ~1,000 cascading errors.
- **New tooling:** the typechecker is now `effect-tsgo tsrs` (TypeScript 7 native, fast), the upgraded Effect plugin reports more patterns as errors, and upstream's pre-commit runs knip with export checks and new custom lint rules. Fixed in our code where meaningful; three style rules and the `effectFnOpportunity` diagnostic are off for team files only.
- **Hooks upstream made unnecessary:** Codex's MCP tool timeout (upstream now 65 min) and `subscribeBackgroundPolicy` (removed). Antigravity's before-write guard is gone because upstream switched it to its own diff edits; the after-turn check still covers it.
- **A gap that predated the sync:** turns carrying a context handoff, side-chat context or restart note rebuilt their prompt from the stored message, dropping the turn note and briefing (`ProviderTurnStartService`). Upstream's side chats made it hit more often.
- **`routeTree.gen.ts`:** take theirs, then run the TanStack generator (`@tanstack/router-generator`'s `Generator` with `getConfig({ autoCodeSplitting: true, target: "react" }, apps/web)`); it only adds `/team`.
