---
title: "Hosting"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["School-provided EU server", "Render free website and database"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0004: Hosting**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School-provided EU server** (picked) | Can provide persistent storage and approved school-network access. | Availability, maintenance support and capacity are unconfirmed. | Fits free-only only if the school provides it without charge. |
| Render free website and database | Managed deployment with a Frankfurt region. | Database expires after 30 days; website sleeps after 15 idle minutes. | Fails the continuing-service need and 42-day project timeline. |

Why: Conditional on confirmation in week 1. Free public hosting is not established as viable. Render’s documented expiry rules exclude this option. [Limits](https://render.com/docs/free), [regions](https://render.com/docs/regions). Proposed by the software architect.

> Disagreement: Free-only cannot be treated as a guarantee that a dependable department-wide service is available.
