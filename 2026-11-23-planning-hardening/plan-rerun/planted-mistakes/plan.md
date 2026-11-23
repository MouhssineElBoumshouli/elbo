Build a warm cookbook for about 60 classmates and their families. Finish the full working path by day 7. Keep week 2 for testing, fixes and the graded demo.

## People and limits

Ana knows basic Python, Ben knows HTML/CSS, and Chloe knows some JavaScript. Plan 55 hours: Ana 19, Ben 18, Chloe 18. That leaves 5 spare hours within their 20-hour limits. Learning and pairing time count. Spend $0. Add no AI.

Assume everyone has a computer and internet access, and light use is enough for the demo. Public reading is an assumption: Ben must confirm it before real family content is added. Use samples meanwhile. No outside rules were supplied; Ben checks school rules about accounts and family photos.

## Build and share

Use Django, a Python toolkit with ready-made account and form tools. Keep one application. Use SQLite, which keeps the database in one file and avoids running a database server.

On day 1, before creating database tables, choose Django’s standard User account type. Store the trimmed, lower-case email in both its username and email fields. Check uniqueness and apply the same conversion at login. Explain the standard username field’s 150-character limit on the email form. Do not build a custom account type or login checker. Ask for a separate public display name so comments never expose email usernames.

Pages: recipe list, recipe details, sign-up, login, recipe form, password change and password-change confirmation. Recipes have a title, ingredients, steps and zero to five photos. Members can comment. Django’s staff page handles removals. Ben uses cream backgrounds, warm colours and readable forms that work on phones and keyboards.

Ana creates one free private Git repository: a shared code store that records changes. Everyone gets the latest code before working and shares small saved changes daily. Ana alone edits `config/`, accounts and shared recipe files. Ben owns `templates/` and `static/css/`. Chloe owns `cookbook/photos/` and `cookbook/comments/`. Ask the owner to change shared files; Chloe asks Ana for media paths and upload limits. Ana publishes only code saved in this repository. Keep passwords, secret keys, databases and uploaded photos out of it.

## Ideas to change

**Plain-text passwords are unsafe.** Anyone with the database could read them. Store Django password hashes: one-way values that check passwords without keeping readable copies. Never log or email passwords.

