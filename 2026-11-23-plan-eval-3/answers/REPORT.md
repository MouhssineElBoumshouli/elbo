# Planning eval, round 3: numbers (partial)

Read after judging the pair in `../blind/`. This file names the sides; it does not pick a winner.

**Only 1 of 4 cases ran.** The Codex usage limit was reached right after this case, on the first turn of the full run ("try again at 11:44 PM", 2026-11-22). Missing: attendance, hackathon-pitch, planted-mistakes. I did not switch the writer or the plain chat to another provider.

Setup:
- Writer and plain chat: Codex `gpt-6-astra`, effort medium.
- Reviewer: Claude `claude-sonnet-5-5`, effort medium.
- Both on the subscriptions, no API keys.
- Code: `main` `74980b9aa8`. The run was made one commit earlier; the changes since are test and lint only.

## weekend-todo (small)

| | Writer + review, round 3 | Panel, round 2 | Plain chat, round 3 | Plain chat, round 2 |
| --- | --- | --- | --- | --- |
| Words (limit 500) | 463; 539 at the first review, 512 after the fix, then one shorten turn | 498 | 469 | 465 |
| Decisions listed (limit 2) | 2 | 1 | not counted | not counted |
| Review score per round | 9/10 (round 1 only) | none | none | none |
| Lines about the method | none | none | none | none |
| Every task has one owner and an area | yes | yes | not checked | not checked |

What the review caught:
- **Round 1, Claude (9/10):** one nit. The plan has Lina start a local preview server, and keeping tasks depends on reopening the same address, but it doesn't say which server or that the port must stay fixed. Nits are not fixed, by design. Stopped after round 1: there were no blockers or shoulds from Claude.
- **Code check:** 539 words, over the 500 limit (should). Codex shortened it to 512 in the fix turn, still over, so one shorten turn brought it to 463.

## Tokens per provider

| | Round 3 | Round 2 |
| --- | --- | --- |
| Codex writer | 3 turns: write, fix, shorten. 44.1k in (0% cached), 4.1k out | Panel: 4 turns, 100.9k in (68% cached), 4.8k out |
| Claude reviewer | 1 turn, 6.2k in, 0.8k out | none |
| Plain chat (Codex) | 1 turn, 13.2k in (85% cached), 0.7k out | 1 turn, 13.2k in, 0.6k out |

Writer + review used about 50k input tokens across both providers, against about 101k for round 2's panel and 13k for the plain chat. Claude's review turn is small: about 6k, against Codex's roughly 13k of its own instructions per turn.

## Notes

- The writer's plan uses `##` headings and ends with a "Decisions" list, while this plain chat used plain paragraphs. A reader may still tell the sides apart from the layout.
- Codex ran web searches in some turns of the cut-off run; that is Codex's own tool, and it adds tokens.

## To finish

After the Codex limit resets, from `evals/`:

```sh
pnpm project-plans --out project-plans/runs/2026-11-23-r3 --case attendance,hackathon-pitch,planted-mistakes
```

Then copy the three cases in here the same way (A/B in `blind/`, the rest in `answers/`).
