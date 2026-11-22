---
title: "Page and storage"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Plain JavaScript + localStorage", "JavaScript + SQLite"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0001: Page and storage**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Plain JavaScript + localStorage** (picked) | Free, little setup, and direct JavaScript practice. | Data belongs to one browser; clearing browser data removes it. | Meets all four must-haves for Lina’s laptop. |
| JavaScript + SQLite | Keeps tasks in a database file that is easy to copy. | Needs extra server code to connect the page to the database. | Adds unnecessary learning and setup within 12 hours. |

Why: Lina already knows HTML/CSS and wants JavaScript practice. Browser storage meets the single-laptop requirement with the least code. Proposed by the software architect.
