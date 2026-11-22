Build a phone-friendly room list that shows recent student reports, supports check-in and checkout, and is ready for a rehearsed live demo by hour 22. Reserve the final two hours for recovery and the pitch.

The key constraint: the PDF identifies rooms, but cannot tell you which are free. Present availability as crowdsourced information, with timestamps. Do not label a room free just because nobody has checked in.

### Day-one scope

- Searchable room list, grouped or filtered by building. Choose a list over a map to avoid needing coordinates.
- Three clear statuses: **Reported free**, **In use**, and **Unknown**. Show active check-in count and when availability was last reported.
- “I’m here” and “Check out” actions. At checkout, optionally ask “Does the room look empty?” to create a free report.
- Anonymous browser identity; one active check-in per browser. Repeat taps must not create duplicate check-ins.
- Check-ins expire after two hours; free reports expire after 15 minutes. These are prototype assumptions, explained in the interface. Expired reports become unknown, never automatically free. Active check-ins take precedence over free reports.
- Friendly empty, loading, and connection-error states; large touch targets and status labels that do not rely only on colour.

“In use” means someone reported being there, not that every seat is taken. Without capacity data, show the count rather than a fullness percentage. Do not promise bookings or guaranteed availability.

Defer maps, notifications, university login, noise levels, favourites, and AI.

### Ownership and implementation

| Owner | Responsibility | Hours |
|---|---|---:|
| Noor | Extract and verify PDF room data, Figma screens, mobile usability, pitch and demo direction | 16 |
| Tom | React interface, browser identity, check-in flow, API integration, mobile behaviour | 18 |
| Ilias | Flask API, persistent storage, report expiry, deployment, demo reset | 18 |
| **Total** | | **52** |

Use React, Flask, and a small SQLite database on a single app instance. Serve the frontend and API together to simplify deployment. Use only a hosting option confirmed at kickoff to support this setup at no cost; if none is available, prepare a laptop-hosted demo with a tested phone connection. Do not spend the hackathon solving hosting problems.

Keep occupancy rules in small pure functions: derive status from reports and a supplied time, enforce precedence, and decide whether a check-in is allowed. Keep database access and the clock in the API layer. Split touched files before they grow past roughly 400 lines, and reuse shared rules.

Store room ID, name, and building from the PDF. Store anonymous check-in IDs and timestamps; collect no names or location tracking. Treat this as a prototype: browser identity cannot reliably prevent abuse.

### 24-hour schedule

Hours below are elapsed from kickoff. Person-hours within each window are work budgets, leaving time for meals and rest.

| Window | Deliverable and handoff | Noor | Tom | Ilias |
|---|---|---:|---:|---:|
| H0–2 | Agree status rules and API contract; inspect PDF; sketch screens; verify hosting and pitch connectivity | 2 | 2 | 2 |
| H2–6 | Noor delivers verified room data and screens; Tom builds list and actions; Ilias builds storage and API; deploy a basic page | 4 | 4 | 4 |
| H6–10 | Connect the real room list to the API; demonstrate check-in on one browser appearing on another | 2 | 4 | 4 |
| H10–14 | Finish checkout, expiry, refresh, duplicate handling, and error states; run mobile usability checks | 2 | 3 | 3 |
| H14–18 | Test core rules and two-browser flows; fix blockers; draft pitch; feature freeze at H18 | 2 | 2 | 2 |
| H18–22 | Rehearse timed demo, verify persistence and connectivity, capture backup recording, finish slides | 2 | 2 | 2 |
| H22–24 | Final smoke check and demo reset; preserve contingency time; pitch at H24 | 2 | 1 | 1 |
| **Total** | | **16** | **18** | **18** |

All code, designs, slides, and demo assets are created during the event. At kickoff, verify the organisers’ policy on ordinary frameworks and dependencies.

### Milestones and scope cuts

- **H2:** Room-data format, status meanings, API contract, and hosting path agreed.
- **H6:** A deployed shell, working API, and verified room subset exist. If PDF extraction is slow, use 10–20 verified rooms and label coverage clearly.
- **H10:** The essential live loop works across two browsers: list → check in → updated count → check out. If behind, cut search and visual polish; preserve this loop.
- **H18:** Feature freeze. Only demo blockers, correctness issues, and usability fixes enter afterward.
- **H22:** Complete one uninterrupted three-minute rehearsal, with backup assets ready.

Tom can build against agreed sample API responses while Ilias implements the endpoints. Noor’s verified room data is needed for the final import, but should not block integration with a few clearly marked development rooms.

### Acceptance checks

The entry is ready when:

- A student can find a room and check in or out on a phone without horizontal scrolling.
- A second browser sees updates within 10 seconds through simple polling.
- Duplicate taps do not inflate counts; switching rooms ends the previous check-in.
- Checkout removes only the current browser’s check-in.
- Expiry, conflicting reports, and rooms with no reports produce the correct status. Test these rules without a database or network.
- A failed request does not show a false success, and refresh preserves the student’s current check-in.
- Room data survives an app restart, and demo reset affects only clearly labelled demo data.

Use a short integration check for simultaneous check-ins and persistence, plus manual testing on a real phone. Avoid spending time on broad test infrastructure.

### Three-minute pitch

- **0:00–0:30 — Problem:** Students waste time walking between rooms without knowing where to study.
- **0:30–0:50 — Approach:** Recent student reports make room use visible, with honest uncertainty where reports are missing.
- **0:50–2:10 — Live demo:** Find a room, check in on a phone, show the count changing on the projected browser, then check out and report it empty. Point out the timestamp and unknown state.
- **2:10–2:40 — Technical execution:** Explain shared updates, persistent check-ins, automatic expiry, and the lack of university booking data.
- **2:40–3:00 — Impact and next step:** Propose a small campus pilot to measure time spent finding a room and agreement between reports and observed occupancy. Do not claim measured impact yet.

Noor presents; Tom operates the projected browser; Ilias monitors the app and handles recovery. Keep any populated demonstration rooms visibly labelled as demo data. Record the working flow during the event and keep screenshots available if connectivity fails.

The strongest entry is a small, reliable demonstration of useful crowdsourced availability, with a clear explanation of what the app knows and what it does not.
