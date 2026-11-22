---
title: "Private membership"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["Administrator-approved signup", "Single-use email invitations", "Public browsing and open signup"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0005: Private membership**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Administrator-approved signup** (picked) | Uses existing account activation controls and avoids invitation-token code. | Members wait for approval and someone must verify them. | The smallest private membership process for this 60-hour project. |
| Single-use email invitations | Allows approved recipients to join directly. | Needs token creation, expiry, delivery, reuse checks and extra screens. | Too much additional implementation for the 42-hour work allowance. |
| Public browsing and open signup | Makes joining immediate. | Exposes family photos and increases unwanted posts. | Adds ongoing moderation work without a named operator. |

Why: It keeps recipes and photos private using existing administrator tools. No invitation links means no missing, expired or used invitation states to implement. Proposed by the security engineer.
