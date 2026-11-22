---
title: "App and storage"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Flask, React and SQLite together", "Flask templates and plain JavaScript", "Separate frontend and managed database"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0003: App and storage**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Flask, React and SQLite together** (picked) | Uses both developers’ skills with one deployment. | Needs a React build step and agreed response fields. | Fits Tom and Ilias’s skills and existing task allocations. |
| Flask templates and plain JavaScript | Removes the React build step. | Changes Tom’s familiar workflow. | A possible simplification if React setup becomes a blocker. |
| Separate frontend and managed database | Can scale separately later. | Adds accounts, settings and failure points. | Too much setup for this free, 24-hour entry. |

Why: It uses existing skills and keeps deployment small. Proposed by the software architect.
