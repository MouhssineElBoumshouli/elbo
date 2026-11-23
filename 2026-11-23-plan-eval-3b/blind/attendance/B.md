Build a small, mobile-friendly website for one department. Teachers use laptops; students use phone browsers. Aim for a working end-to-end version by week 2, a complete first release by week 4, and testing and the teacher demo in weeks 5–6.

The team has 144 hours: 24 hours per week, or 8 hours per person per week. Keep the scope fixed so testing and deployment fit inside that limit.

## First-release scope

- Teacher signs in, selects an assigned class, and opens an attendance session.
- The server sets a 10-minute check-in window. Students sign in and enter the session code shown by the teacher.
- Only enrolled students can check in, once per session. The server decides whether the window is still open.
- The teacher’s list refreshes automatically every few seconds, showing present, not yet checked in, and—after closing—absent students.
- Teachers can correct attendance, including after the window closes. Record who made each correction and when.
- Teachers can download a CSV for a selected session, with student ID, name, attendance status, and check-in time.
- A minimal session history lets teachers reopen lists for corrections and export.

A session code can be shared remotely. This release records check-ins; it does not prove physical presence. The teacher should accept this limitation in week 1 and use manual corrections when needed.

Defer statistics, absence emails, native apps, timetable integration, geolocation, and a full administration interface. Load class assignments and student rosters from an agreed school-provided CSV using an import script.

## Technical approach

Use a Python backend with Django, PostgreSQL, and simple server-rendered HTML/CSS with small JavaScript enhancements. This matches Sara’s skills, gives Yassine accessible UI work, and lets Adam implement check-in interactions and automatic list refresh without maintaining a separate React application.

Keep attendance rules in small pure functions, with database access and request handling around them. Test the deadline, enrollment, duplicate check-ins, and correction rules independently of a running server. Add integration checks for permissions and persistence.

Use a plain school-style layout: clear page titles, readable tables, large phone controls, and explicit success and error messages. Avoid third-party analytics, fonts, or scripts.

## Resolve these dependencies in week 1

The plan assumes the school can provide an existing EU-hosted server and database, HTTPS, and an approved way to manage accounts at no additional cost. Free software alone does not guarantee free compliant hosting.

By day 3, confirm:

- A hosting environment with enough capacity, with student data, backups, and any logs containing student data kept in the EU.
- School Wi-Fi access to the actual HTTPS deployment from both teacher and student networks.
- A roster containing stable student IDs, class membership, and teacher assignments.
- The account approach: use existing school sign-in only if it is already available and straightforward to connect. Otherwise obtain school approval for provisioned local accounts, password delivery, and resets.
- Who owns account administration, backups, access decisions, and the school’s retention requirements.
- The largest class and likely number of simultaneous sessions, to set a realistic load-test target.

If hosting or account approval is unresolved by the end of week 1, flag the live rollout as blocked. Continue with synthetic data for the demo; do not upload real student data to an unverified service. A live deployment date then depends on the school resolving those blockers.

## Six-week schedule and effort

Each cell allocates 8 hours. Each person totals 48 hours; the project totals 144 hours.

| Week | Adam — JavaScript | Sara — Python/SQL | Yassine — HTML/CSS |
|---|---|---|---|
| 1 | Agree teacher workflow, sketch screens, define acceptance checks and browser interactions | Confirm hosting/accounts; create schema, project skeleton, and initial deployment | Build school-style page templates; test phone layouts and school Wi-Fi with Adam |
| 2 | Build student check-in interaction and teacher list refresh | Implement authentication, class permissions, roster import, session opening, and check-in endpoint | Implement login, class selection, session, and student check-in pages |
| 3 | Add corrections UI, duplicate-submit protection, and connection/error states | Implement correction records, session history, CSV export, and core rule tests | Improve attendance table, mobile usability, keyboard access, and clear status messages |
| 4 | Integrate complete workflows; fix refresh and browser issues | Add authorization/integration tests; verify backup and restore and export behavior | Run scripted usability checks; fix layouts; draft teacher/student instructions |
| 5 | Run school Wi-Fi pilot and agreed load checks; fix observed issues | Support pilot; inspect data consistency and access controls; resolve backend defects | Observe teacher and student use; fix usability issues; finish instructions |
| 6 | Regression checks, demo rehearsal, demo support, and contingency fixes | Deployment verification, handover, demo support, and contingency fixes | Final device checks, demo preparation, handover, and contingency fixes |

Week 2 milestone: a teacher opens a session, a student checks in, and the teacher sees the result on the deployed test system.

Week 4 milestone: all first-release features work together. Freeze features here.

Week 5 milestone: one volunteer teacher and a small student group complete a pilot on school Wi-Fi. Use approved accounts and data, or synthetic records if approval is pending.

Week 6: reserve at least 12 of the week’s 24 hours for defects and contingency. Rehearse by day 39 and hold the teacher demo by day 42. Bring a synthetic dataset and a short backup recording in case the demo network fails.

## Acceptance checks

- A teacher can open a session only for an assigned class.
- An enrolled student can check in before the server’s deadline; a check-in at or after 10 minutes is rejected.
- Repeated taps, retries, and simultaneous requests cannot create duplicate attendance records.
- Students cannot see classmates’ attendance or edit their own status; teachers cannot access another teacher’s classes without explicit permission.
- A successful check-in appears on the teacher’s list within about five seconds under the agreed test load.
- Failed or uncertain submissions show a useful message; reconnecting fetches the saved status before retrying.
- Manual corrections remain saved after refresh and appear correctly in CSV exports.
- Exported rows match the roster and final attendance statuses; names with accents and commas export correctly, and spreadsheet formula injection is handled.
- The main flow works on representative student phones and teacher laptops using school Wi-Fi.
- A backup can be restored, and the school has a named person responsible for operating the service.

## Scope and risk decisions

School Wi-Fi access does not establish physical presence, and the site requires connectivity. If students cannot connect, the teacher marks attendance manually; offline synchronization is outside this release.

The largest schedule risks are hosting approval, account setup, roster quality, and unfamiliar tooling. Address them in week 1, have Sara review Yassine’s template integration, and keep the architecture small. If work slips, simplify visual polish and optional interactions. Keep authentication, permission checks, the 10-minute rule, manual corrections, CSV export, and testing intact.

The day-42 deliverable is a demonstrated, tested first release with setup instructions and an operating owner. Department-wide launch follows only when hosting, account approval, Wi-Fi checks, and the pilot have passed.
