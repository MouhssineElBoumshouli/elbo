---
title: "How students reach a session"
author: "designer"
date: 2026-11-22
files: []
commit: ""
options: ["App address, sign-in, then session code", "Session link with optional QR code"]
decided_by: "designer, proposed"
status: proposed
---

**Decision 0011: How students reach a session**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **App address, sign-in, then session code** (picked) | Works with a spoken or written code; needs no projector. | Students must type the code and may make mistakes. | Matches the architecture; no extra joining feature beyond its code flow. |
| Session link with optional QR code | Less typing when teachers can share or display it. | Must preserve the session through login; QR adds generation and phone checks. | Provisionally adds 3–5 implementation hours over code entry; not allocated. |

Why: Use the architecture’s code submission flow. Sign-in comes first, so no session needs to survive login. Keep code errors on the same screen. Codes locate sessions; they do not prove identity or presence. Proposed by the designer.
