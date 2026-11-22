---
title: "Hosting and persistent storage"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Render with PostgreSQL; local PostgreSQL fallback", "Laptop-only Flask and PostgreSQL"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0005: Hosting and persistent storage**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Render with PostgreSQL; local PostgreSQL fallback** (picked) | Public HTTPS phone access and one storage implementation. | Hosting can sleep; local PostgreSQL needs setup. | Primary choice, with deployment, learning, and fallback time explicitly budgeted. |
| Laptop-only Flask and PostgreSQL | Free offline demo using the same application and database code. | Demonstrates two laptop browsers rather than shared campus phone access. | Fallback if hosting cannot be proved within its allowance. |

Why: Use HTTPS for the two-phone milestone. Rehearse offline with two separate laptop browser profiles and localhost-only settings. Remove the proposed SQLite implementation. Hosted local files are temporary, so PostgreSQL remains the hosted store. [Storage limits](https://render.com/docs/free). Proposed by the software architect.
