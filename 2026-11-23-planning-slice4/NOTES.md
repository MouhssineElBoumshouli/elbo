# Planning slice 4: questions and plan page

`main` at `a59bf73cb9`. Headless Chromium, `vp run dev --home-dir ~/.t3-dev`, Elbo theme, project `~/code/team-demo26` (a fresh Git repo added as a local folder; solo).

The screens were built and captured against a replayed plan (`ELBO_PLAN_FIXTURE`, the attendance plan from eval round 3b), so the plan's names (Adam, Sara, Yassine) don't match the answers typed in picture 1. Then one real plan ran end to end with no fixture (no picture).

1. `plan-1-questions.png`: reached by Ctrl+K → "Plan the next part". One screen of questions, tap choices, a quiet "Not sure, suggest something" on each.
2. `plan-2-size.png`: "This looks like a medium project: 1 person, 6 weeks." with Small / Medium / Large.
3. `plan-3-progress.png`: "Codex is fixing 2 points" with Stop. The line went writing → reviewing → fixing.
4. `plan-4-page.png`: the end of the plan: the decisions as a short list, "Claude reviewed it: 7.5/10" with what was fixed, and Save / Change the answers / Start building.
5. `plan-5-save.png`: the save preview: 8 new files, code rules, 18 tasks; "Nothing is written until you save". The folder was checked empty before saving and filled after.
6. `plan-6-dark.png`: the plan page in dark mode, reopened from its URL after a reload.

Also checked, no picture:
- New project → "What are you making?" with Plan it first / Start building; Start building opened a new chat.
- Back to the questions keeps the answers.
- Stop ends the run and says "Stopped. Nothing was saved."
- **Real plan:** a 2-day to-do brief, Codex `gpt-6-astra` writing and Claude `claude-opus-5-5` reviewing. It came back 9/10 with 2 remarks and no fix needed. Saving it added 2 decisions, 2 code rules and 6 tasks.
