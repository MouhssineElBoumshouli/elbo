---
title: "Photo submission and feedback"
author: "designer"
date: 2026-11-22
files: []
commit: ""
options: ["One submission with a waiting message", "Independent photo uploads"]
decided_by: "designer, proposed"
status: proposed
---

**Decision 0008: Photo submission and feedback**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **One submission with a waiting message** (picked) | Works with ordinary Django forms and keeps five-photo submission. | A failed validation requires selecting photos again; there is no per-photo percentage. | Included in Ben's B3, Ana's A4 and existing verification tasks. |
| Independent photo uploads | Can show individual progress, retry one photo and retain completed uploads. | Needs upload identifiers, temporary storage cleanup and more JavaScript and testing. | Does not fit Chloe's planned hours; defer until after grading. |

Why: It preserves the required photo count while keeping implementation and failure states small. Proposed by the designer.
