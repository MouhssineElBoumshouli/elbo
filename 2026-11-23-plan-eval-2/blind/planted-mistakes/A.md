# Plan: Our Class Cookbook

Medium plan · 13 tasks · Experts: project manager, software architect, security engineer, designer. Decisions are proposals until you agree.

## Where we disagree with the brief

- **Store readable passwords and email them back.** (raised by the project manager, the software architect, the security engineer and the designer): Database or mailbox leaks expose usable passwords. Better: Store Argon2id hashes; provide identity-checked reset links.
- **Use microservices, Docker and Kubernetes.** (raised by the project manager, the software architect and the security engineer): Several deployments exceed this team's skills and time. Better: Use one Django application with clear folders.
- **Put 2,000 original 5 MB photos in a 500 MB database.** (raised by the project manager, the software architect, the security engineer and the designer): 10,000 MB is twenty times the allowance. Better: Reduce private files and measure capacity; 200 MB of reduced photos still needs proven hosting.
- **Reduce photo count while keeping advanced upload feedback.** (raised by the designer): Optional effects displace a required feature. Better: Keep five photos; defer previews and separate retries.

## Choices for you

- What hosting does grading require? (Local demonstration: easiest within 60 hours, but no shared online access; needs grading permission. / School hosting: potentially simpler, but availability needs confirming. / Public hosting: remote access, but free capacity needs proving.)
- Does 60 include families, and when are 2,000 photos expected? (Families included, photos later: manageable launch, but expansion remains. / Families additional or photos immediate: broader participation, but greater capacity risk.)
- Who approves accounts and verifies recovery through trusted contacts? (School adult: continuity, but availability needs agreement. / Named teammate: quick coordination, but uses limited hours.)
- Will children participate, and what school privacy, device or access requirements apply? (Requirements known: clearer scope, but may add work; share them. / Unknown: confirm before signup; avoids rework, but may delay launch.)
- What happens after grading? (Delete on an agreed date: less upkeep, but access ends. / Name a caretaker: continued access, but ongoing hosting and backup work.)

## 1. What we build and for whom

**In short:** A private class cookbook, ready in 14 days.

> Go deeper: Ana knows basic Python, Ben HTML/CSS, and Chloe some JavaScript. Each has 20 hours: 14 planned and six reserved for fixes. Everything must be free. No AI. Confirm school requirements before collecting accounts or photos.

## 2. Must-haves and later

**In short:** Size the first release to 60 hours

> Go deeper: Choose accounts, recipes, five photos and comments: achievable but tight. Adding search and favourites offers more features but exceeds available time. Save week 2 for checks, fixes and grading.

**Done means:**
- Email signup and login: Approved accounts log in; wrong passwords fail; pending accounts cannot read content.
- Recipe with up to five photos: Zero-to-five-photo recipes survive reload; sixth, invalid and oversized files fail cleanly.
- Comments: Comments survive reload; other members cannot change them.
- Safe replacement for readable passwords: New and reset passwords use Argon2id hashes; verified recovery works; expired and reused links fail.
- Private content: Logged-out and pending users cannot open recipes, comments or direct photo addresses.

**Decision 0004: Size the first release to 60 hours**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Small complete release** (picked) | Keeps all required activities and five-photo submission. | Leaves search, favourites and upload extras for later. | Uses 42 planned hours, including learning, with 18 hours reserved. |
| One-photo release | Reduces upload and layout work. | Misses the requested five-photo requirement. | Only an explicit team-approved scope change after optional features and polish have been cut. |
| Expanded release | Adds search, favourites and richer upload feedback. | Consumes checking time and adds storage demands. | Too large for three beginners, 14 days and a free-only budget. |

Why: A working required flow matters more than extras. Learning and all implementation work must fit inside the same 42 hours. Proposed by the project manager.

## 3. Stack and why

**In short:** Application structure

