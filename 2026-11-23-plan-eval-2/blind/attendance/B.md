# Plan: Class Attendance

Medium plan · 18 tasks · Experts: project manager, software architect, security engineer, designer. Decisions are proposals until you agree.

## Where we disagree with the brief

- **Launch the whole department on free hosting by week 6.** (raised by the project manager, the software architect and the security engineer): Capacity, access and EU handling of login, logs and backups are unconfirmed. Better: Approve hosting and test a small pilot; use invented data if prerequisites fail.
- **Phone check-in proves classroom presence.** (raised by the security engineer): Codes and accounts can be shared; Wi-Fi proves no presence. Better: Require login, membership, teacher spot checks and recorded corrections.
- **Every present student must check in by phone within ten minutes.** (raised by the designer): Dead phones or failed Wi-Fi prevent submission. Better: Keep the deadline; offer teacher-assisted corrections.

## Choices for you

- Who approves EU hosting, login, rosters, retention, exports and backup ownership? Can access arrive in week 1? (School arrangements: supported real use; availability unconfirmed. / Verified free arrangements: no spending; approval and operations consume hours. / Invented-data demo: meets deadline; provides no attendance service.)
- Which teacher, class and Wi-Fi slot are available? What simultaneous department demand needs later support? (One teacher, up to 30 students: manageable; limited capacity evidence. / Smaller class: easier coordination; weaker traffic evidence. / Invented classroom test: avoids approvals; misses classroom behaviour.)
- Which visual reference should Yassine follow? (School style guide: consistent; requires access. / Existing school page: quick; may lack accessibility guidance.)
- Does the teacher accept check-ins with spot checks and corrections? (Yes: fits scope; shared-code cheating remains possible. / No: retain existing attendance; demonstration helps, but requirements need revision.)

## 1. What we build and for whom

**In short:** Build attendance for 40 teachers and 1,200 students; demonstrate on day 42.

> Go deeper: Adam handles JavaScript, Sara Python/SQL, and Yassine HTML/CSS. Plan 100 hours, including 12 learning hours. Reserve 44 of 144 hours: Adam 15, Sara 15, Yassine 14.

## 2. Must-haves and later

**In short:** Deliver sessions, ten-minute check-in, live lists, recorded corrections and CSV export.

> Go deeper: How broadly to launch by week 6: a proposed one-teacher, 30-student pilot fits six weeks but proves limited capacity. Department-wide launch reaches everyone but exceeds tested support. Statistics, emails and native apps wait.

**Done means:**
- Open a session: Only assigned teachers succeed; reload preserves membership and the server-set ten-minute deadline.
- Timed student check-in: Enrolled students succeed before closing; late/unauthorized requests fail; retries create no duplicates.
- Live list and corrections: Under approved school Wi-Fi load, saves appear within five seconds; failures show warnings; corrections retain reason, editor and time.
- CSV export: Assigned teachers receive the complete session roster and corrections, without other classes or executable spreadsheet formulas.

**Decision 0001: How broadly to launch by week 6**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Small classroom pilot** (picked) | Tests the complete flow on school Wi-Fi with manageable support. | Does not prove department-wide capacity. | Fits the 100 planned hours, subject to school approval and passing tests. |
| Immediate department-wide launch | All teachers and students can benefit immediately. | Adds uncertain traffic, account setup, training and support. | Too risky to promise within six weeks and a free-only budget. |

Why: Build for the department, but expand only after testing access, Wi-Fi and simultaneous check-ins. Proposed by the project manager.

## 3. Stack and why

**In short:** Use Django pages, small JavaScript functions and SQLite.

> Go deeper: Application structure: Django/SQLite fits the team's skills but needs learning and simultaneous-write tests. React plus Python suits Adam but adds setup. Free hosting with EU storage: school hosting offers support but is unconfirmed; a verified free EU service needs approval and operating work.

