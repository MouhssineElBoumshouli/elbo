# Plan: Campus Room Reports

Medium plan · 18 tasks · Panel: project manager, software architect, security engineer, designer. Decisions are proposals until you agree.

## The panel pushes back on the brief

- **Show which rooms are free right now.** (the project manager): The PDF contains no booking or occupancy data. A room with no check-ins may still be occupied, closed or reserved. Better: Show active check-in counts and “No recent reports.” Explain that availability is unverified and never imply that a check-in reserves a room.
- **Show which rooms are free right now using free/busy status.** (the software architect): There is no booking feed, capacity data, or complete attendance. Zero reports does not mean empty; several reports do not mean full. Better: Show active check-ins, freshness, and unknown availability. Pitch shared student reports, with availability verification as future work.
- **Show which rooms are free right now using free/busy status.** (the security engineer): The PDF contains names and buildings, not live occupancy or capacity. Voluntary reports can be absent, stale, or false. Better: Show active check-in totals with automatic expiry. Label zero reports as unknown availability and explain the limitation during the pitch.
- **Show which rooms are free right now and filling up.** (the designer): No check-ins does not mean empty. Check-in counts do not reveal remaining seats, bookings or people who never checked in. Better: Show reported check-in counts with update times and explicit uncertainty. Present this as a student reporting tool, with demo activity clearly labelled.

## Choices for you

- The manager’s detailed allocation was not supplied. How should the 24 architecture hours be reconciled with the existing 36-hour plan? (Map these tasks into the manager’s existing buckets, retaining the 2-hour deployment cap and named owners. / Adopt the provisional 36-hour envelope of Noor 10, Tom 12, and Ilias 14, then map the remaining panel work into it.), raised by the project manager

## 1. What we build and for whom

**In short:** Help students find rooms using recent student reports. Show active check-in counts and “Availability unknown”: the PDF cannot prove rooms are free, busy or full.

> Go deeper: The app cannot know which rooms are actually free: the university PDF supplies locations, not bookings or occupancy. Show “No recent reports” or “3 active check-ins,” with a clear explanation that reports do not guarantee availability. Students can check in and check out. Old check-ins expire so forgotten departures do not remain forever.
> Noor owns design, room-list checking and the pitch. Tom owns the React interface. Ilias owns the Flask service and shared check-in records. Build everything during the hackathon, use no paid services and include no AI.
> Success at hour 24: judges see two phones open the same room list, one check in, the other refresh to see the count change, then check out.

**Decision 0001: Describe reported activity honestly**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Active check-in counts** (picked) | Shows exactly what students have reported. | Cannot establish whether a room is free. | Works with the PDF and the team's limited build time. |
| Free/busy labels from check-ins | Very quick to understand. | Zero reports can falsely suggest an occupied or booked room is free. | The team lacks the evidence needed to support these labels. |

Why: Missing reports are not evidence of an empty room. Honest counts still demonstrate shared student reporting and give Noor a credible explanation of the project's limits. Proposed by the project manager.

> Disagreement: Replace the brief's promised free/busy status with reported activity. Do not claim verified availability.

## 2. Must-haves and later

**In short:** Build a building-grouped list, check-in, checkout, renewal and automatic expiry for a small verified room selection. Defer maps, notifications, university login and noise reports. Create all project work during the event; use free tools and no AI.

> Go deeper: Start with a small, verified selection of rooms from the PDF. Include building names, empty and error states, automatic expiry, and a refresh control. Defer the map, notifications, university login and noise reports: none is needed to demonstrate the main benefit.
> Hours 0–2: agree labels, room data and the messages exchanged by the interface and service. Noor designs; Tom and Ilias build their separate areas using the agreed examples.
> By hour 12: show a phone-sized list, check in, refresh a second browser and check out using shared records.
> Hours 12–18: finish expiry, errors and connection setup. Freeze features at hour 18. Hours 18–22: test phones and fix failures. Hours 22–24: rehearse and prepare the demo.
> Planned loads: Noor 11/16 hours; Tom 12.5/18; Ilias 12.5/18. The remaining 16 hours are contingency, not extra features.

