A warm, simple cookbook for about 60 classmates and their families. Build in week one. Keep week two for testing and fixes before grading on day 14.

## People and limits

Ana knows basic Python, Ben knows HTML/CSS, and Chloe knows some JavaScript. Plan 18 hours each, leaving each person 2 spare hours: 54 planned hours out of 60. Spend nothing. Include no AI. I assume a laptop is available for development and the demonstration. No outside rules were listed; Chloe checks school requirements on day 1.

## How we build it

Use Django, a Python toolkit with account tools and an administrator page. Keep one application with folders for accounts, recipes and photos. Use SQLite, a database stored in one file, for accounts, text and photo locations. Store photos in a separate folder and back up both together to the laptop.

Members create recipes and comments. Only administrators can change or remove them. Recipes have a title, ingredients, instructions, author and zero to five photos. Show comments as plain text and keep email addresses private. Ben uses warm colours, readable text and clear labels.

Keep rule checks in small functions that can run without a database or network. Keep file and database work around them. Split files before about 400 lines.

## Ideas we need to change

- **Readable passwords:** A database leak would expose everyone's password. Use Django password hashes, one-way results that replace readable passwords, and single-use, expiring reset links. Capture test messages locally for the demo; require working email delivery before public launch.
- **Four services, Docker and Kubernetes:** Separate running programs, packaging tools and tools for managing servers add too much learning and setup for 60 hours. Use one Django application with clear folders.
- **Photos inside the database:** 2,000 photos at 5 MB need about 10 GB, twenty times the 500 MB allowance. Store resized files separately, discard originals, and publish a smaller photo allowance based on actual free disk space. Keep five photos per recipe and a 500 KB saved-file limit. Use manual disk checks instead of building automatic storage quotas.
- **Guaranteed free public hosting:** A free plan still has storage, email and running limits. Test PythonAnywhere on day 1 and aim for family access there. Use a free school server if that fails and one is available. Use the laptop demo only if neither passes; report family access as unfinished.

## Week one: build, days 1–7

