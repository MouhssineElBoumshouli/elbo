# Decision log: Our Class Cookbook

Written by codex gpt-6-astra, reviewed by claude claude-opus-5-5 (effort high). Stopped after round 1: no blocker was fixed, so no new review.

## Decisions

### 0001 Application structure

Picked: One Django application. Looked at: One Django application, Four services with an API gateway, Docker and Kubernetes.

Why: Ana can build on her Python basics after a short tutorial. Four services add more setup than this team can fit into 60 hours.

### 0002 Accounts and passwords

Picked: Custom email user model from setup, Django hashes and reset links. Looked at: Custom email user model from setup, Django hashes and reset links, Default username model changed later, Readable passwords emailed on request.

Why: Email login must be decided before database creation. Readable passwords are unsafe.

### 0003 Member actions

Picked: Members create; administrators change or remove. Looked at: Members create; administrators change or remove, Members also edit and delete their own content.

Why: Editing was not requested. Removing it frees Ana's time for learning Django and pairing on photos.

### 0004 Photo storage and processing

Picked: SQLite records, resized photo files and manual disk checks. Looked at: SQLite records, resized photo files and manual disk checks, Photo files with automatic storage quota checks, Original photos inside a 500 MB database, Separate hosted database and file services.

Why: The originals need about 10 GB. A small Pillow helper built with Ana and a published allowance reduce Chloe's Python work and avoid extra services.

### 0005 Page design

Picked: Django HTML pages with CSS and optional small JavaScript additions. Looked at: Django HTML pages with CSS and optional small JavaScript additions, Separate JavaScript application.

Why: This fits Ben's HTML/CSS and Chloe's limited JavaScript skills.

### 0006 Hosting

Picked: Test PythonAnywhere first, then available free school hosting, with laptop fallback. Looked at: Test PythonAnywhere first, then available free school hosting, with laptop fallback, Require 2 GB before considering public hosting, Plan only a laptop demonstration.

Why: A smaller photo allowance makes free family access worth testing. The laptop remains a grading fallback, not a completed family-access deliverable.

## Reviews

| Round | Score | Words | Blockers | Shoulds | Nits |
| --- | --- | --- | --- | --- | --- |
| 1 | 8/10 | 1480 | 0 | 4 | 1 |

## What the writer did with each point

| Round | Id | Severity | From | Point | Outcome | Reason |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | R1 | should | reviewer | Chloe, who knows 'some JavaScript', is given the hardest Python work in the plan: server-side image checks, decoded-dimension limits, resizing and re-saving, metadata stripping, a 500 KB cap and storage quota checks, all in Django/Pillow, in 7 hours. On top of that, her week-two testing covers full storage and interrupted uploads. | fixed | Simplified photo processing to standard Pillow operations, budgeted two pairing hours for both Ana and Chloe, and removed automatic quotas and full-storage/interrupted-upload tests. |
| 1 | R2 | should | reviewer | Ana has basic Python and no Django experience, but she gets 12 hours to set up Django and build accounts with reset, recipe and comment saving, ownership checks and admin removal. No time is set aside to learn Django. The ownership checks exist only because the plan assumes members can edit their posts, which the brief never asks for. | fixed | Removed member editing, deleting and ownership checks, added a day-one Django tutorial hour, and kept Ana within 18 planned hours. |
| 1 | R3 | should | reviewer | The plan wants email-and-password login but never says how. Django's default user logs in with a username. Switching to email login needs a custom user model or an email-auth backend, and the custom user model has to exist before the first migration. | fixed | Ana creates and configures the custom email user model before the first migration and records that requirement in the shared instructions. |
| 1 | R4 | should | reviewer | The audience is 60 classmates and their families, but the hosting step is an open-ended 2-hour check with no candidate host. It also sets a 2 GB storage bar that free hosts rarely meet, so the plan in practice slides to a laptop-only demo that the families can never use. | fixed | Named PythonAnywhere for the day-one trial, replaced the 2 GB requirement with an allowance based on actual available space, and kept the laptop only as a failed-hosting fallback. |

## Nits, left as they are

- Round 1, R5: The plan says 'Back up both together' and Ana tests restoring on days 12–13, but no week-one task creates the backup method.