**Decision 0002: Use a list for the first release**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Room list grouped by building** (picked) | Easy to scan on phones and build from the PDF. | Does not provide directions. | Fits Tom's React skills and leaves time for shared check-ins and testing. |
| Campus map | Helps students understand locations. | Needs reliable coordinates and additional interface work. | Coordinates are not supplied; this adds uncertainty within 24 hours. |

Why: The list satisfies the brief and uses the data already available. Put the map after the hackathon. Proposed by the project manager.

**Decision 0003: Protect time for a reliable demonstration**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Core flow with contingency** (picked) | Leaves time for fixes, phone testing and pitch rehearsal. | Has fewer visible features. | Uses 36 of 52 person-hours and supports all three judging criteria. |
| Add a stretch feature before the pitch | Could add presentation appeal. | Consumes the time needed to make the core demonstration dependable. | Too risky with only 24 elapsed hours and three part-time allocations. |

Why: Reserve 16 hours, or 30.8% of available effort. Freeze features six hours before the pitch and use any spare time to improve clarity and reliability. Proposed by the project manager.

## 3. Stack and why

**In short:** Tom builds the interface in React; Ilias builds the service in Flask, serving both from one address. Use PostgreSQL for shared records, subject to an early setup check. Cap online deployment work at 2 person-hours; keep a laptop demonstration available.

