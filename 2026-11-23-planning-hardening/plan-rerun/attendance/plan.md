Build a small website for phones and laptops. Students sign in and enter a class code. Teachers open attendance, watch the list update, correct mistakes and download it.

### People, time and scope
Adam knows JavaScript and some React. He owns interactive pages. Sara knows Python and SQL. She owns the server and database. Yassine knows HTML/CSS and has never built a backend, so he owns layouts, messages and usability checks.

Plan 44 hours for Sara and 42 each for Adam and Yassine: 128 hours total. Keep Sara’s remaining 4 hours and the others’ 6 hours each for unexpected fixes. Finish by day 42. Spend €0.

Deliver all four must-haves for a small class pilot. The department has about 40 teachers and 1,200 students. A full rollout needs a separate check of how many people can use it together.

### Assumptions to settle first
Assume the school supplies class lists, identifies each class’s teachers and names an account manager. School login access is unknown, so create local accounts from the approved class lists. Use manual password resets; do not build email delivery.

In week 1, confirm class sizes, simultaneous sessions, school Wi-Fi rules and approved EU storage. Agree how long records stay and who deletes them. Use invented records until these questions are settled.

### How it works
Use Django, a Python toolkit with login and database tools. Sara has learning time in week 1. Use ordinary HTML, CSS and JavaScript for pages.

Use SQLite, which keeps the database in one file, for the pilot. Store accounts, class membership, sessions and attendance. Put attendance and deadline rules in small functions that can be tested without a database or network.

An assigned teacher opens one session for their class. The server records its start time and creates a random code. A signed-in student on the class list can check in before 10 minutes pass. Repeated taps create only one record. Students see only their own result.

The teacher’s page asks for updates every five seconds. This is called polling. Show connection failures. Keep teacher corrections even when students retry, and record who changed what and when. Teachers can mark students without phones by hand.

### Free hosting and EU storage
First seek a free school-managed EU server, with school IT handling setup. Its availability is an assumption.