**Decision 0004: Free hosting with EU storage**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School-managed EU server** (picked) | May provide storage, backups and support without spending. | Availability and capacity are unknown. | First choice if school IT confirms it in week 1. |
| PythonAnywhere EU free service | Offers a Python app and persistent storage for a demo. | Limited worker and disk capacity, expiry and no scheduled tasks for new free accounts. | Conditional demo or tested small pilot only; school approval must cover all data destinations. |

Why: School support is preferable, but not assumed. Use invented data if no approved free arrangement exists. Proposed by the software architect.

**Decision 0005: Application structure**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Django pages with SQLite** (picked) | One project with built-in forms, sessions and database tools. | Django needs learning; SQLite permits one writer at a time. | Uses Sara’s Python, Adam’s JavaScript and Yassine’s HTML/CSS with 12 planned learning hours. |
| React front end and Python API | Uses Adam’s React experience. | Adds separate builds and more login integration. | Too much setup for the six-week schedule. |

Why: Simple forms and a changing list fit one application. Test short simultaneous writes before expanding. Proposed by the software architect.

## 4. How the parts fit together

**In short:** The server checks identity, membership, deadlines and attendance.

> Go deeper: Keep rules in pure functions; keep database/network actions outside. Reuse helpers; split files near 400 lines. Request updates every four seconds without overlap. Show stale-list warnings. One record per student/session prevents duplicate retries.

```
Student phone ── login + check-in ──┐
Teacher laptop ── open/fix/export ──┼── HTTPS ── Django ── SQLite
Teacher laptop ── poll every 4s ────┘                      │
                                                 EU backup storage
```

## 5. Data and privacy

**In short:** Keep minimal student data in approved EU locations.

> Go deeper: Store identifiers, names, memberships, assignments, sessions, attendance and correction history. Save membership when sessions open. Agree deletion dates, export locations and daily backup ownership before importing students. Measure storage; encrypt separate restricted backups and test recovery. Avoid tracking, external analytics and names in logs.

## 6. Security risks and what we do about them

**In short:** Require school login and server permission checks.

> Go deeper: Account identity: school login reduces password support but needs integration and failed-login protection. Local accounts avoid that dependency but exceed support hours; use them only for invented demo records. Require encrypted web traffic, protected login cookies and cross-site submission protection. Keep secrets outside code; neutralize spreadsheet formulas in exports.

**Decision 0002: Where real student data may run**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School-provided EU hosting** (picked) | May include approved backups and a support contact. | Free capacity, HTTPS and access remain unconfirmed. | Preferred if school IT can provide it promptly. |
| Verified free EU service | Could meet the budget. | Needs checks on processing, logs, backups, support access and limits. | Use real data only after school approval covers every destination. |
| Invented-data demo | Preserves the week-6 demonstration without exposing student records. | Does not provide a live department rollout. | Required fallback if hosting or identity remains unresolved. |

Why: An EU database setting alone does not establish that the whole service meets the EU-only rule. Proposed by the security engineer.

**Decision 0003: Account identity**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School login** (picked) | School handles identity, passwords and recovery. | Needs access and a compatible integration. | Conditional first choice within T1 and T4. |
| Local accounts | Can operate without school login integration. | Adds provisioning, password storage, recovery and support. | Invented demo accounts only until real-account work has owners and an approved hour budget. |

Why: The 100-hour plan does not fund a real local-account service. Proposed by the software architect.

## 7. The look and the main screens

**In short:** Build four clear, school-style screens for phones and laptops.

> Go deeper: How students reach the session: typed code plus optional QR reduces typing but needs testing; cap QR at Adam's one hour by week 3. Typed code alone is simpler but slower. Use saved receipts, labels, keyboard access and readable contrast. Project only address, code and closing time.

**Decision 0006: How students reach the session**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Typed code, with optional QR shortcut** (picked) | Always offers camera-free entry; QR can reduce typing. | QR adds generation and scan checks. | Typed entry is committed. QR gets at most one Adam hour within T13 and a week-3 cutoff. |
| Typed code only | Few controls and no camera dependency. | More typing and possible mistakes. | Automatic fallback if QR exceeds its allowance or required work slips. |

