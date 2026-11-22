# Worked example: the plan for a class attendance app

What Elbo's planning session would write for one realistic student project. Hand-written to show the format, following [PLANNING_FEATURE_PLAN.md](PLANNING_FEATURE_PLAN.md) section 8. Not produced by a model run: slice 1 builds the runner, and this example becomes one of its eval cases.

## The brief (from the 10 questions)

|               |                                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| What          | An app that takes attendance in class: students check in with their phone, the teacher sees who is there.                                             |
| For whom      | Teachers and students of one department (about 40 teachers, 1,200 students). Teachers on laptops, students on phones.                                 |
| Day one       | Teacher opens a session for a class. Students check in during the first 10 minutes. Teacher sees the list live and can fix it by hand. Export to CSV. |
| Can wait      | Statistics per student, email alerts after 3 absences, a native app.                                                                                  |
| Deadline      | 6 weeks, demo to the teacher in week 6. About 8 hours a week each.                                                                                    |
| Team          | Mouhssine: JavaScript, some React. Sara: Python, SQL. Yassine: HTML/CSS, never used a backend.                                                        |
| Budget        | Free only.                                                                                                                                            |
| Outside rules | Student data must stay in the EU. The teacher wants it to work on the school Wi-Fi.                                                                   |
| AI            | No.                                                                                                                                                   |
| Feel          | "Simple, like the school's own pages."                                                                                                                |

Size: **medium** (3 people, 6 weeks, about 140 hours in total). Panel: project manager, software architect, security engineer, designer.

---

# Plan: Class attendance

Week 0 of 6 · 0 of 17 tasks done · Decided by Mouhssine, with Sara and Yassine voting.

## 1. What we build and for whom

**In short:** a web page where a teacher opens a 10-minute check-in for a class, and students check in from their phones with a code shown in the room. The teacher sees the list fill up and can fix it.

> Go deeper: Students don't install anything: a phone browser is enough. The code changes every 30 seconds and is only shown on the projector, so a student at home cannot check in for a friend by getting the link. We are not building grades, timetables or statistics.

## 2. Must-haves and later

**In short:** five things for the demo. Everything else waits until they work.

- Must: teacher login · open a check-in for a class · student check-in with the room code · live list for the teacher with manual fixes · CSV export.
- Later: statistics, absence emails, a native app, more than one department.

> Go deeper: 140 hours with a 30% buffer leaves about 100 hours of work. The five must-haves are estimated at 80 hours (tasks in section 9). Statistics alone would be about 25 more.

## 3. Stack and why

**In short:** a Python backend (Sara knows it), plain HTML pages with a little JavaScript (Yassine and Mouhssine can both work on them), and a free EU database.

**Decision 0001: Backend: Flask (Python)**

| Option             | Good                                    | Bad                              | Fit for this team                 |
| ------------------ | --------------------------------------- | -------------------------------- | --------------------------------- |
| **Flask** (picked) | small, easy to learn, Sara knows Python | fewer built-in parts than Django | Sara can lead; others can read it |
| Django             | login and admin built in                | more to learn in 6 weeks         | Sara would spend week 1 learning  |
| Node + Express     | one language with the front end         | nobody has used it on a server   | adds learning for everyone        |

Why: the person who knows the language leads the hardest part. Decided by Mouhssine, Sara agreed.

**Decision 0002: Front end: plain HTML pages served by Flask, no React**

How we got here:

- _Architect:_ plain HTML pages with small scripts. Only the live list needs JavaScript.
- _Mouhssine pushed back:_ "I know React, wouldn't it be faster?"
- _Architect defended:_ React means a second project, a build step and an API for every page. Yassine has never used it. For 4 screens, plain pages are faster for this team, and Mouhssine can still write the live list's JavaScript.
- _Mouhssine agreed._ Recorded as decided by Mouhssine.

**Decision 0003: Database and hosting: PostgreSQL on a free EU host**

Options: a free EU-region Postgres with a free app host (picked); SQLite on the app host (free, but the free host wipes its disk on every deploy); Firebase (the security engineer objected: the free plan's region can't be chosen in a way that guarantees EU-only storage, which breaks the outside rule).

> Go deeper: free tiers sleep after inactivity, so the first page load of a class can take about 30 seconds. The teacher opens the session before class, which wakes it. This is on the risk list.

## 4. How the parts fit together

**In short:** one Flask app does everything: pages, check-ins and the database. The teacher's page asks for updates every few seconds.

```
Student phone ──check in (code)──▶ Flask app ──▶ PostgreSQL (EU)
Teacher laptop ◀──list every 3 s── Flask app
Projector ◀──new code every 30 s── Flask app
```

**Decision 0004: Live list: ask every 3 seconds (polling), not WebSockets.** Simpler to build and works through the school Wi-Fi's proxy. 40 students × 1 teacher page is tiny. Decided by the architect, accepted by Mouhssine.

## 5. Data and privacy

**In short:** we store only what attendance needs: student number, name, class, time of check-in. Nothing else, kept for one semester.

- Data stays in the EU host (decision 0003).
- Students are created from the class list CSV the teacher already has. Students get no password: they type their student number at check-in, protected by the room code (decision 0005).
- After the semester, a button deletes the semester's data. This is a must-have for the demo, because the teacher will ask.

## 6. Security risks and what we do about them

**In short:** the main risks are students checking in for absent friends, teachers seeing other teachers' classes, and the database password leaking. Each has a fix in the tasks.

