---
title: "Password protection"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["Django login with Argon2", "School-managed login"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0001: Password protection**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Django login with Argon2** (picked) | Meets email/password login without inventing password handling. | Needs an added dependency, configuration and attempt limits. | Included in Ana's A2 and Chloe's C4. |
| School-managed login | The school handles password protection and recovery. | Availability and access for families are unknown. | Only useful if an existing school service supports everyone and the login requirement can change. |

Why: It meets the brief and uses established tools. Explicit configuration avoids assuming the default is Argon2. Proposed by the security engineer.
