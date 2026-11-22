---
title: "Application structure"
author: "software architect"
date: 2026-11-22
files: []
commit: ""
options: ["One Django application", "One Flask application", "Separate services with Kubernetes"]
decided_by: "software architect, proposed"
status: proposed
---

**Decision 0002: Application structure**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **One Django application** (picked) | Supplies account, form and administrator tools in one place. | Requires learning Django. | Uses Ana's Python and Ben's HTML/CSS, with 8 learning hours explicitly included. |
| One Flask application | Offers a small Python starting point. | Requires joining more account and form components. | Fits Ana's language knowledge but adds integration choices before day 14. |
| Separate services with Kubernetes | Allows separate deployment and scaling. | Requires several deployments, service connections and cluster administration. | No relevant experience is stated; it does not fit 60 total hours. |

Why: The required work is ordinary accounts, forms and pages. Existing framework tools save setup work. Proposed by the software architect.
