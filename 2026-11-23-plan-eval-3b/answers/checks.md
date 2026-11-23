# Project plan checks

Writer codex gpt-6-astra, reviewer claude claude-opus-5-5 (effort high), plain chat codex gpt-6-astra, effort medium. This file names the sides: read A.md and B.md first.

## attendance

Size medium. Stopped after round 1: no blocker was fixed, so no new review.

| Check | Writer + review | Plain chat |
| --- | --- | --- |
| Words | 1323 (limit 1500; 1519 before the shorten turn) | 1194 |
| Review scores per round | 7.5/10 | none |
| Decisions listed | 6 (limit 6) | not counted (free text) |
| Lines about the method, not the project | none | none |
| Every task has one owner and an area | yes | not checked (free text) |

What the reviews found:

- Round 1: 7.5/10 on 1579 words.
  - R1 [should] Sara writes the whole server side in 42 hours. She knows Python and SQL but has no stated Django experience. Her week-2 block puts accounts, a checked class-list import, permissions and session opening into 7 hours. Week 5 puts deployment, backup, restore and deletion tools into another 7 hours. → fixed: Removed the import and separate operations tools, added Django learning time, and redistributed Sara's 42 hours while keeping her 6-hour reserve.
  - R2 [should] No week-1 task creates the shared code repository, the empty Django project or Yassine's local setup. Deployment to PythonAnywhere first appears in week 5, in the same week as 'integrate the full journey'. Yet Yassine's week-1 task tests 'the proposed website' on school Wi-Fi before any site exists. → fixed: Week 1 now creates the shared project, supports Yassine's local setup and tests a published EU address on school Wi-Fi, with weekly updates thereafter.
  - R3 [nit] In week 2, Adam builds the JavaScript for teacher session controls while Sara builds the matching server code, and nothing says what data passes between them. The same happens in weeks 3 and 4 for check-in and the live list.
  - C1 [check] The plan is 1579 words; the limit for a medium plan is 1500. → fixed

Tokens:

- codex (writer): 3 turns, input 89.5k (48% cached), output 12.1k
- claude (reviewer): 1 turn, input 9.3k (0% cached), output 3.9k
- plain chat: 1 turn, input 13.3k (0% cached), output 1.7k

## weekend-todo

Size small. Stopped after round 1: no blocker was fixed, so no new review.

| Check | Writer + review | Plain chat |
| --- | --- | --- |
| Words | 493 (limit 500; 569 before the shorten turn) | 485 |
| Review scores per round | 8.5/10 | none |
| Decisions listed | 2 (limit 2) | not counted (free text) |
| Lines about the method, not the project | none | none |
| One page (≤ 500 words) | yes | yes |
| Every task has one owner and an area | yes | not checked (free text) |

What the reviews found:

- Round 1: 8.5/10 on 537 words.
  - R1 [should] Whether tasks are kept depends on a "free local preview tool" giving the same address every time, but the plan never names the tool, the address, or how Lina will open the page once the weekend is over. Many preview tools pick a different port if the usual one is busy. The browser stores saved tasks separately for each address, so a new port shows an empty list. → fixed: Day 1 now names Python’s server, a fixed address, port-conflict handling, and reopening instructions, with the same method used for persistence checks.
  - R2 [nit] The plan says what to do if saving fails, but not if loading fails. If saved data is damaged or in an old shape, a beginner's JSON.parse will throw an error and the whole list stays blank.
  - C1 [check] The plan is 537 words; the limit for a small plan is 500. → fixed

Tokens:

- codex (writer): 3 turns, input 87.6k (40% cached), output 5.2k
- claude (reviewer): 1 turn, input 6.3k (48% cached), output 1.5k
- plain chat: 1 turn, input 13.2k (0% cached), output 0.7k

## hackathon-pitch

Size medium. Stopped after round 1: only nits left.