For an invented-record demo, check PythonAnywhere’s EU free service and its current limits before choosing it: [free account limits](https://help.pythonanywhere.com/pages/FreeAccountsFeatures) and [EU plans](https://eu.pythonanywhere.com/pricing/). A demo there does not prove department capacity.

Before real use, school IT must approve EU storage for records, backups, logs and exported files. Keep real data out of personal devices and shared code folders. Add no external tracking. If no approved free host is available, demonstrate with invented records and hold the real pilot.

### Week 1 — Settle the basics
- Sara, 7h: confirm hosting, data rules and account ownership with school IT; learn Django basics.
- Adam, 7h: map teacher and student journeys, agree attendance rules and expected traffic, and test the proposed address on school Wi-Fi.
- Yassine, 7h: sketch phone and laptop pages with the school’s simple style; review them with the teacher.

### Week 2 — Accounts, classes and sessions
- Sara, 9h: use Django’s admin pages for account management. Build class membership, permission checks and a repeatable class-list import. The import makes a one-time initial password per student; the teacher hands these out on individual printed slips before the first session. Lost passwords use manual reset. Build session storage and opening, plus the pure deadline function and rule tests.
- Adam, 7h: build the teacher’s session-opening page, code display and countdown. The server decides whether check-in is still open.
- Yassine, 7h: build shared layouts, login screens, class selection and keyboard-friendly forms.

### Week 3 — Check-in and live list
- Sara, 7h: build check-in saving, membership checks and duplicate protection; test the deadline boundary and repeated requests.
- Adam, 7h: connect student check-in and five-second teacher updates; show pending, confirmed and failed states.
- Yassine, 7h: finish phone layouts and readable attendance rows; check code display styling on real phones.

### Week 4 — Corrections and export
- Sara, 7h: build teacher corrections, change history and CSV export. CSV is a table file spreadsheets can open. Keep cell contents from becoming spreadsheet formulas.
- Adam, 7h: connect correction controls and downloads; prevent old page updates and double submissions from changing results incorrectly.
- Yassine, 7h: finish empty, closed-session and connection-error screens; make correction controls easy to use.

### Week 5 — Prepare the pilot
- Sara, 7h: set up hosting, practise restoring a backup, and write account, deletion and recovery instructions. Address server failures reported by Adam, using reserve hours if needed.
- Adam, 7h: rehearse on school Wi-Fi with invented accounts, 60 check-ins in one minute and two teacher pages. Fix page code; report server failures to Sara. Revise this provisional traffic target in week 1 if the class is larger.
- Yassine, 7h: run a teacher walkthrough and device checks; prepare a one-page guide and demo script. Freeze features this week.

### Week 6 — Test and fix only
- Sara, 7h: test permissions, duplicates, timing, exports and recovery; fix server failures and prepare the clean demo database.
- Adam, 7h: test complete journeys and Wi-Fi interruption recovery; fix page code, report server failures to Sara and rehearse the day-42 demo.
- Yassine, 7h: repeat phone, laptop and keyboard checks; fix display issues and verify the guide.

### How we know it is done
- Open a session: an assigned teacher opens one active session for their class and sees its code and closing time. Students and other teachers cannot open it.
- Ten-minute check-in: an enrolled student can sign in using their individually issued initial password. Check-in succeeds before the deadline and fails at or after 10 minutes using server time. Wrong codes, outsiders and duplicate taps cannot create extra records.
- Live list and corrections: confirmed check-ins appear within five seconds on a healthy connection. Teacher changes survive reloads, have change history and cannot be undone by student retries.
- CSV export: the assigned teacher downloads the full class list, session details and corrected statuses. Accented names and commas work; formula-like values stay text. Other users cannot download it.
- School Wi-Fi: the full journey passes on a laptop and two phones. Interrupted requests never claim success before confirmation; retries create no duplicates.
- Pilot capacity: 60 check-ins in one minute and two teacher pages cause no lost or duplicate records; updates stay within five seconds. Wider use needs testing at the agreed department traffic level.
- Data handling: school IT confirms EU storage for records, logs, backups and exports. Backup recovery works, deletion has an owner, and students cannot read another student’s attendance.

### Push-back
- Full department rollout: 144 hours and unconfirmed free hosting cannot support that promise. Deliver a small pilot and measure its limits before expanding.
- Proof of presence: students can share codes. Use signed-in accounts and teacher review; do not promise fraud-proof attendance or add location tracking.
- Guaranteed Wi-Fi access: the school network may block the host or lose internet access. Test early; during outages, use a temporary school-approved register and enter corrections later.

### Cut first
1. Native app: use the phone website.
2. Email alerts: leave them out.
3. Per-student statistics: use CSV.
4. Extra visual polish and optional filters.
5. Department-wide rollout: shrink the pilot if needed. Keep all four must-haves, permission checks and the EU rule.

Decisions

- **Website and server:** Django pages with plain HTML, CSS and JavaScript (also looked at: React frontend with a separate Python service, Native phone app). This uses Sara’s Python and Adam’s and Yassine’s page skills. Django supplies account management; separate services or a native app add too much work.
- **Pilot database:** SQLite (also looked at: PostgreSQL). One database file keeps pilot setup small. PostgreSQL, a separate database server, can be considered if later traffic tests require it.
- **Student identity:** Local accounts from approved class lists plus a session code (also looked at: School single sign-on, Anonymous name entry with a session code). School single sign-on, which reuses existing school logins, is unconfirmed. Imported accounts identify class members; teachers distribute initial passwords on individual printed slips and handle lost passwords through manual reset.
- **Live teacher list:** Poll every five seconds (also looked at: Persistent server connection, Manual refresh). Polling is simple enough for Adam to build on ordinary hosting. Manual refresh does not meet the live-list requirement.
- **Check-in deadline:** Server time controls the ten-minute window (also looked at: Phone time controls the window, Teacher closes every session manually). Phone clocks can be wrong, and teachers can forget to close sessions. Sara builds the server rule; Adam’s countdown only displays the remaining time.
- **Hosting and launch:** Approved free school EU host for real use; EU free demo host with invented records as fallback (also looked at: Free public hosting for immediate department-wide use, Paid EU hosting). School hosting and approval are unknown. Free hosting needs its limits checked, and paid hosting breaks the budget.
