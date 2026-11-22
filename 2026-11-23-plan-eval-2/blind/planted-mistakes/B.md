A small class cookbook is a reasonable 14-day target, but the proposed architecture and storage need changing to fit 60 beginner-team hours. This plan treats “day one” as the first release on day 14.

Three changes to agree at kickoff:

- Store password hashes, never plain-text passwords. Email a short-lived, single-use password-reset link instead of the password. This preserves account recovery without exposing everyone’s credentials. See [OWASP password storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [reset guidance](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- Build one Python/Django application with separate accounts, recipes and photos modules. Defer microservices, the API gateway, Docker and Kubernetes. Their setup and integration would consume time needed for the graded features; four services provide little benefit at this scale. If that architecture remains mandatory, the scope, deadline or available help must change.
- Store photo files outside the database; keep their paths and metadata inside it. 2,000 × 5 MB = 10,000 MB, approximately 10 GB—20 times the entire 500 MB database allowance, before any other data.

**Release scope**

Users can register with email and password, log in and out, recover access, browse recipes, publish a recipe with zero to five photos, and comment while signed in. Each recipe has a title, ingredients, instructions and author. Include a simple administrator route for removing inappropriate recipes or comments.

Use cream backgrounds, warm accent colours, readable type, generous spacing and recipe cards that work on phones. Search by ingredient, favourites and AI are outside this release.

**Technical and budget plan**

Use Django templates, HTML/CSS and small amounts of JavaScript for photo previews. Reuse framework authentication and forms. Keep validation rules in small pure functions, with database, file and email operations at the edges; split files before they grow beyond roughly 400 lines.

Accept JPEG/PNG uploads up to 5 MB each. Validate images on the server, resize and re-encode them, remove metadata, and enforce five photos per recipe on the server. Target a maximum stored size of 500 KB per image, rejecting files that cannot meet the limit. That reduces 2,000 stored images to at most approximately 1 GB, plus storage headroom and backups. Do not retain originals.

Day 2 is the hosting decision deadline: verify a free deployment route with persistent photo storage, database compatibility, HTTPS, reset-email delivery and sufficient storage/bandwidth quotas. Prefer school-provided infrastructure if available. No provider’s free capacity is assumed here. Check whether any service requires a payment card or can charge for overages.

If no suitable free hosting is available, deliver a local demonstration with test accounts and clearly label public family access as blocked. A local demo is a grading fallback, not completion of the online launch requirement.

**Schedule and ownership — 60 hours total**

Hours below include learning, integration and verification, rather than just coding.

| Days | Deliverable | Ana | Ben | Chloe |
|---|---|---:|---:|---:|
| 1–2 | Confirm scope; repository and app setup; page sketches; prove hosting, storage and email route | 3h | 3h | 3h |
| 3–5 | Email signup/login/reset; recipe model and forms; working page templates | 6h | 5h | 3h |
| 6–8 | Recipe publishing with photos; comments; complete browser journey | 4h | 4h | 6h |
| 9–11 | Deploy; test permissions, uploads and recovery; mobile polish and fixes | 3h | 4h | 4h |
| 12–13 | Classmate trial, README, sample recipes, backup/restore rehearsal and presentation | 2h | 2h | 2h |
| 14 | Contingency fixes and grading demonstration | 2h | 2h | 2h |
| **Total** | | **20h** | **20h** | **20h** |

Ana owns Python models, authentication and server validation. Ben owns templates, cookbook styling, accessibility and mobile layout. Chloe owns photo previews, upload integration, deployment checks and the acceptance checklist. Ana and Chloe pair on upload handling; the table counts each person’s time separately.

Milestones: a deployed skeleton by day 2; signup and a text recipe working by day 5; the complete signup → recipe with photos → comment journey by day 8. Freeze features then. Keep the final six hours for problems rather than adding extras.

**Acceptance checks for grading**

- A new user signs up with email, logs out and logs back in; duplicate email addresses are handled clearly.
- The database contains password hashes. Reset links work once, expire, and allow a new password to replace the old one.
- Recipes with zero and five photos work; a sixth photo, oversized upload and invalid image are rejected clearly.
- A second signed-in user can comment. Signed-out users cannot publish or comment, and users cannot alter someone else’s content through direct requests.
- Recipes, comments and photos survive an application restart; a backup can be restored.
- Core pages work on a phone with labelled controls and readable contrast.
- Public deployment uses HTTPS, disables debug mode and keeps secrets out of the repository, following the [Django deployment checklist](https://docs.djangoproject.com/en/dev/howto/deployment/checklist/).

Deliver the source code, setup instructions, a working deployment or explicitly limited local demo, sample recipes, acceptance-test results and a short explanation of the architecture and storage decisions. If progress slips, cut visual polish first; preserve authentication, five-photo posting, comments and their essential checks.