**Ana — 13 hours.** Day 1: spend 1 hour on the official Django tutorial's setup, data and administrator basics. Days 1–2: spend 2 hours setting up the project and shared instructions. Create a custom user model—the account record—with unique email as the login field, and set `AUTH_USER_MODEL` before the first migration, the command that creates database tables. Record this rule in the instructions. Django requires the custom model in its app's first migration. See [Django's account guidance](https://docs.djangoproject.com/en/6.0/topics/auth/customizing/).

Days 2–4: build email signup, login, logout and reset links, including the matching account forms, 5 hours. Days 3–4: pair with Chloe for the first 2 hours of photo work; Ana leads the Python code. Days 4–7: build recipe and comment saving and administrator changes/removal, 3 hours. There are no member edit/delete pages or ownership checks to build.

**Ben — 12 hours.** Days 1–2: sketch pages and shared colours and spacing, 2 hours. Days 2–5: build account, recipe and comment pages and forms, 7 hours. Use agreed field names while Ana builds saving. Days 6–7: connect pages and add errors, phone layouts and keyboard access, 3 hours.

**Chloe — 12 hours.** Day 1: test PythonAnywhere, school requirements and free email delivery, 2 hours. Its free plan lists 512 MiB of disk, roughly 537 MB, and a one-month web-app expiry. See [the host's limits](https://help.pythonanywhere.com/pages/FreeAccountsFeatures). Check HTTPS, which protects browser traffic, and that a sample file survives an app restart. Record remaining disk after setup, renewal steps and the email result. Publish a total photo allowance after reserving room for code, the database and growth; do not require 2 GB. For example, 200 MB reserved for photos allows about 400 files at 500 KB each. This is an example, not promised capacity.

Days 3–5: build photo uploads, 7 hours, including the first 2 hours paired with Ana. Use Pillow, a Python image library: accept JPEG/PNG up to 5 MB, set `Image.MAX_IMAGE_PIXELS` to 20 million and reject its oversized-image warnings, open and verify, reopen, then use `thumbnail()` to fit within 1600 × 1600 pixels. Save a fresh JPEG without copying metadata, the hidden camera and location details. Reject saved results above 500 KB. These are standard [Pillow operations](https://pillow.readthedocs.io/en/stable/reference/Image.html). Chloe finishes the upload form and page connections using the paired helper. No automatic storage quota feature.

Days 6–7: connect photos to saved recipes and set up the chosen host or fallback, 3 hours. Chloe checks disk use during the trial and pauses uploads manually before the published allowance is exhausted.

By day 7, signup, login, a recipe with photos and a comment from another account must work together. Freeze new features then.

## Week two: testing and fixes, days 8–14

**Ana — 5 hours.** Days 8–11: test and fix accounts, resets, posting and administrator-only changes/removal, 3 hours. Days 12–13: test restart and restore the database and photos from backup, 2 hours.

**Ben — 6 hours.** Days 8–11: test and fix phone layouts, keyboard use, labels and errors, 4 hours. Days 12–14: finish the user guide and demonstration checklist, 2 hours.

**Chloe — 6 hours.** Days 8–11: test and fix invalid images, file and pixel limits, and six-photo attempts, 4 hours. Drop full-storage and interrupted-upload tests. Days 12–14: rehearse the demonstration and verify hosting, disk space and claimed email delivery, 2 hours.

Keep each person's remaining 2 hours for emergency fixes.

## How we know it is done

- **Email signup and login:** Email/password signup and login work. Duplicate emails and wrong passwords fail. Logout and anonymous access block posting and commenting.
- **Recipes with up to five photos:** Recipes show all fields and zero, one or five photos. Six photos, invalid images and files over the input, pixel or saved-size limits fail clearly without a broken recipe. Saved content survives restart.
- **Comments:** A second account's comment appears under the right recipe with its author and survives reload. Typed HTML appears as text. Members cannot edit or delete content; administrators can.
- **Safe passwords and recovery:** Only password hashes are stored. A reset link changes the password, expires and cannot be reused. The old password fails. Demo messages stay local; public recovery requires a real delivered email.
- **Delivery and backup:** The day-14 demo completes the full journey, and a backup restores accounts, recipes, comments and photos. Family access passes from another home connection with HTTPS, persistent files and real reset email. Record the photo allowance, disk checks and host renewal steps; disclose any fallback.

## What to cut first

1. Ingredient search: after grading.
2. Favourites: after grading.
3. Photo previews, animations and extra decoration.
4. Bulk loading 2,000 photos: use a small set within the published allowance.

Keep accounts, five-photo recipes, comments, safe passwords and the testing week. Use spare hours for slips and disclose unfinished work.

## Decisions

- **Application structure:** One Django application (also looked at: Four services with an API gateway, Docker and Kubernetes). Ana can build on her Python basics after a short tutorial. Four services add more setup than this team can fit into 60 hours.
- **Accounts and passwords:** Custom email user model from setup, Django hashes and reset links (also looked at: Default username model changed later, Readable passwords emailed on request). Email login must be decided before database creation. Readable passwords are unsafe.
- **Member actions:** Members create; administrators change or remove (also looked at: Members also edit and delete their own content). Editing was not requested. Removing it frees Ana's time for learning Django and pairing on photos.
- **Photo storage and processing:** SQLite records, resized photo files and manual disk checks (also looked at: Photo files with automatic storage quota checks, Original photos inside a 500 MB database, Separate hosted database and file services). The originals need about 10 GB. A small Pillow helper built with Ana and a published allowance reduce Chloe's Python work and avoid extra services.
- **Page design:** Django HTML pages with CSS and optional small JavaScript additions (also looked at: Separate JavaScript application). This fits Ben's HTML/CSS and Chloe's limited JavaScript skills.
- **Hosting:** Test PythonAnywhere first, then available free school hosting, with laptop fallback (also looked at: Require 2 GB before considering public hosting, Plan only a laptop demonstration). A smaller photo allowance makes free family access worth testing. The laptop remains a grading fallback, not a completed family-access deliverable.
