Build a small, working family cookbook in 14 days. The core features are a reasonable target for 60 hours, provided you simplify the architecture and change the password and photo-storage requirements. Treat “day one” as the first release on day 14.

## Three changes needed before building

- **Store password hashes, never plain-text passwords.** Email an expiring, single-use reset link when someone forgets their password. Use Django’s built-in authentication and recovery features. Passwords should never be recoverable or emailed. [Django password documentation](https://docs.djangoproject.com/en/5.2/topics/auth/passwords/)
- **Store photos outside the database.** Your estimate is 2,000 × 5 MB = 10,000 MB, roughly 10 GB: 20 times the entire 500 MB database allowance, before other data. Store only photo paths and metadata in the database. Resize and compress uploads on the server; targeting 300 KB per photo would still require roughly 600 MB, plus headroom and backups. That target is an estimate, not a guaranteed size.
- **Use one Django application.** Keep accounts, recipes, and photos as separate modules within it. Defer microservices, the API gateway, Docker, and Kubernetes. Their deployment and debugging work would consume too much of this team’s learning and delivery time. If that architecture remains mandatory, this 60-hour feature plan is no longer credible.

## First-release scope

Include email/password registration, login/logout, password recovery, a recipe list, recipe detail pages, recipe creation with zero to five photos, and signed-in comments. Each recipe has a title, ingredients, instructions, and author. Provide basic administrator removal of inappropriate recipes and comments.

Use cream backgrounds, warm accent colours, readable typography, and recipe cards with large photos. Make forms and recipe pages usable on phones. No AI features.

Defer ingredient search, favourites, ratings, profiles, and elaborate editing tools until after grading.

## Technical approach and free hosting

Use Python/Django, server-rendered HTML, CSS, and minimal JavaScript for photo previews. Keep users, recipes, comments, and photo metadata in the database; put image files in persistent media storage. Keep validation rules in small functions, with storage and email operations at the edges.

By the end of day 2, verify a free hosting route with HTTPS, persistent photo storage, enough database capacity, and working reset-email delivery. Check quotas, expiry, and whether files survive redeployment. School-provided hosting is a candidate, but its availability is unconfirmed. Do not assume a free application host includes persistent storage or email.

If no suitable free host is available, deliver a local demonstration using sample accounts and document that public family access is blocked. That fallback supports grading but does not satisfy an online launch. For public use, require HTTPS and safe handling of uploaded files. [Django deployment checklist](https://docs.djangoproject.com/en/6.0/howto/deployment/checklist/)

## Schedule and hour allocation

Hours below are person-hours, including learning, integration, and testing.

| Days | Deliverable | Ana | Ben | Chloe |
|---|---|---:|---:|---:|
| 1–2 | Agree scope, set up Django and shared repository, sketch pages, verify hosting/storage/email | 3 h | 3 h | 3 h |
| 3–5 | Registration/login, recipe data and basic posting; page templates and responsive styling | 6 h | 5 h | 4 h |
| 6–8 | Photo uploads and previews, recipe details, comments, recovery flow | 5 h | 4 h | 5 h |
| 9–10 | Integrate and deploy; complete one full user journey | 2 h | 3 h | 3 h |
| 11–12 | Acceptance checks, bug fixes, backup/restore check, demonstration content | 2 h | 3 h | 3 h |
| 13–14 | Contingency, final fixes, README and grading rehearsal | 2 h | 2 h | 2 h |
| **Total** | **60 hours** | **20 h** | **20 h** | **20 h** |

Ana owns Django models, authentication, and server integration. Ben owns templates, styling, accessibility, and the demonstration guide. Chloe owns photo previews, upload integration with Ana, and acceptance checks. Chloe will need some Django learning time; the allocation includes it.

## Milestones and completion checks

- **Day 2:** Hosting dependencies are verified or the local-demo limitation is recorded. Agree the recipe fields and page structure.
- **Day 5:** A user can register, log in with email, publish a text recipe, and view it.
- **Day 8:** Photos, comments, and password recovery work together. Freeze feature scope.
- **Day 10:** A second person completes the full journey on the intended deployment.
- **Day 12:** Confirm that five photos succeed, six are rejected server-side, invalid or oversized files are rejected, and failed uploads leave no broken recipe records. Confirm that logged-out users cannot post or comment, comments render as text, and reset links expire and cannot be reused. Verify database passwords are hashes and uploaded photos survive restart/redeployment.
- **Day 14:** Demonstrate registration → recipe with photos → comment → password reset. Hand in source code, setup instructions, architecture rationale, test results, and known limitations.

Keep the final six person-hours reserved for problems. If progress slips, cut visual polish and photo-preview conveniences first. Keep authentication, server-side upload limits, and the required recipe/comment journey intact.
