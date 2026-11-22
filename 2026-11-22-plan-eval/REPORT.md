# Planning method vs plain chat: first run

**Read this after you have judged the A/B pairs** (see REVIEW.md). It says which plan is which.

Run on 2026-11-22, Codex `gpt-6-astra`, reasoning effort medium, on Mouhssine's ChatGPT login (no API keys). `main` at `029c83209c`.

## What ran

| Case | Method | Plain chat |
| --- | --- | --- |
| attendance | done (medium, 11 turns) | done |
| weekend-todo | done (small, 4 turns) | done |
| hackathon-pitch | done (medium, 10 turns) | done |
| planted-mistakes | **stopped**: Codex usage limit reached after the cross-review (6 of about 11 turns) | not run |

So the most important case (does the method push back on bad ideas where a plain chat does not?) has no result yet.

I knew which plan was which while reading, so my opinion below is not blind. The length gap also gives it away (about 6,000 words against 1,000), so the medium pairs cannot really be read blind as they are.

## Where the method won

- **Real checks behind choices.** The attendance plan checked a free host against its published limits and ruled it out (its free database expires after 30 days, before the 6-week deadline). The plain chat said "use free school-approved EU hosting" without checking anything.
- **Options fitted to people.** Every decision shows 2 options with "fits: Sara knows Python, Adam's React would need a separate build" style reasons. The plain chat just picks.
- **Push-back.** The method questioned the brief openly: a check-in does not prove a student is in the room, a CSV export can carry formulas into a spreadsheet, a dead phone needs a teacher fallback. The plain chat mentioned the first one in a sentence and missed the other two.
- **Structure for slice 3.** Every task has one owner from the team and an area (folders); the buffer is computed (30.6%); every security checklist item was answered. All code checks passed.
- **Small stays small.** The weekend to-do plan is one page (372 words), with one decision and a to-do list.

## Where the method lost

- **Far too long.** Medium plans were 5,650 and 6,009 words with 14 and 15 decisions. The design says medium is "all sections, short; 3 to 6 decisions". The plain chat said the same essentials in about 1,000 words.
- **Repeats itself.** Three experts pushed back on "free hosting" with the same point; two on "check-in proves presence". The merge does not combine them.
- **Experts talk to each other in the final plan.** Lines like "The supplied manager breakdown supports 36 planned person-hours" and "use the proposed 100-hour shared breakdown as a replacement mapping" are notes between experts, not words for a student team. The "Go deeper" folds show expert drafts unedited.
- **Stiff words.** "Not established", "operational rollout", "acceptance coordination". The plain-words rule is not working in the drafts.
- **Hackathon got the wrong panel.** The code always seats a security engineer for software, so the 4 seats went to project manager, architect, security, designer, and the pitch and demo coach was left out. The plain chat's hackathon plan, with a clear hour-by-hour table, a feature freeze at hour 18 and what to cut if behind, was the better plan to follow.
- **Missing "done means".** The plain chat gave short acceptance checks per feature ("a nonblank task can be added with Enter"; "a late check-in is rejected"). The method has none.
- **Weekend plan thinner.** Both fit one page, but the plain chat's has concrete steps per day, "done means" and learning tips; the method's is more abstract.

My overall read: the plain chat wins all 3 finished pairs as a plan to follow; the method wins on the depth of its reasoning. The method's ideas are better than its writing.

## Tokens against section 5

| Case | Turns | Input (cached) | Output | Section 5 estimate |
| --- | --- | --- | --- | --- |
| weekend-todo (small) | 4 | 76.3k (50%) | 3.6k | 3 to 4 turns, 15k to 30k in, 3k to 6k out |
| attendance (medium) | 11 | 289.5k (30%) | 31.9k | 7 to 10 turns, 60k to 120k in, 12k to 20k out |
| hackathon-pitch (medium) | 10 | 299.5k (49%) | 26.7k | same |

- Input is 2.5 to 3 times the estimate. **Codex adds about 14k tokens of its own to every turn** (its instructions and tools), whatever the prompt; the estimate assumed only our prompt. A small plan's 4 turns cost about 55k before any planning text.
- **Caching is weak**: each turn is a separate `codex exec`, a new session, so the cache is barely reused. Section 5's "one chat, roles per turn" would let Codex reuse its cache; the runner does not do that yet.
- Output is over because the drafts were over their caps (22 trimmed fields in attendance) and every expert got a fix turn: the review found a problem in all 4 parts.
- The plain chat's tokens were not saved in this run (the eval now saves them). One turn of the same size would be about 14k in and 1.5k to 3k out.
- The four briefs and the partial fifth case used up the Codex usage window in about 45 minutes.

## What to change in the checklists and the method

1. **Budget the plan, not just the fields.** Medium: at most 6 decisions in total and about 1,500 words. The project manager picks the 6 that matter; the rest become one line each under "Smaller choices". Enforce the count in code (pure, like the caps).
2. **Merge rewrites everything for the team.** The merge writes the "Go deeper" text too, in the team's voice, and drops lines about the method itself. Combine push-backs on the same idea into one, naming every expert who raised it.
3. **Panel by project type.** For a hackathon, research or ML project, the type expert gets a seat before the designer and the security engineer; for a 1-day event, security becomes 3 lines in the architect's checklist (secrets, personal data, HTTPS) instead of a seat.
4. **Project manager checklist:** add "PM13: for each must-have, one line saying how we know it is done" and "PM14: milestones, and what to cut first if a milestone slips". These are what made the plain chat useful.
5. **Plain words in every step:** add "write as you would explain it to a classmate; no words like *established*, *operational*, *coordination*" and give one example sentence. Checklist answers stay at 1 to 2 lines (they overran the 40-word cap 10 times per plan; they are not shown, so that is wasted output).
6. **Cut turns.** Run the fix step as one turn for all experts with problems (11 → 8 turns for medium), and run the session in one provider chat so the cache works. Then re-measure against section 5.

## What is left

- Run `planted-mistakes` (method and plain chat) after the Codex limit resets: `pnpm project-plans --out project-plans/runs/<name> --case planted-mistakes` from `evals/`.
- Change the method as above, then run all 4 again and judge blind. With the length fixed, the medium pairs can be read blind.
