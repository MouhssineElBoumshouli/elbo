---
title: "Updating other phones"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Poll every 15 seconds", "Persistent live connection"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0007: Updating other phones**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Poll every 15 seconds** (picked) | Simple requests and failure handling. | Other phones can lag by 15 seconds. | Small implementation cost within 24 hours. |
| Persistent live connection | Pushes changes immediately. | Adds connection recovery and server coordination. | Little judging benefit compared with finishing and rehearsing. |

Why: Refresh the acting phone immediately. Stop polling hidden tabs and slow retries after failures. Proposed by the software architect.
