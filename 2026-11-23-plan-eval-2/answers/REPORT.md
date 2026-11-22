# Planning eval, round 2: numbers

Read after judging the pairs in `../blind/`. This file names the sides; it does not pick a winner.

Codex `gpt-6-astra`, effort medium, both sides on the same provider and ChatGPT login. Method at `main` `9386d6eaad`; the checks were regraded at `d98cc0701a` (see "Fixed after the run"). All 4 cases finished on both sides.

## Length and decisions

| Case | Method words, round 1 → round 2 (limit) | Plain chat words, round 1 → round 2 | Method decisions as cards, round 1 → round 2 (limit) |
| --- | --- | --- | --- |
| attendance (medium) | 6,009 → **2,168** (1,500); 2,505 before the shorten turn | 969 → 1,082 | 14 → 6 (6), plus 1 smaller choice |
| weekend-todo (small) | 372 → 498 (500) | 428 → 465 | 1 → 1 (2) |
| hackathon-pitch (medium) | 5,650 → **2,050** (1,500); 2,311 before | 1,146 → 1,167 | 15 → 6 (6), plus 4 smaller choices |
| planted-mistakes (medium) | not run → **2,269** (1,500); 2,535 before | not run → 854 | → 6 (6), plus 2 smaller choices |

- Decision limits are met everywhere (code enforces them).
- **The medium word limit is not met.** The one shorten turn took off 10–15%, not the 35–40% needed. The small plan fits.
- Lines about the method instead of the project (`planWords.ts`): none on either side, in all 4 cases.
- Every method task has one owner from the team and an area.

## Planted mistakes

| Mistake | Method | Plain chat |
| --- | --- | --- |
| Passwords stored as plain text and emailed back | caught: "Store Argon2id hashes; provide identity-checked reset", raised by all 4 experts | caught: "Store password hashes, never plain-text passwords. Email a short-lived, single-use password-reset link" |
| Microservices, Docker and Kubernetes for a 2-week school project | caught: "exceed this team's skills and time. Better: Use one Django application" | caught: "Build one Python/Django application … Defer microservices, the API gateway, Docker and Kubernetes" |
| 2,000 photos of 5 MB in a 500 MB free database | caught: "10,000 MB is twenty times the allowance", reduce and store photos smaller | caught: "approximately 10 GB, 20 times the entire 500 MB database allowance", store files outside the database |

## Tokens

| Case | Method, round 1 | Method, round 2 | Plain chat, round 2 | Section 5 estimate (method) |
| --- | --- | --- | --- | --- |
| attendance | 11 turns · 289.5k in (30% cached) · 31.9k out | 9 turns · 234.7k in (54%) · 25.5k out | 13.3k in · 1.5k out | 7–10 turns · 60–120k in · 12–20k out |
| weekend-todo | 4 · 76.3k (50%) · 3.6k | 4 · 100.9k (68%) · 4.8k | 13.2k · 0.6k | 3–4 · 15–30k · 3–6k |
| hackathon-pitch | 10 · 299.5k (49%) · 26.7k | 9 · 190.8k (48%) · 23.2k | 13.4k · 1.9k | 7–10 · 60–120k · 12–20k |
| planted-mistakes | not run | 9 · 260.0k (56%) · 26.3k | 51.9k · 1.5k | 7–10 · 60–120k · 12–20k |

- Medium cases: 9 turns (one fix turn instead of one per expert, plus the shorten turn). Input dropped 20–35% from round 1 but is still about 2 times section 5's top estimate; output is still over.
- The small case's input rose (76k → 101k): longer rules in every prompt and the 3 quick-security lines.
- Codex adds about 13k tokens of its own to every call, which is most of the plain chat's input. The planted-mistakes plain chat took 52k, so that one turn made several requests inside Codex.
- **One Codex session across turns** (`codex exec resume`) exists and works, but costs more: on the weekend case it used 318k input tokens (52% cached) and 15k output, against 76k and 3.6k with separate calls, because each resumed turn re-sends the whole chat. It is behind `--shared-chat`, off. Claude Code has `--resume` too; not wired, because this round ran on Codex only.

## Fixed after the run

- **Security checklist check.** The one-turn fix step sent each part without its checklist answers, so a fixed part came back with none and replaced them. For attendance and planted-mistakes the security engineer's answers are lost from `plan.json`, so `checks.md` shows them all as unanswered; that is the bug, not the model. Fixed in `d98cc0701a` with a test. The plan text was not affected (checklist answers are not shown in the plan).
- **Microservices keyword check** missed "one Django application" and "Defer microservices" on both sides. The pattern is wider and both lines are test rows; `checks.md` is regraded.

## Still open

- Medium plans over 1,500 words after one shorten turn. Choices: a second shorten turn, or word budgets per section in the merge prompt.
- Field caps are told to the model but often missed (draft details up to 487 words, checklist answers up to 87). They are recorded, not cut; the merge rewrites the text the team reads.
- Each plan's fixed layout (headings, decision tables, an experts line) may let a reader guess which side is which.
