---
title: "Public room status"
author: "security engineer"
date: 2026-11-22
files: []
commit: ""
options: ["Reported check-in totals", "Free/busy labels"]
decided_by: "security engineer, proposed"
status: proposed
---

**Decision 0011: Public room status**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Reported check-in totals** (picked) | Useful signals without exposing individual identities. | Counts are incomplete and may be false; small counts can reveal presence indirectly. | Works with the PDF and voluntary check-ins. |
| Free/busy labels | Very quick to understand. | Suggests verified availability despite missing occupancy and capacity data. | Cannot support the promise made by the brief. |

Why: Show “3 active check-ins” or “No active reports — availability unknown.” Explain that reports expire and do not reserve seats. The three-minute pitch should state this limitation. Proposed by the security engineer.

> Disagreement: The requested free/busy status is not supported by a room-name PDF and voluntary reports.
