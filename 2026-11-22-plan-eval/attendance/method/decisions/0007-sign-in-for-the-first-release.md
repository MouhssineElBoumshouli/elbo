---
title: "Sign-in for the first release"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["School-provisioned Django accounts", "School single sign-on"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0007: Sign-in for the first release**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| School-provisioned Django accounts | Uses built-in account handling without an external login integration. | School staff must verify identities and manage activation and recovery. | Conditional baseline with 12 implementation hours explicitly budgeted. |
| School single sign-on | Students reuse their school login; the school handles password recovery. | Requires documentation, access and integration work that is not yet estimated. | Choose in week 1 if required or supported within the same budget; replace local-account work. |

Why: Sara confirms one route with school IT and security in week 1. Local accounts require school-verified, single-use, expiring password-setting links delivered through an approved EU school channel, never shared passwords. Recovery uses the same identity checks and invalidates old sessions. Configure Argon2, a deliberately costly password hash, through Django. [Django password guidance](https://docs.djangoproject.com/en/5.2/topics/auth/passwords/). Add account-aware temporary login delays and recovery limits … Proposed by the software architect.

> Disagreement: Security must use the same week-1 choice. If neither route fits the budget and school support, keep the demo fictional; do not silently spend the buffer or release incomplete login.