| Risk                                                                | Fix                                                                                            | Task |
| ------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---- |
| Checking in for a friend from home                                  | code shown only in the room, changes every 30 s; one check-in per phone per session (a cookie) | T7   |
| A teacher opens another class's list by changing the id in the link | every request checks the class belongs to the logged-in teacher                                | T5   |
| Database password in the repo                                       | stored in the host's settings, never committed; `.env` in `.gitignore`                         | T1   |
| Someone tries many teacher passwords                                | at most 5 failed logins per 15 minutes                                                         | T4   |
| A student number typed into a form breaks the database query        | database queries only through the library's placeholders                                       | T6   |

**Decision 0005: Students don't log in.** Options: no student login, room code + student number (picked); a password per student (1,200 passwords to hand out and reset); school single sign-on (not available to student projects, the teacher said). The security engineer flagged that someone in the room can check in for a friend sitting outside. Accepted as a known limit: the teacher can see a check-in's time and fix the list by hand.

## 7. The look and the main screens

**In short:** four screens, the school's colors, large text on phones.

1. Teacher: log in.
2. Teacher: my classes → open a check-in.
3. Projector: the code, big, with a 10-minute countdown.
4. Student: one field for the student number, one for the code, one button. Green screen when it worked, a clear message when not ("The code changed, look at the screen again").

Empty and error states: "No students checked in yet", "This session is closed", "Wrong code".

## 8. AI

Not used.

## 9. Who does what, and in what order

**In short:** Sara builds the backend, Yassine builds the pages, Mouhssine builds the live parts and joins the two. Each person owns whole folders, so their work rarely overlaps.

| Area                                       | Folder                               | Owner     |
| ------------------------------------------ | ------------------------------------ | --------- |
| Backend and database                       | `app/api/`, `app/db/`                | Sara      |
| Pages and styles                           | `app/templates/`, `app/static/css/`  | Yassine   |
| Live list, projector code, check-in script | `app/static/js/`, `app/live/`        | Mouhssine |
| Shared files (no overlap warnings)         | `app/routes.py`, `app/db/schema.sql` | all       |

| Week | Tasks                                                                                                                  |
| ---- | ---------------------------------------------------------------------------------------------------------------------- |
| 1    | T1 project setup and hosting (Mouhssine) · T2 database tables (Sara) · T3 page layout and school colors (Yassine)      |
| 2    | T4 teacher login (Sara) · T5 "my classes" with ownership check (Sara) · T8 login and class pages (Yassine)             |
| 3    | T6 import class list CSV (Sara) · T7 check-in with rotating code (Mouhssine) · T9 student check-in page (Yassine)      |
| 4    | T10 live list with manual fixes (Mouhssine) · T11 projector page (Yassine) · T12 CSV export (Sara)                     |
| 5    | T13 delete semester data (Sara) · T14 error and empty states (Yassine) · T15 test with 30 phones in a real class (all) |
| 6    | T16 fixes from the test (all) · T17 demo rehearsal (all)                                                               |

Halfway demo: end of week 3, a working check-in without the live list.

## 10. Risks

| Risk                                        | Chance | Impact | What we do                                                          | Who watches |
| ------------------------------------------- | ------ | ------ | ------------------------------------------------------------------- | ----------- |
| Free host sleeps and the first load is slow | high   | low    | teacher opens the session before class                              | Mouhssine   |
| School Wi-Fi blocks something               | medium | high   | test in a real classroom in week 3, not week 5                      | Yassine     |
| Sara is the only backend person             | medium | high   | Mouhssine reviews every backend pull request, so two people know it | Mouhssine   |
| Students check in for friends in the room   | medium | low    | accepted limit (decision 0005); teacher fixes by hand               | —           |
| Scope creep (statistics)                    | high   | medium | nothing from "Later" before week 5 is green                         | Mouhssine   |

## 11. Decisions log

| #    | Decision                   | Options looked at               | Decided by                                |
| ---- | -------------------------- | ------------------------------- | ----------------------------------------- |
| 0001 | Backend: Flask             | Flask, Django, Node             | Mouhssine, Sara agreed                    |
| 0002 | Plain HTML, no React       | plain HTML, React               | Mouhssine after push-back                 |
| 0003 | Postgres on a free EU host | EU Postgres, SQLite, Firebase   | architect, security objection on Firebase |
| 0004 | Polling every 3 s          | polling, WebSockets             | architect, accepted by Mouhssine          |
| 0005 | No student login           | no login, passwords, school SSO | Mouhssine, known limit accepted           |

## 12. Words used

- **Backend:** the part of the app that runs on a server and keeps the data.
- **Polling:** the page asks the server "anything new?" every few seconds.
- **WebSockets:** a connection that stays open so the server can send news at once. Faster, but more to build.
- **Free tier:** the free plan of a hosting company, with limits.
- **Placeholder (in a query):** a way to pass user input to the database so it can never be read as a command.

---

## What Elbo writes when the plan is saved

- `.team/plan.md`: the plan above.
- `.team/decisions/0001-backend-flask.md` … `0005-no-student-login.md`, each with `options`, `decided_by`, `status: active`.
- `.team/rulebook.md`, "What this project is": the one-line summary. "Code rules": "Python and Flask on the server; plain HTML pages, no front-end framework." · "Every request that reads a class checks it belongs to the logged-in teacher." · "Secrets live in the host's settings, never in the repo." · "Database queries use placeholders, never string building." "Shared files": `app/routes.py`, `app/db/schema.sql`.
- 17 team tasks with owners and folders, in week order.
