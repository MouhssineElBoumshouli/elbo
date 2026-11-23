Build a simple attendance website for phones and laptops. Demonstrate all four must-haves with invented students by day 42. Start with one class; all 40 teachers and 1,200 students need more testing.

## People, time and budget

Plan 126 hours: 42 each for Adam, Sara and Yassine, leaving 6 each for surprises. Spend nothing. Freeze features in week 5; reserve week 6 for testing, fixes and the demo.

Adam brings JavaScript and some React. Sara brings Python and SQL, with Django learning time included. Yassine brings HTML/CSS; Sara helps him run the shared project locally.

Assume one teacher and 60 students. Adam confirms class size, overlapping classes, account ownership and maintenance in week 1. School help is not promised team capacity.

## Build a small version

Use Django pages with small JavaScript additions, avoiding a separate React application. Use SQLite's single database file, subject to simultaneous-check-in testing.

Keep attendance rules in small pure functions, with time passed as input. Tests need no network, database or clock. Reuse helpers and split files before about 400 lines.

Students use individual accounts and a classroom code. Use Django password handling and admin screens for invented accounts and classes. Skip imports until real data is approved. No public sign-up or email password reset.

Only the assigned teacher can open sessions, see full lists, correct or export them. Students see their own result. The server checks membership and the 10-minute deadline. Repeated taps create one record. Corrections record who changed what and when.

Refresh the teacher list every five seconds and show its last update time. Connection failures show errors, never false success. During Wi-Fi outages, teachers take attendance manually and enter corrections later.

## Hosting and school rules

Try PythonAnywhere EU's free service for invented data. Check current limits and renewal requirements, publish an empty site and test its address on school Wi-Fi in week 1. Sara's weekly estimates include publishing updates.

If hosting or Wi-Fi fails, request and immediately test a free, approved EU school server. This fallback is not guaranteed. If neither works, report the unmet Wi-Fi requirement immediately.

The school's location is unknown. Adam confirms permitted locations for the website, logs, backups and downloads, including school devices. Use invented records until the school approves the whole EU data route and names a maintainer.

Use HTTPS, serve scripts and fonts locally, add no tracking and keep names and credentials out of logs. Agree a deletion date and private account distribution before real use.

For backup, pause writes, copy the database to approved EU storage and test restoration once. Delete records through admin screens; build no separate backup or deletion tools.

## Weekly work

Hours include coordination and Sara's weekly publication.

- **Week 1, days 1–7:** Adam, **7 hours**, confirms trial size, overlapping classes, account ownership, data rules, maintenance, hosting requirements and acceptance checks. Sara, **10 hours**, learns Django for 3 hours, creates the shared repository and empty project, checks and sets up EU hosting, publishes and helps Yassine run locally. Yassine, **7 hours**, sets up locally, sketches school-style pages and tests the published address on school Wi-Fi.
- **Week 2, days 8–14:** Adam, **7 hours**, builds teacher session controls and closing-time display. Sara, **6 hours**, creates invented classes and accounts through admin, builds access rules and session opening, and publishes. Yassine, **7 hours**, builds sign-in, teacher and student layouts in the shared project.
- **Week 3, days 15–21:** Adam, **7 hours**, connects check-in, repeated taps and failure messages. Sara, **8 hours**, builds and tests membership, deadline and duplicate rules, then publishes. Yassine, **7 hours**, finishes phone layouts, keyboard use and check-in messages.
- **Week 4, days 22–28:** Adam, **7 hours**, builds five-second list updates and correction controls. Sara, **8 hours**, builds correction history and CSV export, then publishes. Yassine, **7 hours**, connects export controls and checks lists, forms and connection warnings.
- **Week 5, days 29–35:** Adam, **7 hours**, checks the complete journey and prepares a repeatable simultaneous-use test. Sara, **5 hours**, publishes and checks the hosted app, copies and restores its database, and documents backup and admin deletion. Yassine, **7 hours**, prepares the teacher guide, private account-distribution instructions and demo walkthrough. Freeze features.
- **Week 6, days 36–42:** Adam, **7 hours**, tests simultaneous use and fixes failures. Sara, **5 hours**, tests access, deadline boundaries and exports, fixes failures and publishes. Yassine, **7 hours**, tests phones and laptops on school Wi-Fi, gathers teacher feedback, checks fixes and leads the day-42 demo.

## How we know it is done

- **Open a session:** The assigned teacher sees a code and closing time. Reloading preserves them. Repeated clicks create no extra active session. Students and unrelated teachers cannot open it.
- **Check in within 10 minutes:** An enrolled student with the right account and code succeeds at 9:59 and is rejected at 10:00 by server time. Wrong codes and classes fail. Repeated taps create one record. Confirmation appears only after saving.
- **Live list and manual fixes:** Saved check-ins appear within five seconds on a healthy connection. Teacher corrections work after closing, survive reload and appear in history. Student retries cannot overwrite them. Connection failures show a stale-list warning.
- **CSV export:** Only the assigned teacher can download the selected session's full class list with student ID, name and final status. Corrections appear. Accents, commas and names resembling spreadsheet formulas are handled safely.
- **Trial readiness:** All four journeys pass on school Wi-Fi using phones and a laptop. Sixty simultaneous check-ins and one teacher list lose no records, create no duplicates and confirm successful requests within five seconds. Access checks and one backup restoration pass. Real use also needs school approval of EU storage and a named maintainer.

If the traffic test fails, use reserve hours to fix it or agree a smaller trial and retest. Do not claim department readiness.

## Push-back

- **Immediate department launch:** Free hosting and 144 hours do not prove capacity for 1,200 students. Start with a measured class trial and test actual peak use before expanding.
- **EU hosting alone satisfies the rule:** Logs, backups and downloads also hold student data. Confirm the whole route and use invented records until approved.
- **Phone check-in proves presence:** Students can share codes or accounts. Use individual accounts and teacher spot checks.

## Cut first

1. Native app: use the phone-friendly website.
2. Email alerts after three absences: leave them out.
3. Per-student statistics: leave them out.
4. Extra visual polish: keep clear school-style pages.
5. Wider rollout: shrink the trial if needed, keeping every must-have and the access, data and Wi-Fi checks.

## Decisions

- **Website structure:** Django pages with small JavaScript additions (also looked at: React with a separate Python service, JavaScript throughout). Fits Sara's Python, Adam's JavaScript and Yassine's HTML/CSS. Sara gets Django learning time in week 1.
- **Database:** SQLite for the class trial (also looked at: PostgreSQL on a school-provided server). One file simplifies setup and backups. Simultaneous writes must pass the trial test.
- **Hosting:** Try PythonAnywhere EU free hosting in week 1 (also looked at: Existing school-approved EU server at no cost, Teacher laptop as the permanent server). An early address enables school Wi-Fi testing. Free terms need checking; a school server is not guaranteed.
- **Accounts and class setup:** Individual accounts and invented class created through Django admin (also looked at: Checked class-list import, School single sign-on, Names or student numbers with a shared code). Admin screens save time while preserving account checks. Imports add no demo value; school login support is unknown.
- **Live teacher list:** Request updates every five seconds (also looked at: Keep a permanent live connection, Require manual refresh). Regular requests keep the list current with modest work and fit the trial.
- **Backup and deletion:** Copy the database with writes paused; delete records through admin (also looked at: Build separate backup and deletion tools). A documented copy and restore test fit the demo, preserving Sara's time for learning and attendance rules.
