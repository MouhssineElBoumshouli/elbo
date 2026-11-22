---
title: "How teachers repair a mistaken correction"
author: "designer"
date: 2026-11-22
files: []
commit: ""
options: ["Change and save the status again", "Separate undo action"]
decided_by: "designer, proposed"
status: proposed
---

**Decision 0013: How teachers repair a mistaken correction**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Change and save the status again** (picked) | Reuses the required correction control and server action. | Takes another edit to reverse a mistake. | Adam owns browser behaviour; Sara owns saving within the existing correction allocation. |
| Separate undo action | Quickly reverses the last change. | Needs previous-value tracking and rules for intervening updates. | Provisionally adds 2–4 implementation hours; defer because these are unallocated. |

Why: Show the saved status clearly and keep it editable. This supports recovery without a second correction mechanism. Proposed by the designer.
