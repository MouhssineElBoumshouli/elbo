---
title: "Database"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["PostgreSQL", "SQLite"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0005: Database**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **PostgreSQL** (picked) | Supports concurrent writes and database-enforced uniqueness. | Needs installation, credentials and backup setup. | Sara knows SQL; school IT support would reduce setup risk. |
| SQLite | Simple file-based setup. | Concurrent check-in writes can contend; deployment needs persistent disk. | Useful for a small demonstration, less suitable for department-wide bursts. |

Why: Use one database type in development, testing and deployment. Simultaneous class openings justify the modest setup cost. Proposed by the software architect.
