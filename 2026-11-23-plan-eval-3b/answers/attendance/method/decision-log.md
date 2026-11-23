# Decision log: Class Check-In

Written by codex gpt-6-astra, reviewed by claude claude-opus-5-5 (effort high). Stopped after round 1: no blocker was fixed, so no new review.

## Decisions

### 0001 Website structure

Picked: Django pages with small JavaScript additions. Looked at: Django pages with small JavaScript additions, React with a separate Python service, JavaScript throughout.

Why: Fits Sara's Python, Adam's JavaScript and Yassine's HTML/CSS. Sara gets Django learning time in week 1.

### 0002 Database

Picked: SQLite for the class trial. Looked at: SQLite for the class trial, PostgreSQL on a school-provided server.

Why: One file simplifies setup and backups. Simultaneous writes must pass the trial test.

### 0003 Hosting

Picked: Try PythonAnywhere EU free hosting in week 1. Looked at: Try PythonAnywhere EU free hosting in week 1, Existing school-approved EU server at no cost, Teacher laptop as the permanent server.

Why: An early address enables school Wi-Fi testing. Free terms need checking; a school server is not guaranteed.

### 0004 Accounts and class setup

Picked: Individual accounts and invented class created through Django admin. Looked at: Individual accounts and invented class created through Django admin, Checked class-list import, School single sign-on, Names or student numbers with a shared code.

Why: Admin screens save time while preserving account checks. Imports add no demo value; school login support is unknown.

### 0005 Live teacher list

Picked: Request updates every five seconds. Looked at: Request updates every five seconds, Keep a permanent live connection, Require manual refresh.

Why: Regular requests keep the list current with modest work and fit the trial.

### 0006 Backup and deletion

Picked: Copy the database with writes paused; delete records through admin. Looked at: Copy the database with writes paused; delete records through admin, Build separate backup and deletion tools.

Why: A documented copy and restore test fit the demo, preserving Sara's time for learning and attendance rules.

## Reviews

| Round | Score | Words | Blockers | Shoulds | Nits |
| --- | --- | --- | --- | --- | --- |
| 1 | 7.5/10 | 1579 | 0 | 2 | 1 |

## What the writer did with each point

| Round | Id | Severity | From | Point | Outcome | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | R1 | should | reviewer | Sara writes the whole server side in 42 hours. She knows Python and SQL but has no stated Django experience. Her week-2 block puts accounts, a checked class-list import, permissions and session opening into 7 hours. Week 5 puts deployment, backup, restore and deletion tools into another 7 hours. | fixed | Removed the import and separate operations tools, added Django learning time, and redistributed Sara's 42 hours while keeping her 6-hour reserve. |
| 1 | R2 | should | reviewer | No week-1 task creates the shared code repository, the empty Django project or Yassine's local setup. Deployment to PythonAnywhere first appears in week 5, in the same week as 'integrate the full journey'. Yet Yassine's week-1 task tests 'the proposed website' on school Wi-Fi before any site exists. | fixed | Week 1 now creates the shared project, supports Yassine's local setup and tests a published EU address on school Wi-Fi, with weekly updates thereafter. |
| 1 | C1 | should | check | The plan is 1579 words; the limit for a medium plan is 1500. | fixed | Shortened the plan text to under 1,500 words while keeping its schedule and supporting data aligned. |

## Nits, left as they are

- Round 1, R3: In week 2, Adam builds the JavaScript for teacher session controls while Sara builds the matching server code, and nothing says what data passes between them. The same happens in weeks 3 and 4 for check-in and the live list.