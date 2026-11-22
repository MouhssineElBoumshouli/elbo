---
title: "Application structure"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Django pages with SQLite", "React front end and Python API"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0005: Application structure**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Django pages with SQLite** (picked) | One project with built-in forms, sessions and database tools. | Django needs learning; SQLite permits one writer at a time. | Uses Sara’s Python, Adam’s JavaScript and Yassine’s HTML/CSS with 12 planned learning hours. |
| React front end and Python API | Uses Adam’s React experience. | Adds separate builds and more login integration. | Too much setup for the six-week schedule. |

Why: Simple forms and a changing list fit one application. Test short simultaneous writes before expanding. Proposed by the software architect.
