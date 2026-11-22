# Planning eval, round 2

Text output of `evals/project-plans` after the round 2 method changes (`main` `9386d6eaad`, checks regraded at `d98cc0701a`). Codex `gpt-6-astra`, effort medium, ChatGPT login. All 4 cases ran on both sides.

- `blind/`: start here. `REVIEW.md`, one folder per case with `A.md` and `B.md` in random order, briefs in `briefs/`. Nothing in this folder says which is which.
- `answers/`: open after judging. `key.json` (which letter is which), `checks.md` (code checks and tokens), `REPORT.md` (word counts, decisions, planted mistakes, tokens against round 1 and section 5), and per case the method's `plan.md`, decision files, `plan.json`, `usage.json`, and the plain chat's `baseline.md` with its `baseline-usage.json`.