> Go deeper: Tom knows React; Ilias knows Flask. PostgreSQL stores records across server restarts; their experience with it is unknown. Budget 2 person-hours for deployment, 1 for database learning within backend work, and 1.5 for local fallback setup and verification. Use the same PostgreSQL implementation locally and online. Flask serves the built React page and data routes. Render’s free database has 1 GB storage, expires after 30 days, and lacks managed backups. Its free web service sleeps after 15 idle minutes and takes about a minute to wake. [Free-plan limits](https://render.com/docs/free). Prove hosted reads and writes by hour 4. Build all code, assets, and demo material during the event.

**Decision 0004: Application structure**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **React served by Flask** (picked) | Uses both developers’ skills; one public address and deployment. | Requires a small frontend build step. | Fits Tom’s React experience and Ilias’s Flask experience. |
| Flask templates with plain JavaScript | Fewer build tools. | Loses the benefit of Tom’s React experience. | Possible, but offers little deadline benefit. |

Why: Use one repository with small frontend and backend folders. Drop microservices, Kubernetes, separate frontend hosting, and additional database implementations. Proposed by the software architect.

**Decision 0005: Hosting and persistent storage**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Render with PostgreSQL; local PostgreSQL fallback** (picked) | Public HTTPS phone access and one storage implementation. | Hosting can sleep; local PostgreSQL needs setup. | Primary choice, with deployment, learning, and fallback time explicitly budgeted. |
| Laptop-only Flask and PostgreSQL | Free offline demo using the same application and database code. | Demonstrates two laptop browsers rather than shared campus phone access. | Fallback if hosting cannot be proved within its allowance. |

Why: Use HTTPS for the two-phone milestone. Rehearse offline with two separate laptop browser profiles and localhost-only settings. Remove the proposed SQLite implementation. Hosted local files are temporary, so PostgreSQL remains the hosted store. [Storage limits](https://render.com/docs/free). Proposed by the software architect.

## 4. How the parts fit together

**In short:** Noor owns design, room content and presentation; Tom owns the interface and integration checks; Ilias owns rules, storage and operation. Keep rules in small pure functions, with storage, network and clock access outside them. Keep files around 400 lines or less and reuse shared rules.

> Go deeper: React requests counts every 15 seconds while visible and immediately after a write. Flask validates requests and commits each change as one transaction: all changes succeed together or none does. One browser has one active check-in; switching rooms replaces it. Repeated requests must not add extra check-ins. Expire reports after 60 minutes, with explicit renewal. Pure functions handle expiry and labels, with server time passed as input. Thin outer layers handle network calls, storage, and the clock. Keep files below about 400 lines and reuse rules. Show connection failures and stale data. Target the shared two-phone flow at hour 12 and freeze features at hour 18. Cut optional polish if either checkpoint slips. Protect hours 18–24 for testing, blocking fixes, and rehearsal.

```
Phones: React building list
  | HTTPS: GET counts; PUT/DELETE own check-in
  v
Flask: origin checks + browser authorization
  | pure validation and expiry rules
  v
PostgreSQL: rooms + current check-ins
  | aggregate counts
  +-> phones

Offline fallback: two laptop browsers -> localhost Flask -> local PostgreSQL
```

**Decision 0006: Room presentation and status meaning**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Building list with active check-ins** (picked) | Works with the PDF and scans quickly on phones. | Cannot guarantee available seats. | Fits Noor’s design work without collecting coordinates. |
| Map with active check-ins | Helps locate unfamiliar buildings. | Needs location data and extra interface work. | Too much work for this deadline. |

Why: Use “No active reports — availability unknown” and “3 active check-ins” consistently in responses, screens, and pitch examples. Neither zero nor positive counts establish free/full status. Proposed by the software architect.

> Disagreement: The brief’s free/busy promise exceeds the available evidence. Use reported use and unknown availability in the pitch.

**Decision 0007: Updating other phones**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Poll every 15 seconds** (picked) | Simple requests and failure handling. | Other phones can lag by 15 seconds. | Small implementation cost within 24 hours. |
| Persistent live connection | Pushes changes immediately. | Adds connection recovery and server coordination. | Little judging benefit compared with finishing and rehearsing. |

Why: Refresh the acting phone immediately. Stop polling hidden tabs and slow retries after failures. Proposed by the software architect.

## 5. Data and privacy

**In short:** Store verified room names and buildings, plus each anonymous browser’s current room and expiry. Allow one active check-in per browser; switching replaces it, and reports expire after 60 minutes unless explicitly renewed. Publish counts only; delete expired records on requests and clear remaining records after the event.

> Go deeper: Transcribe a verified PDF subset into a seed file and label coverage. Rooms contain id, name, and building. Check-ins contain a unique browser-token hash, room id, and expiry. Ilias sets random secret cookies with Secure, HttpOnly, and SameSite=Strict: encrypted connections only, hidden from page scripts, and restricted across sites. For every write, require an Origin header matching the configured app address; reject missing, null, or other origins. GET requests never change attendance. The offline fallback uses two separate browser profiles on the presenting laptop, local PostgreSQL, and Flask bound only to 127.0.0.1. Only explicit local development mode may disable Secure; retain HttpOnly, SameSite, and origin checks. Production must reject relaxed settings. Exclude expired reports immediately and clean them during requests. Delete check-ins after the event. Keep no visit history or analytics. Version the room seed; do not back up attendance. After data loss, show unknown and request fresh reports. Keep …

**Decision 0008: Check-in identity**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Random browser token** (picked) | No login integration or student identity collection. | One person can create reports through several browsers. | Enough for a clearly labelled crowd-reporting prototype. |
| University account login | Could limit reports per account. | Needs university integration details and potentially approval. | Deferred beyond the hackathon. |

Why: Allow one active check-in per token, verify ownership, and rate-limit writes. Combine explicit SameSite cookies with server origin checks. Counts represent active check-ins, not verified unique students. Proposed by the software architect.

**Decision 0009: Handling forgotten checkout**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Expire after 60 minutes with manual renewal** (picked) | Bounds stale reports without background jobs or location tracking. | Long sessions need renewal; forgotten exits remain temporarily. | Small, testable prototype rule. |
| Keep check-ins until checkout | Simplest interaction. | Abandoned reports accumulate. | Undermines the entry’s usefulness. |

Why: Treat 60 minutes as a prototype setting, not a measured campus norm. Show expiry and renewal; an open page never renews presence. Proposed by the software architect.

## 6. Security risks and what we do about them

**In short:** Use protected browser cookies, encrypted web traffic, server-side ownership checks and limits on repeated requests. Reject changes from other websites; keep secrets and identifying tokens out of logs. Collect no names, location tracking or visit history; anonymous reports cannot verify physical presence.

> Go deeper: The 7 security hours are included work inside implementation, deployment, testing, and pitch tasks—not extra hours. Ilias owns 6.25 hours, Tom 0.5, and Noor 0.25. Their total availability remains 18/18/16 hours. Of the team’s 52 hours, reserve 15.6 hours (30%) for problems, leaving 36.4 planned hours: 7 for security and 29.4 for other work. The manager’s task list was not supplied, so exact task matching still needs checking. Give each browser a random, short-lived session. The server allows one active room per session and checkout of only its own entry. Expire check-ins after 60 minutes; offer explicit renewal. Publish room totals only, without names or visit history. Zero reports means “availability unknown.” Keep secrets on the server, require HTTPS (encrypted web traffic), validate requests, and limit repeated writes. Use no analytics, location tracking, or public administration screen. Build and test everything during the hackathon with free tools. Keep a clearly …

**Decision 0010: Identity for check-ins**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Anonymous browser session** (picked) | No passwords, email collection, or account setup. | New browsers can create extra identities; presence cannot be verified. | Fits the deadline and existing React/Flask skills. |
| University login | Could restrict participation to campus accounts. | Needs university access and setup that are not provided; still cannot prove presence. | Defer as the brief allows. |
| Email sign-in link | Avoids storing passwords. | Adds email delivery, personal data, and link security work. | Too much setup for this free, 24-hour entry. |

Why: Keep the demo easy to join. Authorize writes using the server-issued session, never a user identifier supplied in the request. Accept and explain that anonymous participation cannot prevent all false reports. Proposed by the security engineer.

**Decision 0011: Public room status**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Reported check-in totals** (picked) | Useful signals without exposing individual identities. | Counts are incomplete and may be false; small counts can reveal presence indirectly. | Works with the PDF and voluntary check-ins. |
| Free/busy labels | Very quick to understand. | Suggests verified availability despite missing occupancy and capacity data. | Cannot support the promise made by the brief. |

Why: Show “3 active check-ins” or “No active reports — availability unknown.” Explain that reports expire and do not reserve seats. The three-minute pitch should state this limitation. Proposed by the security engineer.

> Disagreement: The requested free/busy status is not supported by a room-name PDF and voluntary reports.

**Decision 0012: Check-in lifetime**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Expire after 60 minutes** (picked) | Limits stale counts and makes stored entries eligible for cleanup. | Students staying longer must renew; deletion waits for a request or manual cleanup. | Small implementation with visible expiry text. |
| Keep until checkout | No renewal interruption. | Forgotten checkouts persist and mislead others. | Too unreliable for the main demo claim. |

Why: Use server time and explicit renewal. Exclude expired entries from every count immediately. Delete expired records on the next request; sleeping hosting can delay deletion indefinitely. Ilias clears stored check-ins and sessions after the event. Proposed by the security engineer.

## 7. The look and the main screens

**In short:** Noor designs a friendly phone list, room detail and current check-in view using shared layouts. Use readable text, large controls, visible keyboard focus and words alongside colours. Show update time, renewal and expiry; failed updates must never appear as zero reports.

> Go deeper: Room list: group rooms by building. Each card shows its name, reported check-ins and update time. Room detail: explain that reports do not prove availability and offer “I’m here.” Your check-in: reuse the detail layout, show “Expires at [time]” and offer “Renew for 60 minutes” and “Check out.” After expiry, show “Your check-in expired” and offer “I’m here” to check in again. Confirm changes only after the server accepts them. Use large text, dark text on pale backgrounds, generous spacing and one bright accent. Pair every status colour with words. Keep controls large, labelled and keyboard accessible, with visible focus. Noor owns 6 hours of design and presentation; Tom owns 6 hours of interface work, including renewal and expiry states. Ilias supplies activity and error states through backend work. Count these 12 hours inside the manager’s 36-hour plan, leaving 24 hours for other work and 16 hours outside that plan. …

```
Room list → Room detail → Your check-in
                            ├─ Renew → new 60-minute expiry
                            ├─ Check out → Room detail
                            └─ Expired → “I’m here” → Your check-in
```

**Decision 0013: Finding a room**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Building-grouped list** (picked) | Fast to scan and easy to build from the PDF. | Does not show walking routes. | Uses the available room names and buildings without extra data or paid tools. |
| Campus map | Shows rooms in relation to the student's location. | Needs reliable locations and more interface work. | Too much uncertainty for the 24-hour deadline and 52 working hours. |

Why: The list delivers the main task with the data already available. It leaves time for a reliable demo and readable phone screens. Proposed by the designer.

**Decision 0014: Describing room availability**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Reported activity** (picked) | Clearly separates student reports from verified availability. | Cannot promise a free seat. | Works with voluntary check-ins and the PDF. |
| Free or busy labels | Very quick to understand. | Suggests certainty that the app cannot support. | Unsuitable without booking, occupancy or capacity data. |

Why: Show “3 active check-ins” or “No active check-ins — availability unknown.” Include when data was last updated. Avoid “full,” occupancy percentages and green “free” badges. Proposed by the designer.

> Disagreement: The brief asks for free/busy status, but check-ins cannot establish it. The pitch should describe finding rooms using recent student reports.

**Decision 0015: Where check-in happens**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Room detail and confirmation** (picked) | Makes the selected room clear and keeps checkout easy to find. | Adds one tap compared with checking in from the list. | Three small screens can reuse the same room card and detail layout. |
| Check-in buttons on every list card | Offers the shortest possible action. | Crowds phone screens and makes wrong-room taps easier. | Saves a tap but adds avoidable confusion during the live demo. |

Why: Tap a room, then tap “I’m here.” Show confirmation only after the server accepts it. Keep a “Your check-in” link visible for quick checkout. Include explicit renewal and expiry in this same layout. Proposed by the designer.

## 8. Who does what, and in what order

**In short:** The supplied manager breakdown supports 36 planned person-hours: Noor 11/16, Tom 12.5/18 and Ilias 12.5/18, leaving 16 hours of buffer (30.8%). Expert estimates overlap these tasks; they are not additional hours. Show shared reports at hour 12, freeze features at hour 18, and protect the final block for rehearsal and fixes.

| Area | Folders | Owner |
| --- | --- | --- |
| Design | `design/` | Noor |
| Room content | `data/rooms/` | Noor |
| Presentation | `demo/` | Noor |
| Interface | `client/` | Tom |
| Integration checks | `tests/integration/` | Tom |
| Service and rules | `server/`, `tests/unit/`, `docs/contracts/` | Ilias |
| Operation | `scripts/`, `docs/operation/` | Ilias |

| Block | Tasks |
| --- | --- |
| 1 | T1 Hours 0-4: Agree request examples, ownership, activity labels and expiry rules with Tom and Noor; document the shared contract (1 hour) (Ilias · Service and rules) · T2 Hours 0-4: Sketch three phone views and agree honest status wording; check event rules on libraries and supplied materials (2 hours) (Noor · Design) · T3 Hours 0-4: Set up React and build against the agreed example messages (2 hours) (Tom · Interface) · T4 Hours 0-4: Set up the repository and prove one hosted PostgreSQL read and write; check free allowances, encrypted access and secret settings; stop at the deployment cap (2 hours) (Ilias · Operation) |
| 2 | T5 Hours 4-8: Verify permission and transcribe a small PDF room selection; label its limited coverage (2 hours) (Noor · Room content) · T6 Hours 4-8: Define shared controls and loading, empty, failure, renewal and expired states (2 hours) (Noor · Design) · T7 Hours 4-8: Build the phone list and reusable room detail layout with readable styling and keyboard focus (3 hours) (Tom · Interface) · T8 Hours 4-8: Learn PostgreSQL within a 1-hour cap; implement pure validation, expiry and repeat-safe rules with focused tests using supplied time values (4 hours total) (Ilias · Service and rules) |
| 3 | T9 Hours 8-12: Add protected browser identity, room totals, ownership checks, safe room switching, renewal, checkout, request limits and expired-record cleanup (4 hours) (Ilias · Service and rules) · T10 Hours 8-12: Add check-in, checkout, renewal, privacy text, expiry and refresh controls; connect completed service routes and show the shared two-browser flow by hour 12 (3 hours) (Tom · Interface) · T11 Hours 8-12: Draft the three-minute pitch around student impact, honest limitations and the live demonstration (2 hours) (Noor · Presentation) |
| 4 | T12 Hours 12-18: Finish 15-second visible-page updates, slower retries after failures and stale-data messages; verify two sessions, repeated writes, ownership, rejected cross-site changes and saved records (2.5 hours) (Tom · Integration checks) · T13 Hours 12-18: Test invalid inputs, ownership, forged requests, simultaneous duplicate writes and expiry; fix service failures (1 hour, following rule tests in T8) (Ilias · Service and rules) · T14 Hours 12-18: Document startup and rehearse local PostgreSQL with two separate laptop browser profiles; bind the fallback to the laptop only (1.25 hours) (Ilias · Operation) |
| 5 | T15 Hours 18-22: Test phone and keyboard flows, renewal, expiry and connection failures; fix blocking interface and clarity problems (2 hours) (Tom · Integration checks) · T16 Hours 18-22: Check projected readability and record a working backup demo, clearly labelled as recorded activity (1 hour) (Noor · Presentation) |
| 6 | T17 Hours 22-24: Rehearse the timed pitch and both demo paths, prepare the presentation and deliver at hour 24; use buffer only for blocking fixes (2 hours) (Noor · Presentation) · T18 Hours 22-24: Keep the cleanup checklist ready; immediately after the pitch clear check-ins and sessions and stop public operation (0.25 hour reserved for post-event cleanup) (Ilias · Operation) |

Halfway demo: At hour 12, show a phone-sized room list, check in from one browser, refresh another to see the shared count, then check out; use two phones if hosting works.

## 9. Risks

**In short:** Main threats are misleading availability claims, setup delays, false reports and demo connectivity. Questions remain about PDF permission, event rules, hosting access, database experience, campus rules and presentation equipment. Resolve these early; use a clearly labelled local demonstration if public operation cannot be established.

| Risk | Chance | Impact | What we do | Who watches |
| --- | --- | --- | --- | --- |
| Reports are mistaken for verified availability or reservations. | high | high | Use “active check-ins” and “availability unknown” throughout. Explain that counts do not establish remaining seats or reserve rooms; have a peer explain the labels back to Noor. | Noor |
| The open allocation discussion causes expert estimates to be added twice. | medium | high | The detailed manager breakdown is present in this brief, so use its 36-hour total as the working baseline. Open options: mapping expert work into these buckets preserves named owners and the 2-hour deployment cap, but requires combining overlapping work; adopting Noor 10, Tom 12 and Ilias 14 shifts effort toward the service, but leaves Ilias less than a 30% personal buffer and requires a new mapping. Do not schedule that alternative as extra work. | Noor |
| Database setup and security work exceed Ilias’s 12.5 planned hours. | high | high | Ask about PostgreSQL experience and laptop support at the start. All security and architecture work is included, not additive. Stop online setup after 2 hours; protect ownership and expiry checks, cut polish, and use the reserved buffer only for necessary fixes. | Ilias |
| Hosting or venue connectivity prevents the live demonstration. | medium | high | Confirm a free hosting account, current allowances, venue internet and display access. Online hosting supports two phones but brings setup and connection risk; laptop operation avoids venue internet but demonstrates two browser profiles instead. Verify the chosen path early, rehearse the laptop fallback and retain Noor’s labelled recording. | Ilias |
| The interface and service do not work together by hour 12. | medium | high | Agree example messages in T1 and connect routes as Ilias completes them during hours 8-12. At hour 12 require the shared check-in and checkout flow. Freeze features at hour 18 and drop visual polish if the checkpoint slips. | Tom |
| False, repeated or forgotten reports distort counts. | high | medium | Allow one active room per browser, make retries safe, switch rooms in one database transaction and expire reports after 60 minutes. Limit repeated writes and explain that several browsers can still represent one person. | Ilias |
| Forged requests or exposed records reveal or alter attendance. | medium | high | Use hashed random tokens in storage and protected cookies. Require an exact matching website origin for changes, derive ownership on the server and disable public debug output. Test two independent sessions, avoid token logs and clear records after the pitch; allow relaxed encryption settings only in explicit laptop-only mode. | Ilias |
| Unconfirmed event or campus rules prevent the planned use. | medium | high | Questions: Are standard libraries and the supplied PDF allowed? May room names be republished? Which country and campus rules apply to presence reports? Is the entry intended for public use or judges only? Resolve before publication; use clearly labelled fictional rooms and a local demonstration if permission remains unknown. | Noor |
| Old data looks current or the demo is unreadable. | medium | medium | Show the last successful update and a warning after failures; never substitute zero. Test phone text, keyboard controls and the presentation display. Confirm server acceptance before showing a successful check-in. | Tom |

## 10. Decisions log

| # | Decision | Options looked at | Decided by |
| --- | --- | --- | --- |
| 0001 | Describe reported activity honestly: Active check-in counts | Active check-in counts, Free/busy labels from check-ins | project manager, proposed |
| 0002 | Use a list for the first release: Room list grouped by building | Room list grouped by building, Campus map | project manager, proposed |
| 0003 | Protect time for a reliable demonstration: Core flow with contingency | Core flow with contingency, Add a stretch feature before the pitch | project manager, proposed |
| 0004 | Application structure: React served by Flask | React served by Flask, Flask templates with plain JavaScript | software architect, proposed |
| 0005 | Hosting and persistent storage: Render with PostgreSQL; local PostgreSQL fallback | Render with PostgreSQL; local PostgreSQL fallback, Laptop-only Flask and PostgreSQL | software architect, proposed |
| 0006 | Room presentation and status meaning: Building list with active check-ins | Building list with active check-ins, Map with active check-ins | software architect, proposed |
| 0007 | Updating other phones: Poll every 15 seconds | Poll every 15 seconds, Persistent live connection | software architect, proposed |
| 0008 | Check-in identity: Random browser token | Random browser token, University account login | software architect, proposed |
| 0009 | Handling forgotten checkout: Expire after 60 minutes with manual renewal | Expire after 60 minutes with manual renewal, Keep check-ins until checkout | software architect, proposed |
| 0010 | Identity for check-ins: Anonymous browser session | Anonymous browser session, University login, Email sign-in link | security engineer, proposed |
| 0011 | Public room status: Reported check-in totals | Reported check-in totals, Free/busy labels | security engineer, proposed |
| 0012 | Check-in lifetime: Expire after 60 minutes | Expire after 60 minutes, Keep until checkout | security engineer, proposed |
| 0013 | Finding a room: Building-grouped list | Building-grouped list, Campus map | designer, proposed |
| 0014 | Describing room availability: Reported activity | Reported activity, Free or busy labels | designer, proposed |
| 0015 | Where check-in happens: Room detail and confirmation | Room detail and confirmation, Check-in buttons on every list card | designer, proposed |

## 11. Words used

- **Person-hour:** One hour of work by one person; several people can work during the same elapsed hour.
- **Buffer:** Time reserved for delays and necessary fixes rather than planned features.
- **React:** A JavaScript library Tom can use to build the browser interface.
- **Flask:** A Python framework Ilias can use to serve the app and handle requests.
- **PostgreSQL:** A database that stores shared room and check-in records.
- **Deployment:** Setting up the application so it runs on its demonstration or public server.
- **Repository:** The shared project folder with a recorded history of file changes.
- **Pure function:** A function that calculates a result from supplied inputs without reading or changing outside systems.
- **Contract:** The agreed format and meaning of messages between the interface and service.
- **Route:** A service address that handles a particular request, such as checking out.
- **Integration check:** A check that separately built parts work correctly together.
- **Cookie:** A small value the browser stores and sends back to the app to identify its session.
- **Session:** A temporary browser identity that lets the service recognise and protect that browser’s check-in.
- **Hashed token:** A one-way representation of a random secret, stored instead of the secret itself.
- **Origin:** The website address a browser request comes from, checked before accepting a change.
- **Encrypted web traffic:** A protected connection that prevents others on the network from reading the app’s messages.
- **Transaction:** A group of database changes that all succeed together or leave the records unchanged.
- **Repeat-safe:** Repeating the same request does not create additional check-ins.
- **Browser profile:** A separate browser workspace with its own cookies, allowing the demo to represent another user.
- **Keyboard focus:** The visible indication of which control will respond to keyboard input.
- **Stale data:** Previously received information that may no longer match the current shared records.
- **Feature freeze:** The point when new features stop so the team can test, fix and rehearse.
- **Debug output:** Detailed development information that can expose internal settings if shown publicly.
