---
title: "Identity for check-ins"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["Anonymous browser session", "University login", "Email sign-in link"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0010: Identity for check-ins**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Anonymous browser session** (picked) | No passwords, email collection, or account setup. | New browsers can create extra identities; presence cannot be verified. | Fits the deadline and existing React/Flask skills. |
| University login | Could restrict participation to campus accounts. | Needs university access and setup that are not provided; still cannot prove presence. | Defer as the brief allows. |
| Email sign-in link | Avoids storing passwords. | Adds email delivery, personal data, and link security work. | Too much setup for this free, 24-hour entry. |

Why: Keep the demo easy to join. Authorize writes using the server-issued session, never a user identifier supplied in the request. Accept and explain that anonymous participation cannot prevent all false reports. Proposed by the security engineer.
