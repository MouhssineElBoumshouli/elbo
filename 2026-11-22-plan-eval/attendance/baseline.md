Project plan: classroom attendance in 6 weeks

Build a mobile-friendly website for students and a laptop-friendly teacher view. Deliver the four day-one features within 144 person-hours. Keep statistics, absence emails and a native app out of this release.

1. Agree the operating rules — days 1–3

Confirm these with the department before building:

- Obtain the class roster: student ID, name, class and teacher assignments. Use one agreed CSV format for initial import; no roster-management screens.
- Confirm how users sign in. Prefer an existing school login only if integration support is available immediately. Otherwise, agree on department-issued accounts; no public registration or password-recovery feature in this release.
- Identify free, school-approved hosting in the EU for the application, database, backups and logs. Existing school infrastructure is the first option. Assign someone at the school to own access and operation after delivery.
- Test the intended URL from a student phone and teacher laptop on school Wi-Fi, including HTTPS and login redirects.
- Agree who can access attendance and how long to retain it. Avoid collecting location, device fingerprints or other unnecessary information.

Hosting and login are critical dependencies. If they cannot be resolved by day 3, escalate immediately: the team can still build a demonstration with synthetic data, but must not promise a real-data launch within this budget.

2. Minimum release

Teacher flow:

- Sign in and select an assigned class.
- Open an attendance session. Show a short session code and a server-controlled closing time, exactly 10 minutes after opening.
- See the roster with present, not-yet-checked-in and, after closure, absent students. Refresh automatically within about five seconds.
- Mark a student present or absent manually, including after the window closes. Record who changed the entry and when.
- Export that session’s complete attendance to CSV.

Student flow:

- Sign in on a phone, enter the session code and submit check-in.
- Receive clear confirmation, including when already checked in, outside the time window or not enrolled in the class.

Rules: one attendance entry per student per session; the server decides whether check-in is on time. Student submissions cannot overwrite a teacher’s correction. Teachers can access only their assigned classes.

A shared session code does not prove physical presence. For this release, the teacher verifies the list and corrects it; stronger anti-cheating measures are outside scope.

3. Implementation approach

Use one small web application with a Python backend, SQL database and responsive HTML/CSS/JavaScript. Avoid introducing a separate frontend application unless the team already has one ready to use. Teacher-only polling provides live updates without adding WebSocket infrastructure.

Keep attendance rules in small pure functions, separate from database, authentication and HTTP handling. Reuse validation and authorization helpers. Match the school’s typography and colours, with readable lists, large phone controls and clear error messages.

4. Ownership and schedule

Each person contributes 8 hours per week: 24 team hours weekly, 144 total. The allocations below include meetings, integration and testing.

| Week | Adam — 8 hours | Sara — 8 hours | Yassine — 8 hours | Exit milestone |
|---|---|---|---|---|
| 1, days 1–7 | Teacher/student flow sketches; browser interaction skeleton | Hosting and login feasibility; schema; roster import format | School-style responsive layouts; Wi-Fi checks | Approved scope, hosting/login decisions and deployed skeleton |
| 2, days 8–14 | Session opening and student submission screens | Login, class permissions and session endpoints | Phone forms, accessibility and error states | One teacher opens a session; one enrolled student checks in |
| 3, days 15–21 | Live teacher list and check-in confirmation | Time-window rules, duplicate prevention and attendance queries | Roster presentation; phone/browser checks | Full check-in flow works on school Wi-Fi |
| 4, days 22–28 | Manual correction controls and CSV download flow | Correction history, export and authorization checks | Empty/loading/error states; teacher feedback session | All four required features complete |
| 5, days 29–35 | Integration fixes and concurrent-use tests | Rule/security tests; backup and restore check | Acceptance testing, usability fixes and short user guide | Release candidate passes agreed checks |
| 6, days 36–42 | Demo rehearsal and defect buffer | Deployment verification and defect buffer | Demo preparation, handover and defect buffer | Teacher demo by day 40; days 41–42 reserved for fixes |

Protect at least 12 of the week-6 hours as contingency. If work slips, cut visual polish and convenience features first; retain permissions, the check-in window, corrections and CSV export.

5. Acceptance checks

- An enrolled student can check in before the server deadline; submission at or after closure is rejected.
- Repeat submissions create no duplicates, including simultaneous requests.
- The teacher sees new check-ins within approximately five seconds, and corrections persist after refresh.
- Unauthorized students and teachers cannot view or modify another class’s data.
- CSV includes every roster member with the final attendance status and opens correctly in the school’s spreadsheet software.
- Losing Wi-Fi produces a clear retry message; retrying cannot duplicate attendance. No offline check-in is promised.
- Real phones and laptops complete the flow on school Wi-Fi. Test a burst matching the largest expected set of simultaneous classes, confirmed in week 1; increase to 1,200 students if department-wide simultaneous use is required.
- Hosting locations and backup locations are verified before importing real student data.

6. Demo and handover

Demonstrate opening a class, several phone check-ins, live updates, a rejected late submission, a manual correction and CSV export. Use a separate short-window test configuration for the late-submission demonstration; production remains 10 minutes.

Hand over the source, deployment instructions, roster-import procedure, user guide and named school administrator. Successful delivery means the required flows pass acceptance checks and the teacher sees the working demo by day 42. Real-data operation additionally depends on approved EU infrastructure and school access arrangements.