> Go deeper: Choose Django, a Python website toolkit: existing account tools help Ana, though learning takes time. Separate services allow independent updates but overwhelm 60 hours. Use ordinary pages and SQLite, a single-file database. Chloe checks hosting by day 2.

**Decision 0002: Application structure**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **One Django application** (picked) | Supplies account, form and administrator tools in one place. | Requires learning Django. | Uses Ana's Python and Ben's HTML/CSS, with 8 learning hours explicitly included. |
| One Flask application | Offers a small Python starting point. | Requires joining more account and form components. | Fits Ana's language knowledge but adds integration choices before day 14. |
| Separate services with Kubernetes | Allows separate deployment and scaling. | Requires several deployments, service connections and cluster administration. | No relevant experience is stated; it does not fit 60 total hours. |

Why: The required work is ordinary accounts, forms and pages. Existing framework tools save setup work. Proposed by the software architect.

## 4. How the parts fit together

**In short:** Private membership

> Go deeper: Choose administrator-approved signup: simple and private, but members wait. Invitations reduce waiting but add delivery work. Check membership for content and photos; check ownership before changes. Keep rules in pure functions, separate from storage. Reuse helpers; split files near 400 lines.

```
Browser: ordinary pages and forms
        | HTTPS: encrypted connection
        v
One Django application
accounts | recipes | comments | checked photo route
        |                         |
        v                         v
SQLite: records and paths    Private reduced photo files
        \                         /
         Consistent private backup
```

## 5. Data and privacy

**In short:** Photo and record storage

> Go deeper: Choose database records plus private photo files: simple, but disk space is shared. Hosted file storage adds capacity but setup work. Keep photo paths with records. Allow five JPEG/PNG photos, each ≤5 MB and ≤20 megapixels. Re-save without location details to ≤100 KB; enforce measured storage limits.

**Decision 0003: Photo and record storage**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **SQLite and reduced private files on one host** (picked) | Avoids a database server and a second storage service. | Application files and photos share limited disk space. | Preferred if Chloe proves capacity and private access within C2. |
| Database records and separate hosted photo storage | Can provide more photo capacity. | Adds service setup, permissions and transfer limits. | Consider later, or if the school provides a ready-to-use private service. |
| Original photos inside the 500 MB database | Records and files can be copied together. | About 100 original photos fill the allowance before other data. | Cannot support 2,000 originals on the stated budget. |

Why: One storage location is easier to operate. The day-2 measurement sets the real capacity. Proposed by the software architect.

## 6. Security risks and what we do about them

**In short:** Password protection

> Go deeper: Choose Django with Argon2id hashes, one-way password checks: supports email login but needs setup. School login reduces password work, but family access is unknown. Require HTTPS encrypted connections, login-attempt limits and form protections. Hide emails, protect photo access, show comments as text and keep secrets outside shared code.

**Decision 0001: Password protection**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Django login with Argon2** (picked) | Meets email/password login without inventing password handling. | Needs an added dependency, configuration and attempt limits. | Included in Ana's A2 and Chloe's C4. |
| School-managed login | The school handles password protection and recovery. | Availability and access for families are unknown. | Only useful if an existing school service supports everyone and the login requirement can change. |

Why: It meets the brief and uses established tools. Explicit configuration avoids assuming the default is Argon2. Proposed by the security engineer.

**Decision 0005: Private membership**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Administrator-approved signup** (picked) | Uses existing account activation controls and avoids invitation-token code. | Members wait for approval and someone must verify them. | The smallest private membership process for this 60-hour project. |
| Single-use email invitations | Allows approved recipients to join directly. | Needs token creation, expiry, delivery, reuse checks and extra screens. | Too much additional implementation for the 42-hour work allowance. |
| Public browsing and open signup | Makes joining immediate. | Exposes family photos and increases unwanted posts. | Adds ongoing moderation work without a named operator. |

Why: It keeps recipes and photos private using existing administrator tools. No invitation links means no missing, expired or used invitation states to implement. Proposed by the security engineer.

