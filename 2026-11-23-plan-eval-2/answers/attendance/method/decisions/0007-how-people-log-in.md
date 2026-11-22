---
title: "How people log in"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["School login", "School-provisioned local accounts"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0007: How people log in**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School login** (picked) | The school handles passwords, identity and recovery. | Needs school approval, integration access and verified failure protection. | First choice for 1,240 people within the six-week, free-only plan. |
| School-provisioned local accounts | Can work without school login integration. | Adds account setup, slow password hashing, school-verified recovery and support. | Real accounts require a revised budget with named owners; until then use invented demo accounts. |

Why: Confirm integration and EU handling in week 1. Do not quietly add a real local-password service to the existing schedule. Proposed by the security engineer.
