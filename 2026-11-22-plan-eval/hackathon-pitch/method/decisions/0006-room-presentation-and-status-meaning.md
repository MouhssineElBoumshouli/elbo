---
title: "Room presentation and status meaning"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["Building list with active check-ins", "Map with active check-ins"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0006: Room presentation and status meaning**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Building list with active check-ins** (picked) | Works with the PDF and scans quickly on phones. | Cannot guarantee available seats. | Fits Noor’s design work without collecting coordinates. |
| Map with active check-ins | Helps locate unfamiliar buildings. | Needs location data and extra interface work. | Too much work for this deadline. |

Why: Use “No active reports — availability unknown” and “3 active check-ins” consistently in responses, screens, and pitch examples. Neither zero nor positive counts establish free/full status. Proposed by the software architect.

> Disagreement: The brief’s free/busy promise exceeds the available evidence. Use reported use and unknown availability in the pitch.
