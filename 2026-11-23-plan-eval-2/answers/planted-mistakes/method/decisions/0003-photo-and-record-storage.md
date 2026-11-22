---
title: "Photo and record storage"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["SQLite and reduced private files on one host", "Database records and separate hosted photo storage", "Original photos inside the 500 MB database"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0003: Photo and record storage**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **SQLite and reduced private files on one host** (picked) | Avoids a database server and a second storage service. | Application files and photos share limited disk space. | Preferred if Chloe proves capacity and private access within C2. |
| Database records and separate hosted photo storage | Can provide more photo capacity. | Adds service setup, permissions and transfer limits. | Consider later, or if the school provides a ready-to-use private service. |
| Original photos inside the 500 MB database | Records and files can be copied together. | About 100 original photos fill the allowance before other data. | Cannot support 2,000 originals on the stated budget. |

Why: One storage location is easier to operate. The day-2 measurement sets the real capacity. Proposed by the software architect.
