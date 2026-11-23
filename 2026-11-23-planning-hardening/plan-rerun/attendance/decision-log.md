# Decision log: Class Check-In

Written by codex gpt-6-astra, reviewed by claude claude-opus-5-5 (effort high). Stopped after round 1: no blocker was fixed, so no new review.

## Decisions

### 0001 Website and server

Picked: Django pages with plain HTML, CSS and JavaScript. Looked at: Django pages with plain HTML, CSS and JavaScript, React frontend with a separate Python service, Native phone app.

Why: This uses Sara’s Python and Adam’s and Yassine’s page skills. Django supplies account management; separate services or a native app add too much work.

Rule for agents: Use Django templates and plain HTML, CSS and JavaScript; add no front-end framework.

### 0002 Pilot database

Picked: SQLite. Looked at: SQLite, PostgreSQL.

Why: One database file keeps pilot setup small. PostgreSQL, a separate database server, can be considered if later traffic tests require it.

Rule for agents: Use SQLite and a database uniqueness constraint on each student/session pair to prevent duplicate attendance.

### 0003 Student identity

Picked: Local accounts from approved class lists plus a session code. Looked at: Local accounts from approved class lists plus a session code, School single sign-on, Anonymous name entry with a session code.

Why: School single sign-on, which reuses existing school logins, is unconfirmed. Imported accounts identify class members; teachers distribute initial passwords on individual printed slips and handle lost passwords through manual reset.

Rule for agents: Store passwords only as Django password hashes; check class membership and teacher assignment on the server for every attendance action.

### 0004 Live teacher list

Picked: Poll every five seconds. Looked at: Poll every five seconds, Persistent server connection, Manual refresh.

Why: Polling is simple enough for Adam to build on ordinary hosting. Manual refresh does not meet the live-list requirement.

Rule for agents: Refresh the active teacher list every five seconds, show refresh failures, and never overwrite saved teacher corrections with student retries.

### 0005 Check-in deadline

Picked: Server time controls the ten-minute window. Looked at: Server time controls the ten-minute window, Phone time controls the window, Teacher closes every session manually.

Why: Phone clocks can be wrong, and teachers can forget to close sessions. Sara builds the server rule; Adam’s countdown only displays the remaining time.

Rule for agents: Accept check-in only when opened_at <= server_now < opened_at + 10 minutes; allow authorized teacher corrections after closing.

### 0006 Hosting and launch

Picked: Approved free school EU host for real use; EU free demo host with invented records as fallback. Looked at: Approved free school EU host for real use; EU free demo host with invented records as fallback, Free public hosting for immediate department-wide use, Paid EU hosting.

Why: School hosting and approval are unknown. Free hosting needs its limits checked, and paid hosting breaks the budget.

## Reviews

| Round | Score | Words | Blockers | Shoulds | Nits |
| --- | --- | --- | --- | --- | --- |
| 1 | 8/10 | 1597 | 0 | 2 | 2 |

## What the writer did with each point

| Round | Id | Severity | From | Point | Outcome | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | R1 | should | reviewer | Adam is assigned Python/Django server work: in week 2 he builds session opening, server-checked deadlines and rule tests in app/attendance/ and tests/attendance/. In weeks 5–6 he also fixes code in app/attendance/. The plan's own skills section says Adam knows JavaScript, not Python, and gives Django learning time only to Sara. | fixed | Sara now owns week-2 session storage, opening and deadline tests with two extra planned hours, while Adam builds the pages and reports later server failures to her. |
| 1 | R2 | should | reviewer | The plan never says how students get their first login. It says to 'start with school-issued accounts' and not to build email delivery, but school login access is unknown. In practice the app's class-list import will create the accounts. Nothing says who creates the initial passwords or how a pilot class receives them without email. | fixed | Sara’s import creates one-time initial passwords for individual teacher-issued printed slips before the first session, with lost passwords handled through manual reset. |

## Nits, left as they are

- Round 1, R3: The week-5 target of '60 check-ins in one minute' on school Wi-Fi doesn't say how 60 check-ins will be made. Three people with a few phones can't produce that.
- Round 1, R4: Sara's week-1 slot covers both the school IT and data-rule meetings and learning Django. Realistically that leaves her a few hours of Django before she builds accounts, roles and the import in week 2.