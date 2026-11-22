---
title: "Handling forgotten checkout"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Expire after 60 minutes with manual renewal", "Keep check-ins until checkout"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0009: Handling forgotten checkout**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Expire after 60 minutes with manual renewal** (picked) | Bounds stale reports without background jobs or location tracking. | Long sessions need renewal; forgotten exits remain temporarily. | Small, testable prototype rule. |
| Keep check-ins until checkout | Simplest interaction. | Abandoned reports accumulate. | Undermines the entry’s usefulness. |

Why: Treat 60 minutes as a prototype setting, not a measured campus norm. Show expiry and renewal; an open page never renews presence. Proposed by the software architect.
