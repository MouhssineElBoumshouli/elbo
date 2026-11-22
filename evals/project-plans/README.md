# Project plans

Whether Elbo's planning method (team/PLANNING_FEATURE_PLAN.md) writes better project plans than a plain "make me a project plan for this" chat on the same model.

Each case is a brief in `cases/`. The eval runs it once through the method (`apps/server/src/team/planning/`) and once as a plain chat, with the same provider, model and effort. Both go through Elbo's own text-generation runner on your Claude or Codex login, like a normal chat. API keys are removed from the environment, so nothing is billed to a key and no `.env` is read.

## Run it

From `evals/`:

```sh
pnpm project-plans --out project-plans/runs/<name> [--provider codex|claude] [--model id] [--effort medium] [--case attendance,weekend-todo]
```

Start with `--case weekend-todo` (4 method turns and 1 chat turn) to check that the login works.

## What a run writes

- `<case>/A.md` and `<case>/B.md`: the method's plan and the plain chat's plan, in random order. Judge these blind, with `REVIEW.md`.
- `key.json`: which letter is which. `checks.md`: the code checks and token counts, naming the method. Open both only after judging.
- `<case>/method/`: the method's `plan.md`, decision files, `plan.json` and `usage.json` (tokens per turn). `<case>/baseline.md`: the plain chat's plan.
- `results.json`: one row per case and arm.

## Checks

The code checks, in `grade.ts` (tested in `grade.test.ts`):

- a case marked `onePage` stays under 500 words;
- every planted mistake is pushed back on: one line of the plan names it and argues against it (a keyword check, so read the plans too);
- every method task has exactly one owner from the brief and an area;
- every security checklist item has an answer or a reason it does not apply.

The last two need the method's structured output, so the plain chat is not checked on them. Which plan is better is decided by people reading the A/B pairs, not by a model judge.

## Add a case

Add a brief to `cases/` and an entry to `cases.ts` with its source. A planted mistake gets a `topic` and a `pushBack` pattern; check both against a line that should pass and one that should not, in `grade.test.ts`.

## Cost

Runs use subscription usage, not a bill. With Codex, every turn carries about 14k tokens of Codex's own instructions, and separate turns barely share a cache. A medium case takes about 10 method turns. `checks.md` records each run's tokens next to section 5's estimates.