**Decision 0006: Forgotten-password recovery**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Administrator-assisted reset-link delivery** (picked) | Works without a new email service and still lets the member choose the password. | Requires a trusted identity check and an available administrator. | Selected for day one; implementation is in A2, wording in B3 and checks in C4. |
| Automatic reset email | Members recover access without waiting for an administrator. | Needs a permitted free sender, delivery checks and request limits. | A later option if the school provides a working sender and time permits. |

Why: Free email delivery is unproven. Name an administrator and test identity checks and link delivery before inviting real users. Proposed by the security engineer.

## 7. The look and the main screens

**In short:** Warm cream pages, dark text and terracotta buttons.

> Go deeper: Choose one grouped recipe form: easier for Ben, but more scrolling. Staged forms shorten screens but add work. Choose photos submitted together: less code, but failures require reselection. Separate uploads improve retries but exceed Chloe's time. Cover lists, recipes, posting, accounts and recovery. Preserve text after errors; support phones and keyboards.

## 8. Who does what, and in what order

**In short:** Forgotten-password recovery

| Area | Folders | Owner |
| --- | --- | --- |
| Application | `accounts/`, `recipes/` | Ana |
| Pages | `templates/`, `static/` | Ben |
| Delivery | `config/`, `tests/`, `docs/` | Chloe |

| Week | Tasks |
| --- | --- |
| 1 | T1 Learn Django and image handling — 4h (Ana · Application) · T2 Learn templates; agree fields and sketch screens — 4h (Ben · Pages) · T3 Learn setup; prove free hosting, HTTPS and storage — 5h (Chloe · Delivery) · T6 Build accounts, approval, recovery and attempt limits — 4h (Ana · Application) · T7 Build forms, pages and styles — 6h (Ben · Pages) · T8 Build recipes, comments, access checks and private photos — 6h (Ana · Application) · T10 Check complete journeys; demonstrate day 7 — 3h (Chloe · Delivery) |
| 2 | T11 Check phones, keyboards and errors; fix pages — 4h (Ben · Pages) · T12 Check security, recovery and upload failures — 4h (Chloe · Delivery) · T13 Rehearse restoration and grading — 2h (Chloe · Delivery) · T14 Application fixes reserve — 6h (Ana · Application) · T15 Page fixes reserve — 6h (Ben · Pages) · T16 Delivery fixes and rechecks reserve — 6h (Chloe · Delivery) |

| When | Working by then | Cut first if it slips |
| --- | --- | --- |
| Days 1–2 | Agree fields; prove hosting, private storage and capacity. | Extra hosting services; use permitted local fallback. |
| Days 3–5 | Login by day 3; five-photo posting by day 5. | Optional upload effects. |
| Day 7 | Signup, approval, posting and commenting work together. | Visual polish. |
| Days 8–14 | Complete checks, fixes, backup restoration and grading rehearsal. | Presentation decoration; preserve required behavior. |

## 9. Risks

**In short:** Prove hosting early; finish the complete journey by day 7.

| Risk | Chance | Impact | What we do | Who watches |
| --- | --- | --- | --- | --- |
| Ana's work exceeds estimates. | high | high | Check days 3 and 5; use reserve; cut polish. | Ana |
| Free hosting lacks safe storage or capacity. | high | high | Measure day 2; enforce limits; retain permitted local fallback. | Chloe |
| Access or recovery exposes another account. | medium | high | Test account states, direct photo access and failed identity checks. | Chloe |

## 10. Smaller choices

- **How people enter a recipe:** One grouped form (also looked at: Step-by-step form). Clear groups keep the form understandable without extra browser state.
- **Photo submission and feedback:** One submission with a waiting message (also looked at: Independent photo uploads). It preserves the required photo count while keeping implementation and failure states small.

## 11. Words used

- **Pure function:** Returns an answer from inputs without accessing files or services.
- **Template:** A reusable page filled with saved information.
- **JPEG/PNG; megapixel; KB/MB:** Photo formats; one million picture dots; size units, roughly 1,000 KB per MB.
