# Planning eval, round 3b: numbers

Read after judging the pairs in `../blind/`. This file names the sides; it does not pick a winner.

Setup:
- Writer and plain chat: Codex `gpt-6-astra`, effort medium.
- Reviewer: Claude `claude-opus-5-5`, effort high (the new default).
- All 4 cases finished, on the subscriptions, no API keys. `main` at `bcc8104688`.
- The first try stopped on its first turn with "Selected model is at capacity" from OpenAI. That is not a usage limit; the retry ran clean.
- Both sides of each pair use one `##` heading style (`layout.ts`). Length still differs on two cases (see Words).

## Words

| Case (limit) | Writer + review, 3b | Plain chat, 3b | Writer + review, 3 (partial) | Panel, round 2 |
| --- | --- | --- | --- | --- |
| attendance (1,500) | 1,323 (1,579 at review, 1,519 after the fix, then a shorten turn) | 1,194 | not run | 2,168 |
| weekend-todo (500) | 493 (537 at review, 569 after the fix, then a shorten turn) | 485 | 463 | 498 |
| hackathon-pitch (1,500) | 1,463 | 868 | not run | 2,050 |
| planted-mistakes (1,500) | 1,456 | 823 | not run | 2,269 |

Decisions listed: 6, 2, 5, 6 (limits 6, 2, 6, 6). No lines about the method on either side.

## Review scores per round

Every case stopped after round 1: no blocker was raised, so no second review ran.

| Case | Round 1 | Stopped because |
| --- | --- | --- |
| attendance | 7.5/10 | no blocker fixed |
| weekend-todo | 8.5/10 | no blocker fixed |
| hackathon-pitch | 8.5/10 | only nits |
| planted-mistakes | 8/10 | no blocker fixed |

## What each review caught

- **attendance (2 shoulds, 1 nit), both fixed:**
  - Sara has all the server work in 42 hours with no Django time. The writer cut the import and operations tools and added learning time.
  - Nothing in week 1 sets up the project or a live address, yet Yassine tests "the website" on school Wi-Fi. Week 1 now creates the project and a published address.
  - Nit: no agreed data between Adam's JavaScript and Sara's server code.
- **weekend-todo (1 should, 1 nit):**
  - Saved tasks depend on the preview server keeping the same address, but the plan names no tool or port. Fixed: Python's server, a fixed address, what to do if the port is busy.
  - Nit: no plan for damaged saved data.
- **hackathon-pitch (3 nits, no fix turn):**
  - Usability testing before the app works.
  - No handoff of the room list into the database.
  - Nobody rebuilds the served app after late screen fixes.
- **planted-mistakes (4 shoulds, 1 nit), all fixed:**
  - Chloe ("some JavaScript") has the hardest Python image work. Simplified, with pairing time.
  - Ana has no Django time, plus member editing the brief never asked for. Editing cut, a tutorial hour added.
  - Email login in Django needs a custom user model before the first migration. Added to day one.
  - Hosting was an open check with a 2 GB bar free hosts rarely meet. PythonAnywhere named, the bar replaced.
  - Nit: no backup method made in week 1.
- In code, the word limit (a should) went to the fix turn on attendance and weekend-todo. Both were still over afterwards, so each got one shorten turn.

## Planted mistakes (planted-mistakes case)

| Mistake | Writer + review | Plain chat |
| --- | --- | --- |
| Passwords stored as plain text and emailed back | caught | caught |
| Microservices, Docker and Kubernetes for a 2-week project | caught | caught |
| 2,000 photos of 5 MB in a 500 MB free database | caught | caught |

The writer caught all three in its first draft; none of Claude's review points was about them.

## Tokens per provider

| Case | Codex writer | Claude reviewer | Writer + review total | Plain chat (Codex) | Panel, round 2 |
| --- | --- | --- | --- | --- | --- |
| attendance | 3 turns · 89.5k in (48% cached) · 12.1k out | 1 · 9.3k · 3.9k | 98.8k in · 16.0k out | 13.3k · 1.7k | 234.7k · 25.5k |
| weekend-todo | 3 · 87.6k (40%) · 5.2k | 1 · 6.3k · 1.5k | 93.9k · 6.7k | 13.2k · 0.7k | 100.9k · 4.8k |
| hackathon-pitch | 1 · 14.0k · 3.5k | 1 · 8.7k · 2.5k | 22.7k · 6.0k | 13.4k · 1.5k | 190.8k · 23.2k |
| planted-mistakes | 2 · 99.2k (55%) · 8.5k | 1 · 9.1k · 3.2k | 108.3k · 11.7k | 30.9k · 1.4k | 260.0k · 26.3k |

- **Claude Opus 5.5 at high effort:** 6–9k input and 1.5–3.9k output per review, against 6.2k / 0.8k for Sonnet 5.5 at medium in round 3.
- **Most writer input is the fix and shorten turns:** each re-sends the whole plan and brief, plus Codex's ~13k of its own instructions.
- **Hackathon** needed no fix, so it cost about 1.7× the plain chat. The others cost 3.5–7×.

## Notes

- Hackathon and planted-mistakes plans are about 1.7× the plain chat's length. A reader may tell the sides apart by length.
- The shorten turn ran twice for small overruns (19 and 69 words). Cheaper options: let the fix turn's own word count decide, or allow a small margin.
