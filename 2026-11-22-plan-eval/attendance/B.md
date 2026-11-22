# Plan: Class Attendance Pilot

Medium plan · 24 tasks · Panel: project manager, software architect, security engineer, designer. Decisions are proposals until you agree.

## The panel pushes back on the brief

- **Serve the whole department at the first release.** (the project manager): If this means simultaneous production rollout by day 42, onboarding, support and capacity are not covered confidently by 144 hours. Better: Demonstrate the complete workflow in a supervised class pilot, then approve wider rollout using test results.
- **Free hosting will be sufficient for real student records.** (the project manager): The brief supplies no confirmed free service or school server that meets EU data-location and school Wi-Fi requirements. Better: Confirm an approved free route in week 1, including capacity for the agreed workload and backups. If none exists, show invented records and report the real-use blocker.
- **Run a department-wide attendance service on a free-only budget.** (the software architect): No school infrastructure is confirmed, and the checked free cloud option expires before the project ends. Better: Confirm free school-provided EU hosting in week 1. If unavailable, deliver a fictional-data demo and explicitly separate it from an operational rollout.
- **Phone check-in tells the teacher who is physically there.** (the software architect): Authenticated students can still share codes and check in remotely. Better: Treat check-in as a reported attendance record supported by teacher review and manual corrections.
- **Add architecture learning, setup and login work on top of the manager’s 100 hours.** (the software architect): This spends the protected buffer before implementation starts. Better: Use the proposed 100-hour shared breakdown as a replacement mapping. Reconcile overlapping tasks once and keep 44 hours uncommitted.
- **The check-in list tells the teacher who is physically present.** (the security engineer): An authenticated student can still check in remotely or share credentials. Better: Describe entries as student check-ins and retain teacher verification and logged corrections.
- **Free-only hosting can support real student data within six weeks.** (the security engineer): No approved EU host or school login has been confirmed. Provider logs and backups can also contain personal data. Better: Check school-provided infrastructure in week 1. If no suitable free option exists, deliver the week-6 demo with invented data and identify the deployment dependency.
- **CSV export is only a download feature.** (the security engineer): Downloads create uncontrolled copies and spreadsheet software may interpret student text as formulas. Better: Limit exports by class, neutralise formula cells and use the school's approved storage and retention rules.
- **Every student checks in by phone during the first ten minutes.** (the designer): A dead phone, accessibility barrier or Wi-Fi failure can prevent a present student from recording attendance. Better: Keep the window, but support teacher-recorded attendance and explain this fallback on closed or failed check-in screens.

## 1. What we build and for whom

**In short:** Build a simple attendance website for a supervised class pilot in week 6.
The intended audience is 40 teachers and 1,200 students; wider use needs school approval and capacity checks.

> Go deeper: The department has about 40 teachers and 1,200 students. Target a supervised class pilot for the week-6 demo, with wider rollout dependent on school approval and capacity testing. A department-wide launch is not established by one successful demo.
> Adam owns browser behaviour, Sara owns server logic and data, and Yassine owns page layout, usability and test coordination. Keep the appearance close to the school’s pages.
> Use only free resources. Before using real student records, confirm that storage, backups and any logs containing student data remain in the EU. Confirm a usable hosting route and school Wi-Fi access in week 1. If these are unresolved, demonstrate with invented records and clearly report that real use is blocked.

**Decision 0001: First release size**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Supervised class pilot** (picked) | Makes the full attendance flow testable within six weeks. | Does not establish readiness for the whole department. | Fits the team's 144 hours if the school supplies usable identity, roster and hosting arrangements. |
| Department-wide launch | Immediately serves all 40 teachers and 1,200 students. | Adds onboarding, support and peak-load uncertainty. | Too uncertain to promise with free resources and this time budget. |

Why: Deliver a complete small pilot, then use its results to decide whether wider release is ready. The department remains the intended audience. Proposed by the project manager.

