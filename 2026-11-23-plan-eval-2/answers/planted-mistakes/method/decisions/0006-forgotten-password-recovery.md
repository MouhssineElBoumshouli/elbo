---
title: "Forgotten-password recovery"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["Administrator-assisted reset-link delivery", "Automatic reset email"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0006: Forgotten-password recovery**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Administrator-assisted reset-link delivery** (picked) | Works without a new email service and still lets the member choose the password. | Requires a trusted identity check and an available administrator. | Selected for day one; implementation is in A2, wording in B3 and checks in C4. |
| Automatic reset email | Members recover access without waiting for an administrator. | Needs a permitted free sender, delivery checks and request limits. | A later option if the school provides a working sender and time permits. |

Why: Free email delivery is unproven. Name an administrator and test identity checks and link delivery before inviting real users. Proposed by the security engineer.
