# Sync to upstream v0.1.10 (2026-11-19)

Branch tested: `sync/upstream-2026-11-19` at 6b8aaac241 (merge of upstream's stable tag v0.1.10, 7d32075e37, plus our fixes).
One dev server (`~/.t3-dev`, `T3CODE_TEAM_LOGIN_OVERRIDE=mouhssine`), fresh seeded `team-demo22`, a dependency-free `typecheck` script added to `main` (always passes). Provider: Codex, GPT-6-Astra.

Steps:
1. New worktree chat: "Make search in src/pins/search.ts also match the pin's URL". The agent called `team_plan` (team MCP tools work through upstream's MCP transport).
2. First look: no card in the timeline (the sidebar already said "Input" with Sara's mark). Cause: upstream builds the rendered timeline's entries in `ThreadTimeline`, not `ChatView`. Fixed in 6b8aaac241; after a reload both cards showed.
3. Find another way: "You chose: Find another way"; the agent re-planned `src/api/routes.ts` (also Sara's), a second card, working row "Waiting for your input". Go anyway: the agent changed the `/search` line in its worktree; I committed it there.
4. `main` changed another line of `routes.ts` (pushed). Team home → Merging: "… both changed `src/api/routes.ts` and merge cleanly." Check now: "Combined with `main`, `npm run typecheck` finds nothing new."
5. Notes: a note "for everyone" on `src/api/routes.ts` showed under "From you" and reached my writer file on the remote's `refs/t3-team/state`.

Pictures:
- `01-plan-and-warning-card.png`: plan card ("1 held by others") and warning card with Find another way / Go anyway / Wait / Ask; sidebar "Input" and Sara's mark; presence chip.
- `02-find-another-way.png`: "You chose: Find another way", the re-plan on `routes.ts`, the second card, "Waiting for your input".
- `03-team-home.png`: Team home: catch-up, people, Merging (clean pair, Check now, Update my copy), Tasks, Recent handoffs, Notes.
- `04-check-now.png`: Merging after Check now: "Combined with `main`, `npm run typecheck` finds nothing new."
- `05-notes.png`: the new note under "From you", "Not seen yet".