> Disagreement: If the brief implies that all 1,200 students must use it by day 42, that commitment needs to be reduced or given more resources.

## 2. Must-haves and later

**In short:** Keep session opening, ten-minute check-in, automatic teacher lists, manual corrections and CSV export.
Later: statistics, absence emails, native app, QR codes, name search, separate undo and class-management screens.

> Go deeper: Day one includes opening a class session, accepting student check-ins for its first 10 minutes, updating the teacher’s list automatically, recording teacher corrections and exporting CSV. CSV is a table file that spreadsheet tools can open. Minimum supporting work includes approved user identification, class membership, duplicate prevention and clear failure messages. Defer statistics, absence emails and a native phone app. They add work without completing the core attendance flow. Use school-supplied class lists; defer a class-management interface. Weeks 1–2: resolve hosting and identity, agree data exchanged between pages and server, and build with invented records. Week 3: demonstrate opening a session, checking in and seeing the list update. Weeks 4–5: complete corrections, export and integration. Week 6: testing, fixes and demo only. Provisional capacity assumptions, not school facts: 1,200 students attending five sessions weekly for 30 weeks produces 180,000 attendance rows yearly. At an assumed 1 KB per row, that …

**Decision 0002: Feature boundary**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Attendance essentials** (picked) | Completes the teacher's daily workflow and protects testing time. | Teachers initially handle follow-up and analysis themselves. | Matches Adam's JavaScript, Sara's Python and SQL, and Yassine's HTML/CSS. |
| Essentials plus statistics and alerts | Adds useful follow-up information. | Requires more rules, screens, email setup and testing. | Consumes the buffer needed by a small team with limited backend experience. |

Why: Keep every stated must-have. Defer statistics, email alerts and the native app, as the brief permits. Avoid adding a class-management interface by using school-supplied lists. Proposed by the project manager.

## 3. Stack and why

**In short:** Use Django, PostgreSQL, shared HTML/CSS pages and small JavaScript files; no React or AI.
Use free school-supported EU hosting and school login, conditional on week-1 confirmation.

