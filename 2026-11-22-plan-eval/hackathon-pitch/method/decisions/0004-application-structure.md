---
title: "Application structure"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["React served by Flask", "Flask templates with plain JavaScript"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0004: Application structure**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **React served by Flask** (picked) | Uses both developers’ skills; one public address and deployment. | Requires a small frontend build step. | Fits Tom’s React experience and Ilias’s Flask experience. |
| Flask templates with plain JavaScript | Fewer build tools. | Loses the benefit of Tom’s React experience. | Possible, but offers little deadline benefit. |

Why: Use one repository with small frontend and backend folders. Drop microservices, Kubernetes, separate frontend hosting, and additional database implementations. Proposed by the software architect.
