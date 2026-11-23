# Decision log: Study Spot

Written by codex gpt-6-astra, reviewed by claude claude-opus-5-5 (effort high). Stopped after round 1: only nits left.

## Decisions

### 0001 What room status means

Picked: Recent check-in counts and explicit unknown availability. Looked at: Recent check-in counts and explicit unknown availability, Free/busy labels inferred from zero check-ins.

Why: There is no booking or occupancy feed. Zero reports cannot prove a room is free.

### 0002 Room browsing

Picked: A phone-friendly list grouped by building. Looked at: A phone-friendly list grouped by building, A campus map.

Why: The PDF supports a list without inventing coordinates. This keeps Tom's work within his available hours.

### 0003 Storage

Picked: SQLite on the demo laptop. Looked at: SQLite on the demo laptop, One JSON file, A hosted database.

Why: SQLite keeps reports in one file and supports updates from multiple browser sessions. Ilias avoids running a separate database service.

### 0004 Check-in identity

Picked: A random browser identifier with 60-minute expiry. Looked at: A random browser identifier with 60-minute expiry, University account login, Anonymous taps with no browser identifier.

Why: This allows checkout and prevents repeat taps from inflating counts without building login. Reports remain unverified, and forgotten check-ins expire.

### 0005 Demo delivery

Picked: React screens served by Flask on one laptop. Looked at: React screens served by Flask on one laptop, Separate hosted frontend and backend, A static screen mockup.

Why: Tom and Ilias use their existing skills, and the demo needs no paid service. A local working app supports the technical score, with phone access tested early.

## Reviews

| Round | Score | Words | Blockers | Shoulds | Nits |
| --- | --- | --- | --- | --- | --- |
| 1 | 8.5/10 | 1463 | 0 | 0 | 3 |

## What the writer did with each point

Nothing to fix.

## Nits, left as they are

- Round 1, R1: Noor's usability check (hours 6–12) asks testers to find a room and check out. But the plan only promises a working two-browser path by hour 12, so for that whole window testers only have Tom's screens with sample data, not a working app.
- Round 1, R2: Noor's 12-room list is finished in hours 2–6. In the same window, Ilias builds the database and the request that lists rooms. No handoff is named for getting the rooms into the database.
- Round 1, R3: Features freeze at hour 18, and Flask serves the finished React build. Yet Tom keeps fixing screens until hour 23, and the plan never says who rebuilds the screens and checks the served app after each fix.