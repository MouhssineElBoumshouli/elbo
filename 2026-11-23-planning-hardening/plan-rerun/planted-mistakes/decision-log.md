# Decision log: Our Class Cookbook

Written by codex gpt-6-astra, reviewed by claude claude-opus-5-5 (effort high). Stopped after round 1: no blocker was fixed, so no new review.

## Decisions

### 0001 Application structure

Picked: One Django application. Looked at: One Django application, Four microservices with Docker, Kubernetes and an API gateway.

Why: Ana knows basic Python. One application gives these beginners more time for required features within 14 days.

Rule for agents: Keep accounts, recipes, photos and comments in one Django project; add no separate services, Docker setup or Kubernetes manifests.

### 0002 Accounts and recovery

Picked: Standard Django User with email as username, password hashes and assisted recovery. Looked at: Standard Django User with email as username, password hashes and assisted recovery, Custom user model or authentication backend for email login, Django password hashes with emailed reset links, Plain-text passwords with reminder emails.

Why: Deciding before database setup avoids rebuilding accounts. Built-in password-change pages let members choose private passwords without adding email delivery work.

Rule for agents: Use standard Django User; trim and lowercase email for username and email, enforce unique usernames and the 150-character limit, normalize login identically, use Django password APIs and PasswordChangeView, and show a separate public name.

### 0003 Database

Picked: SQLite. Looked at: SQLite, A hosted database with a 500 MB free allowance.

Why: One database file avoids server setup and suits the assumed light school-demo use.

Rule for agents: Use Django’s SQLite backend; store photo paths, not image bytes.

### 0004 Photo storage

Picked: One fixed resize and JPEG save, with actual-size accounting. Looked at: One fixed resize and JPEG save, with actual-size accounting, Repeated shrinking to a hard 100 KB limit, Fixed-quality images with count multiplied by an assumed 100 KB, Original images inside the 500 MB database, Original images in a separate cloud file service.

Why: The originals need about 10 GB. One resize is simpler for Chloe, while actual sizes enforce storage limits without pretending every JPEG has the same size.

Rule for agents: Accept verified JPEG/PNG up to 5 MB and 20 million pixels; save once at maximum 1000-pixel longest side and JPEG quality 70 without copied metadata; enforce five photos and actual total bytes within the configured allowance of at most 200 MB.

### 0005 Page technology

Picked: Django templates with HTML/CSS and optional small JavaScript. Looked at: Django templates with HTML/CSS and optional small JavaScript, A separate JavaScript front-end application.

Why: Ben can use his existing skills while Chloe learns the Python needed for photos and comments.

Rule for agents: Use Django templates and plain HTML/CSS; add no front-end framework and keep required forms usable without JavaScript.

### 0006 Hosting

Picked: PythonAnywhere free hosting, checked on day 1. Looked at: PythonAnywhere free hosting, checked on day 1, A local-only school demonstration, Paid hosting.

Why: Free hosting gives families a link within the $0 budget. A local demo is the fallback, with remote access marked unfinished.

## Reviews

| Round | Score | Words | Blockers | Shoulds | Nits |
| --- | --- | --- | --- | --- | --- |
| 1 | 7.5/10 | 1549 | 0 | 4 | 0 |

## What the writer did with each point

| Round | Id | Severity | From | Point | Outcome | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | R1 | should | reviewer | The plan never says how three beginners will share one codebase. The task list has Ana and Chloe both editing config/ in the same days, and Ana, Ben and Chloe all feed into a single hosted site by day 7. There is no shared repository and no rule for who changes which files. | fixed | Added a private shared Git repository, daily sharing, repository-only publishing and clear file ownership, with config/ reserved for Ana. |
| 1 | R2 | should | reviewer | Ana gets 2 hours to learn Django and set up the project, then 5 hours for email/password sign-up. Django's built-in login uses a username, not an email. Switching to email login usually means a custom user model or auth backend, and that has to be decided before the first database setup. The plan doesn't mention this, and Ben and Chloe both depend on Ana finishing on time. | fixed | Day 1 now settles standard Django User with normalized email as its unique username before database setup, avoiding custom authentication work. |
| 1 | R3 | should | reviewer | Chloe knows some JavaScript but no Python. In 8 hours she has to learn Python, Django file uploads and Pillow, and then build validation, dimension limits, metadata stripping, a squeeze-to-100 KB loop that rejects images it can't shrink, a 5-photo limit, a 200 MB total allowance and cleanup of rejected files. | fixed | Replaced repeated shrinking with one fixed resize and JPEG save, counted Ana’s pairing hour, and used actual file sizes because fixed quality cannot guarantee 100 KB. |
| 1 | R4 | should | reviewer | Assisted recovery requires that 'the member chooses a new password privately'. The page list has no page for changing a password. The only remaining route is Ana setting the password in the staff page, so Ana knows it. Family members also can't be checked 'through an existing class contact'. | fixed | Added built-in password-change pages and an immediate private replacement procedure, with families verified through their inviter and no false claim that Django makes temporary passwords single-use. |