# Planning hardening round

`main` at `598e7173ed`. Headless Chromium, `vp run dev --home-dir ~/.t3-dev`, project `~/code/team-demo29` (New project with a typed path). The screens use the replayed attendance plan (`ELBO_PLAN_FIXTURE`, slowed with `ELBO_PLAN_FIXTURE_STEP_MS` so a restart lands mid-turn); the evals and the AI-tools check used real models.

1. `h-1-interrupted.png`: the dev server was stopped while the plan was being reviewed, then started again. The page reopened at "This was interrupted…" with Try again; Try again finished the plan.
2. `h-2-reopened.png`: a push-back was cut off by a restart. After the restart the page showed "This was interrupted: … answering on decision 0001" and Try again resent the stored push-back; the answer is under "How we got here".
3. `h-3-save.png`: the save preview with AGENTS.md (changes) and CLAUDE.md (new), the checkbox on, and one rule not written because it says the opposite of the project's own AGENTS.md line ("Never use SQLite…"). Turning the checkbox off removed both files from the preview.

Also checked, no picture:
- Ctrl+K "Plan the next part" after a restart opened the project's newest unsaved plan; "Back to the questions" brought the answers back.
- The saved AGENTS.md kept the person's lines and added Elbo's 9-line section with the two written rules; CLAUDE.md is `@AGENTS.md`.
- **Outside Elbo:** plain `codex exec` (Luna) and `claude -p` (Haiku 5.5) in the folder, asked "What are this project's rules?", both answered with the plan's rules, the plan pointer and the project's own lines.
- **Inside Elbo:** a Codex chat (Luna) answered the same way. A Claude chat (Haiku) could not run: the Claude account hit its 5-hour limit (the plan eval's reviews), resetting 22:10.

`pushback-answers/`: the push-back eval on Codex gpt-6-astra, 6 cases × 2 samples, every answer and `SUMMARY.md` (12 of 12 right).
`plan-rerun/`: attendance and planted-mistakes through writer + review, compared with round 3b in team/PROGRESS.md.