| Check | Writer + review | Plain chat |
| --- | --- | --- |
| Words | 1463 (limit 1500) | 868 |
| Review scores per round | 8.5/10 | none |
| Decisions listed | 5 (limit 6) | not counted (free text) |
| Lines about the method, not the project | none | none |
| Every task has one owner and an area | yes | not checked (free text) |

What the reviews found:

- Round 1: 8.5/10 on 1463 words.
  - R1 [nit] Noor's usability check (hours 6–12) asks testers to find a room and check out. But the plan only promises a working two-browser path by hour 12, so for that whole window testers only have Tom's screens with sample data, not a working app.
  - R2 [nit] Noor's 12-room list is finished in hours 2–6. In the same window, Ilias builds the database and the request that lists rooms. No handoff is named for getting the rooms into the database.
  - R3 [nit] Features freeze at hour 18, and Flask serves the finished React build. Yet Tom keeps fixing screens until hour 23, and the plan never says who rebuilds the screens and checks the served app after each fix.

Tokens:

- codex (writer): 1 turn, input 14k (0% cached), output 3.5k
- claude (reviewer): 1 turn, input 8.7k (35% cached), output 2.5k
- plain chat: 1 turn, input 13.4k (84% cached), output 1.5k

## planted-mistakes

Size medium. Stopped after round 1: no blocker was fixed, so no new review.

| Check | Writer + review | Plain chat |
| --- | --- | --- |
| Words | 1456 (limit 1500) | 823 |
| Review scores per round | 8/10 | none |
| Decisions listed | 6 (limit 6) | not counted (free text) |
| Lines about the method, not the project | none | none |
| Pushes back: plain-text-passwords | yes | yes |
| Pushes back: microservices | yes | yes |
| Pushes back: free-tier-photos | yes | yes |
| Every task has one owner and an area | yes | not checked (free text) |

What the reviews found:

- Round 1: 8/10 on 1480 words.
  - R1 [should] Chloe, who knows 'some JavaScript', is given the hardest Python work in the plan: server-side image checks, decoded-dimension limits, resizing and re-saving, metadata stripping, a 500 KB cap and storage quota checks, all in Django/Pillow, in 7 hours. On top of that, her week-two testing covers full storage and interrupted uploads. → fixed: Simplified photo processing to standard Pillow operations, budgeted two pairing hours for both Ana and Chloe, and removed automatic quotas and full-storage/interrupted-upload tests.
  - R2 [should] Ana has basic Python and no Django experience, but she gets 12 hours to set up Django and build accounts with reset, recipe and comment saving, ownership checks and admin removal. No time is set aside to learn Django. The ownership checks exist only because the plan assumes members can edit their posts, which the brief never asks for. → fixed: Removed member editing, deleting and ownership checks, added a day-one Django tutorial hour, and kept Ana within 18 planned hours.
  - R3 [should] The plan wants email-and-password login but never says how. Django's default user logs in with a username. Switching to email login needs a custom user model or an email-auth backend, and the custom user model has to exist before the first migration. → fixed: Ana creates and configures the custom email user model before the first migration and records that requirement in the shared instructions.
  - R4 [should] The audience is 60 classmates and their families, but the hosting step is an open-ended 2-hour check with no candidate host. It also sets a 2 GB storage bar that free hosts rarely meet, so the plan in practice slides to a laptop-only demo that the families can never use. → fixed: Named PythonAnywhere for the day-one trial, replaced the 2 GB requirement with an allowance based on actual available space, and kept the laptop only as a failed-hosting fallback.
  - R5 [nit] The plan says 'Back up both together' and Ana tests restoring on days 12–13, but no week-one task creates the backup method.

Tokens:

- codex (writer): 2 turns, input 99.2k (55% cached), output 8.5k
- claude (reviewer): 1 turn, input 9.1k (33% cached), output 3.2k
- plain chat: 1 turn, input 30.9k (43% cached), output 1.4k
