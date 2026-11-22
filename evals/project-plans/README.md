# Project plans

Whether Elbo's planning flow (`apps/server/src/team/planning/`) writes better project plans than a plain "make me a project plan for this" chat.

The flow: one provider writes the plan; the other signed-in provider reviews it read-only, with a score out of 10 and problems marked blocker, should or nit. The writer fixes blockers and shoulds, or declines one with a reason. A new review runs only after a fixed blocker, for at most 3 rounds. With only one provider signed in, the same provider reviews in a fresh session, and the result says so.

Each case is a brief in `cases/`. The eval runs it once through the flow and once as a plain chat on the writer's provider and model. Both go through Elbo's own text-generation runner on your Claude and Codex logins, like a normal chat. API keys are removed from the environment, so nothing is billed to a key and no `.env` is read.

## Run it

From `evals/`:

```sh
pnpm project-plans --out project-plans/runs/<name> [--writer codex|claude] [--reviewer codex|claude] [--writer-model id] [--reviewer-model id] [--effort medium] [--case attendance,weekend-todo]
```

Without `--reviewer`, the reviewer is the other provider if it is signed in. Start with `--case weekend-todo` to check both logins.

## What a run writes

- `<case>/A.md` and `<case>/B.md`: the flow's plan and the plain chat's plan, in random order. Judge these blind, with `REVIEW.md`. Both use the same plain layout; the flow adds its decisions as a short list at the end.
- `key.json`: which letter is which. `checks.md`: the code checks, review scores per round, what each review found and what the writer did, and tokens per provider. Open both only after judging.
- `<case>/method/`: `plan.md`, `decision-log.md`, `plan.json` and `usage.json` (tokens per turn and provider). `<case>/baseline.md`: the plain chat's plan.
- `results.json`: one row per case and arm.

## Checks

The code checks, in `grade.ts` (tested in `grade.test.ts`):

- a case marked `onePage` stays under 500 words; every flow plan has its word and decision counts next to its size's limits (`planLimits.ts`);
- no line talks about the planning session instead of the project, on both sides (`planWords.ts`);
- every planted mistake is pushed back on: one line of the plan names it and argues against it (a keyword check, so read the plans too);
- every task in the flow's data has exactly one owner from the brief and an area.

Which plan is better is decided by people reading the A/B pairs, not by a model judge.

## Add a case

Add a brief to `cases/` and an entry to `cases.ts` with its source. A planted mistake gets a `topic` and a `pushBack` pattern; check both against a line that should pass and one that should not, in `grade.test.ts`.

## Cost

Runs use subscription usage, not a bill. With Codex, every turn carries about 13k tokens of Codex's own instructions. A case takes 3 to 7 turns: write, then up to 3 reviews and 3 fixes.
