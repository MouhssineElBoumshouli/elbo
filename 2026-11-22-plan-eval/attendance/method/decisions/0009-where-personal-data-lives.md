---
title: "Where personal data lives"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["School-managed EU hosting", "Verified free EU service"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0009: Where personal data lives**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School-managed EU hosting** (picked) | Can use existing school administration and approved infrastructure. | Availability, certificates, backups and support are unknown. | Preferred if provided free and confirmed in week 1. |
| Verified free EU service | May reduce server administration. | Free limits and locations of logs, backups and support access need checking. | Fallback only after the whole data path is verified. |

Why: The free-only budget does not establish that suitable hosting exists. Confirm the app, database, login, logs and backups before uploading real records. EU storage is an explicit project requirement, separate from broader GDPR duties. Proposed by the security engineer.

> Disagreement: A free account or an EU database region alone is insufficient evidence that all student data stays in the EU.
