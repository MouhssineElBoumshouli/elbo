---
title: "Application structure"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Django templates and small JavaScript files", "React frontend and Python API"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0003: Application structure**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Django templates and small JavaScript files** (picked) | One application; built-in accounts and forms. | Django and its template conventions need learning. | Uses Sara’s Python/SQL, Adam’s JavaScript and Yassine’s HTML/CSS. |
| React frontend and Python API | Adam can use his React experience. | Adds separate builds, API contracts and more account integration. | Too much overhead for 144 hours and simple pages. |

Why: The must-haves need forms and a changing list. One application gives all three people useful work while keeping integration small. Proposed by the software architect.
