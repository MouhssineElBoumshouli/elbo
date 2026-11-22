---
title: "How much a check-in proves"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["Authenticated check-in with teacher review", "Authenticated check-in plus classroom code", "Location or Wi-Fi-based proof"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0010: How much a check-in proves**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Authenticated check-in with teacher review** (picked) | Simple; ties each record to an enrolled account. | A student can check in remotely or share their account. | Fits day-one scope and existing manual correction. |
| Authenticated check-in plus classroom code | Adds a small obstacle to remote check-in. | Codes can be forwarded and add classroom steps. | Optional later improvement if teachers need it. |
| Location or Wi-Fi-based proof | May provide an additional location signal. | Signals are unreliable, add privacy concerns and can reject present students. | Too much complexity for this team and deadline. |

Why: Treat the result as a student declaration. Teachers retain final control. Use server time, class enrolment checks and one record per student per session. Proposed by the security engineer.

> Disagreement: Phone check-in alone cannot establish physical presence. Working on school Wi-Fi must not be confused with proving attendance.