For recovery, Ana checks classmates through an existing class contact and family members through the classmate who invited them. She sets a random temporary password and gives it privately. The member logs in and immediately chooses a private replacement on Django’s built-in password-change page. Ana confirms completion without seeing the new password. The temporary password stops working after this change; Django does not automatically make it single-use. Automated recovery emails can wait. [Django account tools](https://docs.djangoproject.com/en/5.2/topics/auth/default/).

**Four services, Docker and Kubernetes are too much for 14 days.** Microservices are separate programs that communicate over a network. Docker packages programs; Kubernetes manages those packages. Use one Django application so this beginner team can finish the required features.

**The proposed photo storage cannot fit.** 2,000 × 5 MB is 10,000 MB, about 10 GB: twenty times the 500 MB allowance. Store reduced files outside the database and only their paths inside it.

Use Pillow, a Python image library. Accept JPEG/PNG uploads up to 5 MB, one at a time. Check the actual image and reject inputs above 20 million pixels before fully loading them. Resize to at most 1000 pixels on the longest side. Save once as JPEG at quality 70, without copying metadata such as camera or location details. Discard originals. [Pillow image options](https://pillow.readthedocs.io/en/stable/handbook/image-file-formats.html).

Fixed quality does not guarantee 100 KB. Remove the repeated shrinking loop and the 100 KB promise. Enforce five photos per recipe and at most 200 MB overall. Add actual saved file sizes rather than multiplying by an assumed size. Keep the count and size checks as small functions that take numbers and return an answer, without a database. Reject uploads that exceed the remaining allowance and remove rejected files. Do not promise space for 2,000 photos.

## Free hosting

Use PythonAnywhere’s free account: one web app, 512 MiB total disk space and a one-month app expiry. Code, packages, database and photos share that space. Ana checks remaining space on day 1 and lowers the 200 MB photo allowance if needed. [Free-account limits](https://help.pythonanywhere.com/pages/FreeAccountsFeatures/).

Check HTTPS, which encrypts browser traffic. If free hosting fails, demonstrate locally with sample data and report remote access as unfinished. Do not buy an upgrade.

## Week 1: build

- **Ana, 2 hours, days 1–2:** learn Django basics, settle the email account choice on day 1, then create the project and database.
- **Ana, 1 hour, day 1:** create the private repository, explain file ownership, publish a free hosted page and check disk space and HTTPS.
- **Ben, 2 hours, day 1:** sketch pages, confirm visibility and school rules, and choose samples.
- **Ana, 5 hours, days 2–4:** build email sign-up, login, logout, display names, staff access and assisted recovery with password-change pages.
- **Ana, 1 hour, day 2:** pair with Chloe for her first Python/Django photo hour. Agree on photo and comment connections before separate work.
- **Ana, 4 hours, days 4–6:** build recipe storage, posting, browsing and staff removal controls.
- **Ben, 7 hours, days 2–5:** build templates and styles for all pages and forms, including password change.
- **Chloe, 8 hours, days 2–6:** learn and build the simplified photo path and allowance checks. Her first hour is the pairing hour; Ana handles settings changes.
- **Chloe, 4 hours, days 6–7:** add stored comments, public author names and dates. Require login and display comments as plain text.
- **Ben, 3 hours, days 6–7:** connect forms, navigation and errors. Complete sign-up → recipe → photo → comment on the hosted site by day 7.

## Week 2: test and fix

- **Ana, 4 hours, days 8–12:** test and fix accounts, recovery, recipes, staff controls and live-site settings.
- **Ben, 4 hours, days 8–12:** test and fix phone, computer and keyboard journeys.
- **Chloe, 4 hours, days 8–12:** test and fix image limits, full storage, rejected-file cleanup and unsafe comment text.
- **Ana, 2 hours, days 13–14:** back up the database and photos, restore a test copy and verify the release.
- **Ben, 2 hours, days 13–14:** prepare and rehearse the sample-content demo.
- **Chloe, 2 hours, days 13–14:** repeat acceptance checks and record results and limits.

Use the spare 5 hours for fixes. Add no week-2 features.

## Done checks

- **Email accounts:** registration, logout and email login work. Wrong passwords and duplicate emails, including case variants, fail. Logged-out visitors cannot post.
- **Safe passwords and recovery:** only Django password hashes are stored. No passwords appear in logs or emails. A verified classmate and invited family member complete assisted recovery, privately change their temporary passwords, and cannot reuse old or temporary passwords afterward.
- **Recipes and photos:** recipes survive reloads with zero or five photos. A sixth photo, invalid file, input over 5 MB or image over 20 million pixels fails. Saved images are JPEGs within 1000 pixels, without copied metadata. Actual saved sizes stay within the allowance; rejected uploads leave no files or damage existing content.
- **Comments:** comments survive reloads with public author names and dates. Script-like text cannot run. Staff can remove comments.
- **Grading:** the full hosted journey passes over HTTPS on phone and computer. Emails stay private, the backup restores, and the demo uses the tested repository version.

## Cut first

1. Ingredient search.
2. Favourites.
3. Decorative extras and JavaScript photo previews.
4. Automated password-reset emails; keep assisted recovery.

Keep safe accounts, comments and support for five photos. If these still do not fit, report the unfinished requirement honestly.

## Decisions

- **Application structure:** One Django application (also looked at: Four microservices with Docker, Kubernetes and an API gateway). Ana knows basic Python. One application gives these beginners more time for required features within 14 days.
- **Accounts and recovery:** Standard Django User with email as username, password hashes and assisted recovery (also looked at: Custom user model or authentication backend for email login, Django password hashes with emailed reset links, Plain-text passwords with reminder emails). Deciding before database setup avoids rebuilding accounts. Built-in password-change pages let members choose private passwords without adding email delivery work.
- **Database:** SQLite (also looked at: A hosted database with a 500 MB free allowance). One database file avoids server setup and suits the assumed light school-demo use.
- **Photo storage:** One fixed resize and JPEG save, with actual-size accounting (also looked at: Repeated shrinking to a hard 100 KB limit, Fixed-quality images with count multiplied by an assumed 100 KB, Original images inside the 500 MB database, Original images in a separate cloud file service). The originals need about 10 GB. One resize is simpler for Chloe, while actual sizes enforce storage limits without pretending every JPEG has the same size.
- **Page technology:** Django templates with HTML/CSS and optional small JavaScript (also looked at: A separate JavaScript front-end application). Ben can use his existing skills while Chloe learns the Python needed for photos and comments.
- **Hosting:** PythonAnywhere free hosting, checked on day 1 (also looked at: A local-only school demonstration, Paid hosting). Free hosting gives families a link within the $0 budget. A local demo is the fallback, with remote access marked unfinished.
