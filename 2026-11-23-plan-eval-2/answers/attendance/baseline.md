Build a mobile-friendly website for students and a laptop-friendly teacher view. Target a working pilot demo on day 42, with all four required features complete. A department-wide rollout depends on confirming school hosting, access and capacity during the project.

Scope for day one

- Teacher selects an assigned class and opens an attendance session. The server records the start time and closes student check-in exactly 10 minutes later.
- Students sign in, enter a short session code shown by the teacher, and check in once. Only students on that class’s roster can check in.
- Teacher sees the roster with present and absent statuses, refreshed automatically within five seconds, without reloading the page.
- Teacher can correct attendance during or after the check-in window. Corrections record who changed what and when.
- Teacher downloads a CSV for the selected session, including student identifier, name and attendance status.
- Students see their own check-in confirmation; only authorized teachers see class attendance.

Defer student statistics, absence emails and a native app. Also defer timetable integration, self-service enrollment, custom reporting and location-based attendance checks. A session code can be shared: this version records check-ins but does not prove physical presence. Teacher corrections handle obvious discrepancies.

Implementation

Use a single Python web application, SQL storage and simple HTML/CSS pages with small JavaScript components. This matches Sara’s backend skills, Adam’s JavaScript skills and Yassine’s frontend skills while avoiding a separate React application and API.

Use five-second polling for the live roster. Enforce the time window, enrollment, teacher permissions and duplicate prevention on the server. Keep these rules in small pure functions that can be tested without a database or network; use integration tests for storage and permissions.

Use existing school sign-in if integration is available and small enough. Confirm this in week 1; do not build a new password-management system within this budget. Prepare class, teacher and student assignments through a validated roster import, rather than building an administration interface.

Use a restrained school-style layout: familiar typography, clear labels, large phone buttons and readable attendance tables. Show loading, success, closed-session and connection-error states explicitly.

Week 1 decisions and dependencies

The department must provide a teacher contact, an approved roster source, a sign-in route and an EU hosting environment that costs the team nothing. Check school-managed hosting first. Confirm that the database, backups, logs and authentication services keep student data in the EU; avoid third-party analytics.

Agree who can access attendance and when records should be deleted. Test the intended HTTPS address on actual school Wi-Fi, using both a laptop and a phone.

By day 7, confirm hosting and identity integration. If either is unavailable, continue toward a synthetic-data demo in an approved environment and flag real-student deployment as blocked. Do not silently replace reliable identity with students typing arbitrary names.

Six-week schedule and effort

Each person has eight hours per week, including meetings, testing and fixes: 48 hours each, 144 hours total. The following are total project hours, not separate coding allowances.

| Week | Adam — 8 hours | Sara — 8 hours | Yassine — 8 hours | Completion checkpoint |
|---|---|---|---|---|
| 1 | Map teacher/student flows; investigate sign-in integration | Confirm EU hosting; define data model and roster import | Make phone/laptop mockups; test school Wi-Fi with teacher | Scope, hosting, identity and roster route agreed |
| 2 | Implement check-in interaction and confirmation | Implement access, roster import, session opening and timed check-in | Build responsive student and teacher pages | One teacher opens a session and a rostered student checks in end to end |
| 3 | Add live roster updates and correction controls | Add correction permissions, change history and CSV export | Add status, empty, error and accessible form states | All four must-have features work in a test environment |
| 4 | Test reconnects, duplicate submissions and phone behavior | Test timing boundaries, access, imports and CSV safety | Run classroom usability test on school Wi-Fi; fix layout issues | Small supervised pilot passes the core acceptance checks |
| 5 | Fix pilot defects and test simultaneous check-ins | Check deployment, backup/restore and data handling | Prepare teacher guide and rehearse teacher workflows | Release candidate is ready; no new features |
| 6 | Reserve time for integration fixes and demo support | Reserve time for deployment fixes and recovery checks | Prepare demo data, run rehearsal and support presentation | Demo delivered by day 42 |

Week 6 supplies 24 hours for final fixes, rehearsal and delivery. It is not a slot for deferred features. Keep the weekly teacher review short and include it in these allocations.

Acceptance checks

- An authorized teacher can open a session only for an assigned class.
- An enrolled student can check in before the server’s 10-minute deadline; a submission at or after the deadline is rejected. The deadline uses server receipt time.
- Repeated taps or retries create one attendance record and return a clear result.
- The teacher’s list updates within five seconds under the agreed classroom load.
- Teacher corrections persist after refresh and appear in the exported CSV, with a change record retained.
- Students cannot view another student’s attendance or change attendance directly; teachers cannot access unassigned classes.
- Loss of connectivity never displays an unconfirmed check-in as successful. Reconnecting retrieves the stored result or allows a retry while the window remains open.
- CSV opens correctly in a spreadsheet, including names with accents, and imported text cannot become executable spreadsheet formulas.
- The complete workflow passes on school Wi-Fi with representative phones and laptops.
- A backup can be restored, and all locations storing real student data satisfy the EU requirement.

In week 1, establish the largest class and likely number of simultaneous sessions. Use those numbers for the week 5 capacity check; 1,200 registered students alone does not define peak traffic.

Demo on day 42

Show a teacher opening a class session, two phones checking in, the roster updating, a duplicate attempt, a manual correction and a CSV download. Demonstrate closure using a prepared expired session, preserving the real 10-minute rule. Keep synthetic demo accounts and a rehearsal recording available if school connectivity fails.

The main delivery risks are delayed school access, unavailable free EU hosting and unreliable Wi-Fi. Resolve the first two in week 1 and test the network early. If time slips, simplify styling and import conveniences while protecting identity, permissions, the check-in window, corrections and export.