Why: Both routes use the same protected check-in page. Show the class before submission and keep identity checks separate from the code. Proposed by the designer.

## 8. Who does what, and in what order

**In short:** Finish features by week 4; trial in week 5; test and demonstrate in week 6.

| Area | Folders | Owner |
| --- | --- | --- |
| Server | `app/rules/`, `app/models/`, `app/views/`, `tests/server/`, `ops/` | Sara |
| Browser | `static/js/`, `tests/browser/` | Adam |
| Pages | `templates/`, `static/css/`, `docs/` | Yassine |

| Week | Tasks |
| --- | --- |
| 1 | T1 Prerequisites and learning: 9h (Sara · Server) · T2 Learning and setup: 4h (Adam · Browser) · T3 Wi-Fi, learning and sketches: 9h (Yassine · Pages) |
| 2 | T4 Roster storage, login and permissions: 9h (Sara · Server) · T5 Login, session and check-in controls: 11h (Adam · Browser) · T6 Import pages and accessible layouts: 8h (Yassine · Pages) |
| 3 | T7 Timed rules, corrections and list: 6h (Sara · Server) · T8 Updates, feedback and joining: 8h (Adam · Browser) · T9 Student, teacher and projection layouts: 7h (Yassine · Pages) |
| 4 | T10 Export, hosting, deletion and backups: 4h (Sara · Server) · T11 Export control and integration: 4h (Adam · Browser) · T12 Guide and supervised recovery: 3h (Yassine · Pages) |
| 5 | T13 Load, login and recovery tests: 2h (Sara · Server) · T14 Fixes and rehearsal: 3h (Adam · Browser) · T15 Phone, keyboard, Wi-Fi trial and guidance: 4h (Yassine · Pages) |
| 6 | T16 Rules, permissions, recovery and fixes: 3h (Sara · Server) · T17 Deadline, retries, network and fixes: 3h (Adam · Browser) · T18 Usability, acceptance and demo: 3h (Yassine · Pages) |

| When | Working by then | Cut first if it slips |
| --- | --- | --- |
| Week 1 | Dependencies checked; setup and sketches ready. | Real-data trial without approval. |
| Week 2 | Login, permissions, roster and timed submission work. | Visual polish. |
| Week 3 | Protected attendance and live list work. | QR. |
| Week 4 | Corrections, export and operations complete. | Optional work. |
| Week 5 | Approved trial, recovery check and rehearsal complete. | Trial breadth. |
| Week 6, day 42 | Tests, fixes and demonstration. | Use invented data if real-use conditions fail. |

## 9. Risks

**In short:** Hosting, school access and classroom traffic can block real use.

| Risk | Chance | Impact | What we do | Who watches |
| --- | --- | --- | --- | --- |
| EU hosting or identity unavailable | medium | high | Resolve in week 1; otherwise use invented records. | Sara |
| Wi-Fi or simultaneous submissions fail | medium | high | Test classroom traffic, retries and teacher corrections. | Adam |
| Unauthorized access or data leaving approved locations | medium | high | Test denied requests; approve exports/backups; report incidents to school. | Sara |
| Scope consumes reserve | medium | high | Track hours weekly; freeze features after week 4. | Adam |

## 10. Smaller choices

- **How people log in:** School login (also looked at: School-provisioned local accounts). Confirm integration and EU handling in week 1. Do not quietly add a real local-password service to the existing schedule.

## 11. Words used

- **Django:** Python website-building tools.
- **SQLite / SQL:** A single-file database / language for reading and changing records.
- **React:** JavaScript tools for building interfaces.
- **Pure function:** Inputs produce outputs without outside actions.
- **CSV:** A text table spreadsheets can open.
- **QR:** A camera-readable code opening a link.
