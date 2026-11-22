---
title: "What room status means"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Reported counts with unknown availability", "Inferred free/busy labels"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0007: What room status means**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Reported counts with unknown availability** (picked) | Provides evidence without inventing occupancy. | Cannot promise a seat. | Works with voluntary reports and the PDF. |
| Inferred free/busy labels | Easy to scan. | Missing reports can falsely imply an empty room. | Unsupported by the available data. |

Why: Show reported activity and count refresh time, while explaining that bookings and unreported occupants are unknown. Proposed by the software architect.

> Disagreement: The requested free/busy status cannot be established from the supplied information.
