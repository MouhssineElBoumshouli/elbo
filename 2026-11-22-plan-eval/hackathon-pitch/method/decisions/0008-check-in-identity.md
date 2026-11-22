---
title: "Check-in identity"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Random browser token", "University account login"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0008: Check-in identity**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Random browser token** (picked) | No login integration or student identity collection. | One person can create reports through several browsers. | Enough for a clearly labelled crowd-reporting prototype. |
| University account login | Could limit reports per account. | Needs university integration details and potentially approval. | Deferred beyond the hackathon. |

Why: Allow one active check-in per token, verify ownership, and rate-limit writes. Combine explicit SameSite cookies with server origin checks. Counts represent active check-ins, not verified unique students. Proposed by the software architect.
