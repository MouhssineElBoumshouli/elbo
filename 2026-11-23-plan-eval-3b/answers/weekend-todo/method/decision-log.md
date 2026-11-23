# Decision log: Quiet Tasks

Written by codex gpt-6-astra, reviewed by claude claude-opus-5-5 (effort high). Stopped after round 1: no blocker was fixed, so no new review.

## Decisions

### 0001 How to build it

Picked: HTML, CSS, and plain JavaScript. Looked at: HTML, CSS, and plain JavaScript, A JavaScript framework, which supplies extra tools for building interfaces.

Why: Plain JavaScript fits Lina’s skills and learning goal; a framework adds unnecessary setup.

### 0002 Saving and reopening

Picked: localStorage at a fixed address served by Python 3. Looked at: localStorage at a fixed address served by Python 3, localStorage with index.html opened directly, localStorage with an unspecified preview tool, A local database file with a server, A hosted database.

Why: A fixed address preserves access without a database; Python’s server does not silently switch ports. Direct-file storage varies across browsers, and an unspecified preview tool leaves reopening unclear.

## Reviews

| Round | Score | Words | Blockers | Shoulds | Nits |
| --- | --- | --- | --- | --- | --- |
| 1 | 8.5/10 | 537 | 0 | 1 | 1 |

## What the writer did with each point

| Round | Id | Severity | From | Point | Outcome | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | R1 | should | reviewer | Whether tasks are kept depends on a "free local preview tool" giving the same address every time, but the plan never names the tool, the address, or how Lina will open the page once the weekend is over. Many preview tools pick a different port if the usual one is busy. The browser stores saved tasks separately for each address, so a new port shows an empty list. | fixed | Day 1 now names Python’s server, a fixed address, port-conflict handling, and reopening instructions, with the same method used for persistence checks. |
| 1 | C1 | should | check | The plan is 537 words; the limit for a small plan is 500. | fixed | The Markdown plan is under 500 words and keeps the schedule, checks, and matching data. |

## Nits, left as they are

- Round 1, R2: The plan says what to do if saving fails, but not if loading fails. If saved data is damaged or in an old shape, a beginner's JSON.parse will throw an error and the whole list stays blank.