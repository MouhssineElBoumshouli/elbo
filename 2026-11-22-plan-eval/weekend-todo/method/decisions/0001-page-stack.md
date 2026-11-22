---
title: "Page stack"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Plain JavaScript + localStorage", "React + localStorage"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0001: Page stack**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Plain JavaScript + localStorage** (picked) | Free; few moving parts. | Storage belongs to one browser. | Builds on Lina’s HTML/CSS and teaches JavaScript directly. |
| React + localStorage | Reusable screen components. | Adds framework learning and setup. | Too much overhead for this 12-hour project. |

Why: Meets every must-have without a database, account or build tools. Proposed by the software architect.
