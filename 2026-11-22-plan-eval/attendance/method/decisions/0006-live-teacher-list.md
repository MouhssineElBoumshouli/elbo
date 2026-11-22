---
title: "Live teacher list"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Poll every five seconds", "Persistent push connection"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0006: Live teacher list**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Poll every five seconds** (picked) | Simple requests with ordinary retry behavior. | Updates can lag five seconds and generate repeated reads. | About eight reads per second for 40 open teacher lists. |
| Persistent push connection | Changes reach teachers immediately. | Adds connection management and deployment complexity. | Not justified unless five-second updates are unacceptable. |

Why: It meets a practical meaning of live within the six-week schedule. Show the last successful refresh so failures are visible. Proposed by the software architect.
