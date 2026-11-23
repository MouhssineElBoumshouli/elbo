# Planning slice 5: the challenge loop, and slice 4 fixes

`main` at `42b3fbe575`. Headless Chromium, `vp run dev --home-dir ~/.t3-dev`, Elbo theme.

- Pictures 1 to 4 use the replayed attendance plan (`ELBO_PLAN_FIXTURE`). There, a push-back is always defended and a pick swaps the option's exact wording.
- Picture 5 is a real plan with a real push-back: Codex writing, Claude reviewing.

1. `s5-1-pushback.png`: Push back opened from the keyboard on "Website structure"; Ctrl+Enter sends and Escape cancels.
2. `s5-2-against.png`: Pick another option → PostgreSQL. The card is marked "Chosen against advice" and shows the advice and the risk. The history line still has the old "You picked: Picked …" wording, which was fixed right after to "You picked: PostgreSQL …, against the advice (…)".
3. `s5-3-answering.png`: "Codex is answering your push-back…" while the turn runs. Save the plan is disabled meanwhile.
4. `s5-4-save.png`: the save preview after deciding (team-demo26):
   - "adds how we got here" on the decisions that were pushed back on;
   - the rulebook is not listed and the rules say "No change";
   - the two earlier decisions are listed as staying active;
   - planning tasks have no paths, and code tasks have only real folders.
5. `s5-5-real.png`: a real push-back on a real weekend plan (team-demo27). "I'd like to learn React for my CV" → Codex changed it to React and updated 2 plan parts and 1 task (see "Updated:").
   - Tokens: 14,328 in, 828 out; 4 parts and 1 task were sent, not the whole plan.
6. `s5-6-dark-newproject.png`: New project in dark mode. Typing `~/code/club-shop` shows "Creates ~/code/club-shop"; with only a name it says "Goes in ~/Elbo projects". The project wasn't created (Escape).

Also checked, no picture:
- Save stays disabled until no decision is open, and the page names the open ones.
- Pick the advice again → back to "Agreed".
- A plan lost to a server restart says so, with "Back to the questions".
- New project with `~/code/team-demo27` created the folder there; nothing went in `~/Elbo projects`.
- Ctrl+K "Plan the next part" on the plan page now uses that page's project.
- The real plan's save first failed on a task whose folder was `./` (the whole repo). Fixed and tested, then shown working through the screens with a fixture task using `./` (team-demo28).