> Go deeper: Django is a Python framework with built-in accounts, forms and database tools. It fits Sara’s Python/SQL; Adam handles browser updates; Yassine builds templates and styles. The proposed shared plan below totals 100 hours, including 12 learning hours and four setup hours. It replaces overlapping manager tasks; it is not an extra architecture budget. Adam owns 36 hours, Sara 35 and Yassine 29, leaving 44 of 144 hours protected. The manager’s detailed plan was not supplied, so exact reconciliation needs confirmation. Use one repository and deployment. Drop React, a separate frontend, microservices and Kubernetes. Ask school IT in week 1 for free EU hosting, HTTPS and backups. Render’s free database expires after 30 days; its website can sleep. [Render limits](https://render.com/docs/free). If school hosting is unavailable, demonstrate with fictional data and leave deployment unresolved.

**Decision 0003: Application structure**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Django templates and small JavaScript files** (picked) | One application; built-in accounts and forms. | Django and its template conventions need learning. | Uses Sara’s Python/SQL, Adam’s JavaScript and Yassine’s HTML/CSS. |
| React frontend and Python API | Adam can use his React experience. | Adds separate builds, API contracts and more account integration. | Too much overhead for 144 hours and simple pages. |

Why: The must-haves need forms and a changing list. One application gives all three people useful work while keeping integration small. Proposed by the software architect.

**Decision 0004: Hosting**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School-provided EU server** (picked) | Can provide persistent storage and approved school-network access. | Availability, maintenance support and capacity are unconfirmed. | Fits free-only only if the school provides it without charge. |
| Render free website and database | Managed deployment with a Frankfurt region. | Database expires after 30 days; website sleeps after 15 idle minutes. | Fails the continuing-service need and 42-day project timeline. |

Why: Conditional on confirmation in week 1. Free public hosting is not established as viable. Render’s documented expiry rules exclude this option. [Limits](https://render.com/docs/free), [regions](https://render.com/docs/regions). Proposed by the software architect.

> Disagreement: Free-only cannot be treated as a guarantee that a dependable department-wide service is available.

## 4. How the parts fit together

**In short:** Sara owns server rules and data; Adam owns browser behaviour; Yassine owns layouts and acceptance checks.
Students sign in, then enter a session code. Teacher lists refresh every five seconds; codes do not prove presence.

> Go deeper: Modules cover accounts, rosters, sessions, attendance and CSV export. Students enter a code or open a session link. If sign-in is needed, preserve the destination using a validated local return path. Successful sign-in returns to that session; the server rechecks enrollment and deadline before check-in. A closed session explains that check-in ended and directs the student to the teacher. Wrong-class access reveals no roster and offers code re-entry. Yassine includes these states and expired-login recovery in the screen plan. Repeated submissions return the existing result; teacher corrections survive retries. Only teacher lists poll; stop when hidden and show stale/error status. Codes cannot prove physical presence. Pure functions handle timing, eligibility, corrections and CSV safety. Thin request handlers read time and records, call those functions and save results. Database constraints prevent duplicates. Split files before roughly 400 lines and reuse shared rules.

```
Student phone -- code/link --> session destination
Sign-in if needed --> preserved destination --> enrollment/deadline checks
Teacher laptop -- session / correction / export --> Django
Teacher laptop <-- list every 5 seconds -- Django
Django <--> PostgreSQL on approved EU hosting
PostgreSQL --> encrypted backup on separate EU storage
```

**Decision 0006: Live teacher list**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Poll every five seconds** (picked) | Simple requests with ordinary retry behavior. | Updates can lag five seconds and generate repeated reads. | About eight reads per second for 40 open teacher lists. |
| Persistent push connection | Changes reach teachers immediately. | Adds connection management and deployment complexity. | Not justified unless five-second updates are unacceptable. |

Why: It meets a practical meaning of live within the six-week schedule. Show the last successful refresh so failures are visible. Proposed by the software architect.

**Decision 0007: Sign-in for the first release**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| School-provisioned Django accounts | Uses built-in account handling without an external login integration. | School staff must verify identities and manage activation and recovery. | Conditional baseline with 12 implementation hours explicitly budgeted. |
| School single sign-on | Students reuse their school login; the school handles password recovery. | Requires documentation, access and integration work that is not yet estimated. | Choose in week 1 if required or supported within the same budget; replace local-account work. |

Why: Sara confirms one route with school IT and security in week 1. Local accounts require school-verified, single-use, expiring password-setting links delivered through an approved EU school channel, never shared passwords. Recovery uses the same identity checks and invalidates old sessions. Configure Argon2, a deliberately costly password hash, through Django. [Django password guidance](https://docs.djangoproject.com/en/5.2/topics/auth/passwords/). Add account-aware temporary login delays and recovery limits … Proposed by the software architect.

> Disagreement: Security must use the same week-1 choice. If neither route fits the budget and school support, keep the demo fictional; do not silently spend the buffer or release incomplete login.

## 5. Data and privacy

**In short:** Keep school identity, class membership, sessions, attendance and correction history; copy the class roster when a session opens.
Use invented development records. Keep real records, exports, logs and backups in approved EU locations.

> Go deeper: Tables: User, Class, TeacherAssignment, Enrollment, Session, Attendance and AttendanceChange. Store school identifier, display name, role, class membership, opening/closing times and attendance status. Attendance is unique per session/student. Snapshot the enrolled roster when opening a session so later roster edits do not rewrite history. Keep correction actor, time, previous value, new value and reason. Students see their own result; teachers access assigned classes only. Protect CSV exports using the same access checks and neutralize cells that spreadsheets could execute as formulas. Exports also contain student data: school-approved EU storage is required. Avoid location tracking, advertising tools and external assets. Keep personal data out of routine logs. Propose nightly encrypted database backups, seven daily copies and a restore test before the demo; school policy must approve retention for records, changes, logs, exports and backups.

**Decision 0005: Database**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **PostgreSQL** (picked) | Supports concurrent writes and database-enforced uniqueness. | Needs installation, credentials and backup setup. | Sara knows SQL; school IT support would reduce setup risk. |
| SQLite | Simple file-based setup. | Concurrent check-in writes can contend; deployment needs persistent disk. | Useful for a small demonstration, less suitable for department-wide bursts. |

Why: Use one database type in development, testing and deployment. Simultaneous class openings justify the modest setup cost. Proposed by the software architect.

## 6. Security risks and what we do about them

**In short:** Use school login instead of building password activation and recovery; unresolved login means an invented-data demo only.
Check class access on every server request, enforce the deadline and prevent duplicate records. Protect exports and record corrections.

> Go deeper: The 30 security hours map to six shared-plan tasks below: Adam 15, Sara 9, Yassine 6. Each task names its feature overlap; count those hours once. Sara's known feature work is 33 hours. Even if none of her security work overlaps, 33 + 9 = 42, leaving 6 of her 48 hours. Adam's and Yassine's other estimates and the existing team buffer are missing, so their full totals still need reconciliation. Keep the existing buffer reserved; do not use it to hide missing work. In week 1, confirm free EU hosting, school login and school Wi-Fi access. If unavailable, use invented students for the week-6 demo; real deployment remains blocked. Students check in only for enrolled classes. Teachers manage only assigned classes. The server enforces the ten-minute window and records manual corrections. Protect live lists and CSV exports with the same permissions. Store only necessary identity, enrolment and attendance records. …

**Decision 0008: Login and account recovery**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School login** (picked) | The school handles passwords and recovery. | Needs school access and an approved EU-compatible setup. | Best use of 144 hours if available in week 1. |
| School-email magic links | No app passwords; a short-lived email link signs the user in. | Needs approved email delivery, abuse limits and protection against reused links. | Fallback only if free delivery and EU handling are confirmed. |
| App passwords | Does not depend on school login integration. | Adds password storage, recovery and support work. | Poor fit for six weeks; requires re-estimation. |

Why: Use the existing school account system if confirmed. Accept only approved department accounts, and obtain roles from trusted school records. Recovery stays with the school. Follow established [authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). Proposed by the security engineer.

**Decision 0009: Where personal data lives**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School-managed EU hosting** (picked) | Can use existing school administration and approved infrastructure. | Availability, certificates, backups and support are unknown. | Preferred if provided free and confirmed in week 1. |
| Verified free EU service | May reduce server administration. | Free limits and locations of logs, backups and support access need checking. | Fallback only after the whole data path is verified. |

Why: The free-only budget does not establish that suitable hosting exists. Confirm the app, database, login, logs and backups before uploading real records. EU storage is an explicit project requirement, separate from broader GDPR duties. Proposed by the security engineer.

> Disagreement: A free account or an EU database region alone is insufficient evidence that all student data stays in the EU.

**Decision 0010: How much a check-in proves**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Authenticated check-in with teacher review** (picked) | Simple; ties each record to an enrolled account. | A student can check in remotely or share their account. | Fits day-one scope and existing manual correction. |
| Authenticated check-in plus classroom code | Adds a small obstacle to remote check-in. | Codes can be forwarded and add classroom steps. | Optional later improvement if teachers need it. |
| Location or Wi-Fi-based proof | May provide an additional location signal. | Signals are unreliable, add privacy concerns and can reject present students. | Too much complexity for this team and deadline. |

Why: Treat the result as a student declaration. Teachers retain final control. Use server time, class enrolment checks and one record per student per session. Proposed by the security engineer.

> Disagreement: Phone check-in alone cannot establish physical presence. Working on school Wi-Fi must not be confused with proving attendance.

## 7. The look and the main screens

**In short:** Use school-style pages for teacher classes, the register, student check-in and the result, plus school-login messages.
Keep names in a stable order, support keyboards and phones, and show saved, failed and outdated states clearly.

> Go deeper: Screens: (1) Teacher classes: choose a class and open its session. (2) Live register: show the session code, closing time, attendance, connection status, manual corrections and CSV export. (3) Student check-in: enter the code, confirm the class and remaining time, then press Check in. (4) Student result: confirm recorded attendance or explain why check-in failed. Students open the school-provided app address and sign in before entering a session code. Teachers read out or write the code on the board. Do not project the register. Defer QR generation, a separate joining display and name search. Use shared Django templates, ordinary JavaScript and CSS. Templates reuse page structure on the server. Adam handles browser behaviour; Yassine handles presentation and keyboard checks; Sara handles server responses that distinguish saving, saved and rejected actions. React is not a dependency. Keep this work to 20 hours within the shared 100-hour plan, not an additional allocation. …

**Decision 0011: How students reach a session**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **App address, sign-in, then session code** (picked) | Works with a spoken or written code; needs no projector. | Students must type the code and may make mistakes. | Matches the architecture; no extra joining feature beyond its code flow. |
| Session link with optional QR code | Less typing when teachers can share or display it. | Must preserve the session through login; QR adds generation and phone checks. | Provisionally adds 3–5 implementation hours over code entry; not allocated. |

Why: Use the architecture’s code submission flow. Sign-in comes first, so no session needs to survive login. Keep code errors on the same screen. Codes locate sessions; they do not prove identity or presence. Proposed by the designer.

**Decision 0012: How teachers read attendance**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Stable list with status text** (picked) | Easy to scan; names stay in place during updates. | Long classes require scrolling without name search. | Fits laptops and the existing register scope. |
| Cards grouped by attendance | Separates present and absent groups clearly. | Uses more space and moves students between groups. | Adds layout work and increases correction mistakes. |

Why: Show counts above a fixed-order list. Label students without check-ins as Pending during the window. Defer name search; preserve focus when updates arrive. Proposed by the designer.

**Decision 0013: How teachers repair a mistaken correction**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Change and save the status again** (picked) | Reuses the required correction control and server action. | Takes another edit to reverse a mistake. | Adam owns browser behaviour; Sara owns saving within the existing correction allocation. |
| Separate undo action | Quickly reverses the last change. | Needs previous-value tracking and rules for intervening updates. | Provisionally adds 2–4 implementation hours; defer because these are unallocated. |

Why: Show the saved status clearly and keep it editable. This supports recovery without a second correction mechanism. Proposed by the designer.

**Decision 0014: Visual foundation**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Small shared school-style layout** (picked) | Familiar appearance, reusable templates and no paid assets. | The team must check contrast and keyboard behaviour. | Uses Yassine’s HTML/CSS, Adam’s JavaScript and Sara’s Python. |
| Free CSS component library | Provides ready-made control styles. | Adds learning and school-style adjustments. | Only saves time if the team already knows it. |

Why: Use Django templates, ordinary browser controls, small JavaScript files and a shared stylesheet. Proposed by the designer.

## 8. Who does what, and in what order

**In short:** Plan 100 of 144 hours: Adam 33/48, Sara 33/48 and Yassine 34/48; protect 44 hours, or 30.6%, as buffer.
These replace overlapping expert estimates and include learning, security and checks. Build in weeks 1–5; week 6 is testing, fixes and demo only.

| Area | Folders | Owner |
| --- | --- | --- |
| Browser behaviour and project setup | `static/js/`, `tests/browser/`, `docs/setup/`, `docs/plan/` | Adam |
| Server, data and deployment | `config/`, `attendance/`, `tests/server/`, `deploy/`, `docs/operations/` | Sara |
| Presentation, school coordination and acceptance | `templates/`, `static/css/`, `docs/design/`, `docs/acceptance/`, `docs/demo/` | Yassine |

| Week | Tasks |
| --- | --- |
| 1 | T1 Gather school answers: pilot or launch, login, class lists, EU hosting and exports, retention, incident contact, Wi-Fi access, attendance proof, school style and weekly availability; arrange teacher reviews (3h) (Yassine · Presentation, school coordination and acceptance) · T2 Check free school infrastructure, EU data locations, school-login support, class-list format and operating owner; agree largest class, peak check-ins, storage needs and five-second updates; set real-use or fictional-demo route (4h) (Sara · Server, data and deployment) · T3 Learn Django data models, forms, accounts and test structure using invented records (4h) (Sara · Server, data and deployment) · T4 Learn Django browser integration; set up the shared code repository, local PostgreSQL and setup guide; agree request examples and track scope weekly (9h) (Adam · Browser behaviour and project setup) · T5 Learn Django templates and sketch four screens, sign-in-first code entry, expired-login recovery, failure messages and teacher fallback; test available host and login addresses on school Wi-Fi (7h) (Yassine · Presentation, school coordination and acceptance) |
| 2 | T6 Create tables and database migrations; validate school-supplied class imports; enforce one attendance record per student and session; supply example responses (6h) (Sara · Server, data and deployment) · T7 Connect the supported school login, trusted roles and class permissions; configure session protection, request checks and account-based attempt limits; test denied access (5h) (Sara · Server, data and deployment) · T8 Connect sign-in, sign-out and login error behaviour using agreed responses; preserve typed code through expired login and recheck it afterwards (4h) (Adam · Browser behaviour and project setup) · T9 Build shared school-style templates and CSS for phones and laptops, including labels, keyboard focus and login messages (7h) (Yassine · Presentation, school coordination and acceptance) |
| 3 | T10 Implement opening sessions, roster copies, expiring codes, server-timed ten-minute check-in and repeat-safe saves; test pure rules and database duplicate protection (5h) (Sara · Server, data and deployment) · T11 Build student code entry, class confirmation, check-in and confirmed-result behaviour; retain input after failed requests (5h) (Adam · Browser behaviour and project setup) · T12 Build teacher class selection, session opening and basic five-second register refresh for the halfway demonstration (3h) (Adam · Browser behaviour and project setup) · T13 Finish student and teacher screen markup: stable register, counts, Pending labels, code, closing time, result states and correction/export controls; review halfway flow with teacher (8h) (Yassine · Presentation, school coordination and acceptance) |
| 4 | T14 Implement teacher corrections with actor, time, old/new status and reason; prevent retries or simultaneous check-ins from overwriting corrections; test these conflicts (3h) (Sara · Server, data and deployment) · T15 Implement class-restricted CSV export, validate inputs and neutralise spreadsheet-formula cells; test access and hostile text (2h) (Sara · Server, data and deployment) · T16 Finish automatic updates: show last success and connection errors, pause hidden-page refreshes and preserve row order, focus and unsaved edits (3h) (Adam · Browser behaviour and project setup) · T17 Connect correction saving and protected CSV download; keep failed edits, confirm saved status and allow another edit to repair mistakes (4h) (Adam · Browser behaviour and project setup) · T18 Check keyboard use, zoom, readable contrast, phone layouts and empty/loading/wrong-class/closed-session messages; explain teacher-recorded attendance fallback (3h) (Yassine · Presentation, school coordination and acceptance) |
| 5 | T19 Deploy on approved school-supported infrastructure; configure HTTPS, secrets, restricted database access, approved deletion and encrypted EU backups; prove restoration and check storage and agreed peak load (3h) (Sara · Server, data and deployment) · T20 Check complete browser flows, cross-class denial, expired login, cutoff, repeated requests, correction conflicts and export safety; review software dependencies and fix integration defects (3h) (Adam · Browser behaviour and project setup) · T21 Run acceptance checks on school Wi-Fi and representative phones/laptops, including dropped connections and teacher fallback; prepare invented demo records and short user instructions (3h) (Yassine · Presentation, school coordination and acceptance) |
| 6 | T22 Retest browser failures and apply final fixes; freeze feature scope and use only approved buffer for remaining defects (2h) (Adam · Browser behaviour and project setup) · T23 Run final server and recovery checks, fix remaining defects and document whether real use is approved or blocked (1h) (Sara · Server, data and deployment) · T24 Retest corrected journeys, finish instructions, rehearse and demonstrate all four must-haves with the teacher; record remaining limits (3h) (Yassine · Presentation, school coordination and acceptance) |

Halfway demo: End of week 3: with invented students, a teacher opens a session, an enrolled student signs in and checks in by code, and the register updates within five seconds.

## 9. Risks

**In short:** Real use depends on free approved EU infrastructure, supported school login, supplied class lists and working school Wi-Fi.
Resolve open school questions in week 1. If prerequisites fail, keep the complete demonstration fictional and report real use as blocked.

| Risk | Chance | Impact | What we do | Who watches |
| --- | --- | --- | --- | --- |
| Free EU infrastructure or supported school login is unavailable, or setup exceeds the estimate. | high | high | Resolve in week 1 with school IT. The estimates assume supported infrastructure and an existing usable login connection. Do not add custom passwords or email links; demonstrate with invented accounts and records if prerequisites fail. | Sara |
| The school expects department-wide launch rather than a supervised pilot. | medium | high | Ask in week 1 what week 6 must prove and how many classes participate. Commit to the complete pilot workflow; wider launch requires approval, an operating owner and measured capacity. | Yassine |
| Learning, integration or school delays consume the 30% buffer. | high | high | Review hours weekly. Remaining capacity is Adam 15h, Sara 15h and Yassine 14h. Confirm weekly availability, especially week 6. Re-estimate after week 1; reduce rollout or keep the demo fictional rather than remove must-haves or security checks. | Adam |
| School Wi-Fi, shared-network login limits or simultaneous check-ins prevent attendance. | medium | high | Ask for largest class and simultaneous class count; agree a measurable load target. Test host and login access early and complete journeys in week 5. Show failures honestly and retain teacher manual attendance. | Yassine |
| Wrong-class access, repeated requests or simultaneous changes expose or corrupt records. | medium | high | Check permissions on every request, including refresh and export. Enforce uniqueness in the database, save related changes together and test teacher corrections against student retries. | Sara |
| Exports, logs, login processing or backups violate the EU-only requirement. | medium | high | Ask who approves data use, all storage and processing locations, retention periods, export handling and incident response. Use invented records until approved; exclude personal data from routine logs, protect exports and test backup restoration. | Sara |
| A remote student checks in, or the teacher projects private attendance information. | high | medium | Ask whether teacher review is sufficient evidence of presence. Explain that accounts and codes cannot prove location. Keep the register on the teacher's laptop and share only the code. | Yassine |
| Live updates hide failed saves or disrupt teacher corrections. | medium | high | Keep a stable register, preserve keyboard focus and unsaved values, and show success only after server confirmation. Test failed corrections, expired login and interrupted Wi-Fi before the final demo. | Adam |

## 10. Decisions log

| # | Decision | Options looked at | Decided by |
| --- | --- | --- | --- |
| 0001 | First release size: Supervised class pilot | Supervised class pilot, Department-wide launch | project manager, proposed |
| 0002 | Feature boundary: Attendance essentials | Attendance essentials, Essentials plus statistics and alerts | project manager, proposed |
| 0003 | Application structure: Django templates and small JavaScript files | Django templates and small JavaScript files, React frontend and Python API | software architect, proposed |
| 0004 | Hosting: School-provided EU server | School-provided EU server, Render free website and database | software architect, proposed |
| 0005 | Database: PostgreSQL | PostgreSQL, SQLite | software architect, proposed |
| 0006 | Live teacher list: Poll every five seconds | Poll every five seconds, Persistent push connection | software architect, proposed |
| 0007 | Sign-in for the first release: School-provisioned Django accounts, conditional on week-1 agreement | School-provisioned Django accounts, School single sign-on | software architect, proposed |
| 0008 | Login and account recovery: School login | School login, School-email magic links, App passwords | security engineer, proposed |
| 0009 | Where personal data lives: School-managed EU hosting | School-managed EU hosting, Verified free EU service | security engineer, proposed |
| 0010 | How much a check-in proves: Authenticated check-in with teacher review | Authenticated check-in with teacher review, Authenticated check-in plus classroom code, Location or Wi-Fi-based proof | security engineer, proposed |
| 0011 | How students reach a session: App address, sign-in, then session code | App address, sign-in, then session code, Session link with optional QR code | designer, proposed |
| 0012 | How teachers read attendance: Stable list with status text | Stable list with status text, Cards grouped by attendance | designer, proposed |
| 0013 | How teachers repair a mistaken correction: Change and save the status again | Change and save the status again, Separate undo action | designer, proposed |
| 0014 | Visual foundation: Small shared school-style layout | Small shared school-style layout, Free CSS component library | designer, proposed |

## 11. Words used

- **Pilot:** A small supervised trial before wider use.
- **Buffer:** Time kept unassigned for unexpected work and fixes.
- **Django:** A Python toolkit for building websites, handling accounts and working with stored data.
- **PostgreSQL:** The database software that stores the app's records.
- **Database:** An organised store of records that the application can read and change.
- **HTML:** The language that defines a web page's content and structure.
- **CSS:** The rules that control a web page's appearance and layout.
- **JavaScript:** The programming language used here to make browser pages respond and update.
- **React:** A JavaScript interface toolkit that this project does not need.
- **Template:** A reusable page structure filled with data by the server.
- **Browser:** The phone or laptop program used to open the website.
- **Server:** The computer program that receives requests, checks rules and saves records.
- **Hosting:** Running the website on a computer that users can reach over a network.
- **Deployment:** Putting the application and its settings onto its hosting computer.
- **EU:** The European Union, where the brief requires student data to remain.
- **HTTPS:** A protected connection that encrypts information travelling between the browser and website.
- **Secrets:** Private credentials or keys needed to run the application securely.
- **School login:** Using an existing school account system to establish who a user is.
- **Session:** An attendance session is a class check-in window; a login session remembers a signed-in user.
- **Role and permission:** A role identifies a user type, while a permission determines what that user may access or change.
- **Roster:** The list of students enrolled in a class.
- **CSV:** A plain-text table file that spreadsheet programs can open.
- **Spreadsheet-formula cells:** Exported values that a spreadsheet might treat as executable calculations instead of ordinary text.
- **Repository:** The shared store of project files and their change history.
- **Data model and database migration:** A data model describes stored records, and a migration applies changes to their database structure.
- **Pure rule:** A function that calculates a result from supplied values without reading the database, network or clock.
- **Request and response:** A request asks the server to do something, and a response reports the result.
- **Account-based attempt limit:** A control that slows repeated attempts mainly by account so one school network is not blocked as a whole.
- **Peak load:** The busiest expected period of simultaneous website activity.
- **Acceptance checks:** Checks that the complete app meets the teacher's agreed needs.
- **Integration:** Connecting separately built parts and checking that they work together.
- **Software dependency:** An outside software package the project relies on.
- **Backup and restoration:** A backup is a saved recovery copy, and restoration rebuilds working data from that copy.
- **Encryption:** Scrambling information so it can only be read with the right key.
- **Logs and retention:** Logs record system events, and retention specifies how long information is kept.
- **Keyboard focus:** The page control currently receiving keyboard input.
- **QR code:** A scannable square that can open a website address.
- **Native app:** An application installed specifically for a phone operating system.
- **AI:** Artificial intelligence software; it is outside this project's scope.
