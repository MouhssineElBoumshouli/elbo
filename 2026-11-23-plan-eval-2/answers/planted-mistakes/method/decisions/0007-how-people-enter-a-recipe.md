---
title: "How people enter a recipe"
author: "designer"
date: 2026-11-22
files: []
commit: ""
options: ["One grouped form", "Step-by-step form"]
decided_by: "designer, proposed"
status: proposed
---

**Decision 0007: How people enter a recipe**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **One grouped form** (picked) | Shows recipe details and photos together and needs fewer screens. | Long recipes require scrolling on phones. | Fits Ben's HTML/CSS and Ana's ordinary Django forms. |
| Step-by-step form | Shows fewer fields at once. | Needs navigation, saved progress and more checking. | Adds work beyond the 42-hour planned allowance. |

Why: Clear groups keep the form understandable without extra browser state. Proposed by the designer.
