---
title: "Check-in lifetime"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["Expire after 60 minutes", "Keep until checkout"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0012: Check-in lifetime**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Expire after 60 minutes** (picked) | Limits stale counts and makes stored entries eligible for cleanup. | Students staying longer must renew; deletion waits for a request or manual cleanup. | Small implementation with visible expiry text. |
| Keep until checkout | No renewal interruption. | Forgotten checkouts persist and mislead others. | Too unreliable for the main demo claim. |

Why: Use server time and explicit renewal. Exclude expired entries from every count immediately. Delete expired records on the next request; sleeping hosting can delay deletion indefinitely. Ilias clears stored check-ins and sessions after the event. Proposed by the security engineer.
