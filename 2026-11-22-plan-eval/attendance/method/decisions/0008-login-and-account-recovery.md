---
title: "Login and account recovery"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["School login", "School-email magic links", "App passwords"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0008: Login and account recovery**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **School login** (picked) | The school handles passwords and recovery. | Needs school access and an approved EU-compatible setup. | Best use of 144 hours if available in week 1. |
| School-email magic links | No app passwords; a short-lived email link signs the user in. | Needs approved email delivery, abuse limits and protection against reused links. | Fallback only if free delivery and EU handling are confirmed. |
| App passwords | Does not depend on school login integration. | Adds password storage, recovery and support work. | Poor fit for six weeks; requires re-estimation. |

Why: Use the existing school account system if confirmed. Accept only approved department accounts, and obtain roles from trusted school records. Recovery stays with the school. Follow established [authentication guidance](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html). Proposed by the security engineer.
