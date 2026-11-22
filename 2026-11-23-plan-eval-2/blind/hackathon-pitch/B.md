# Plan: Study Spot

Medium plan · 10 tasks · Experts: project manager, software architect, pitch and demo coach, designer. Decisions are proposals until you agree.

## Where we disagree with the brief

- **Show rooms as free, busy or filling up.** (raised by the project manager, the software architect, the pitch and demo coach and the designer): Voluntary reports cannot establish occupancy, capacity or bookings. Better: Show reported counts, refresh time and explicitly unknown availability.

## Choices for you

- Will the PDF be available, and may its room information be published? (Available and publishable: verify a sample; copying costs time but fits Noor’s hours. / Unavailable or restricted: label fictional rooms; preserves the demo but leaves campus usefulness unproven.)
- What presentation equipment, internet and fallback permissions does the event provide? (Own laptop, reliable internet: enables phones; needs projector testing. / Own laptop, permitted offline demo: enables live laptop changes; loses the two-phone demo. / Restricted or unclear setup: confirm with organisers immediately; resolving uncertainty may require setup changes.)

## 1. What we build and for whom

**In short:** Help students find study space using recent reports.

> Go deeper: Show a labelled PDF sample with room names, buildings and check-in counts. Zero means “No recent check-ins — availability unknown”. Reports cannot prove free seats, bookings or fullness. Noor explains this during the pitch.

**Decision 0001: What room status can we honestly show?**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Recent student reports** (picked) | Uses check-ins and makes missing information visible. | Cannot confirm that a room is empty or full. | Uses data the team can collect within 24 hours. |
| Verified free/busy status | Would directly answer whether space is available. | Requires reliable occupancy or booking information. | The team does not have the required data. |

Why: Counts and clear limits give students useful evidence without promising a free seat. Proposed by the project manager.

> Disagreement: The requested free/busy status cannot be established from the PDF and voluntary check-ins.

## 2. Must-haves and later

**In short:** Build a room list, check-in, checkout and three-minute live demo.

> Go deeper: Group rooms by building on one page. Visits expire after 60 minutes unless renewed. Defer maps, notifications, university login and noise reports. Use free tools. Build all code and presentation assets during the 24 hours. No AI.

**Done means:**
- Room list and status: Verified sample shows buildings, reported counts, unknown availability, refresh time and honest loading/stale states.
- Check-in and checkout: Two sessions see changes; switching, renewal, expiry and repeated retries preserve one visit without duplicate effects.
- Three-minute live pitch at hour 24: Noor completes a timed live check-in/checkout demo; localhost works and a labelled recording is saved before hour 23.

**Decision 0002: List or map for day one?**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Room list** (picked) | Quick to build and scan on a phone. | Does not show walking directions. | Uses the PDF and preserves Tom’s implementation time. |
| Campus map | Helps students locate unfamiliar buildings. | Needs verified locations and extra interaction work. | Too uncertain for Tom’s 18 hours. |

Why: Building names already exist in the PDF. Reliable check-ins matter more for this demo. Proposed by the project manager.

## 3. Stack and why

**In short:** Use Tom’s React skills and Ilias’s Flask skills.

> Go deeper: React builds the page; Flask handles requests; SQLite stores data in one file. Serve one site. Ilias spends at most two hours checking free hosting, encrypted connections and storage survival after restarts. Deploy by hour 6; keep a working laptop copy.

**Decision 0003: App and storage**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Flask, React and SQLite together** (picked) | Uses both developers’ skills with one deployment. | Needs a React build step and agreed response fields. | Fits Tom and Ilias’s skills and existing task allocations. |
| Flask templates and plain JavaScript | Removes the React build step. | Changes Tom’s familiar workflow. | A possible simplification if React setup becomes a blocker. |
| Separate frontend and managed database | Can scale separately later. | Adds accounts, settings and failure points. | Too much setup for this free, 24-hour entry. |

Why: It uses existing skills and keeps deployment small. Proposed by the software architect.

**Decision 0006: Live demo fallback**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Laptop localhost with two browser sessions** (picked) | Works without venue internet or phone networking. | Does not demonstrate two physical phones. | Fits the existing setup and verification hours. |
| Phones connected to a laptop server | Preserves the two-phone demonstration. | Adds network access and local HTTPS setup. | Too uncertain for this fallback budget. |

Why: The public app gets phone testing; the fallback proves shared state on a predictable connection. Proposed by the software architect.

## 4. How the parts fit together

**In short:** Refresh counts and My check-in together every 15 seconds while visible.

> Go deeper: Keep validation, counting and expiry in small functions with supplied inputs; keep database and clock access outside. Allow one visit per browser. Switching either fully succeeds or changes nothing. Give each action a unique ID and saved result so retries cannot repeat changes. Tom allows one pending action and confirms only server-accepted changes.

```
React room list and My check-in
  | same-site HTTPS requests
  v
Flask routes -> pure visit and count rules
  |
  v
SQLite: rooms, visits and retry receipts

Fallback: two separate browser sessions -> localhost Flask
```

## 5. Data and privacy

**In short:** Store rooms and temporary anonymous visits.

> Go deeper: Rooms need ID, name and building. Visits need a scrambled random browser identifier, room ID and expiry. Cookies, small browser values, use Secure, HttpOnly and SameSite settings to limit insecure sending, script access and cross-site sending. Validate the sending site. Return counts and only that browser’s visit. Collect no names, GPS or movement history. Delete departed and expired visits; clear action results after judging. Check hosting logs; never log identifiers.

**Decision 0004: Visit lifetime**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **60 minutes with explicit renewal** (picked) | Limits forgotten visits without frequent interruptions. | A departed student can still count for up to an hour. | A simple starting rule that Ilias can test and Noor can explain. |
| 30 minutes with explicit renewal | Removes forgotten visits sooner. | Requires more frequent renewal during study. | Equally buildable, but adds more interruptions. |

Why: Use one clear rule for the demo and show its expiry in My check-in. Proposed by the software architect.

## 6. The look and the main screens

**In short:** Friendly, fast cards with My check-in near the top.

> Go deeper: Use large buttons, readable text, strong contrast, visible keyboard selection and spoken updates for screen-reader users. Show loading first. Failed refreshes keep old counts marked stale, meaning possibly outdated, with “Counts refreshed at”. Uncertain actions offer retry without claiming success. Expiry removes confirmation and offers check-in again; refreshing never renews.

## 7. Pitch and demo

**In short:** Show the working flow live, with a recording ready.

> Go deeper: Pitch: 0:00–0:25 problem; 0:25–0:50 list; 0:50–1:30 two-session check-in; 1:30–1:55 checkout; 1:55–2:25 limits; 2:25–3:00 impact and next step. Prefer hosting. Backup: localhost, an address on the laptop itself, with separate browser sessions; then an announced recording. Recording alone cannot satisfy the live-demo requirement.

**Decision 0005: Show the working flow live, with a recording ready**

| Option | Good | Bad | Fit for this team |
| --- | --- | --- | --- |
| **Live demo with recorded backup** (picked) | Shows real changes and protects the presentation from failures. | Requires rehearsed switching and reset. | A narrow flow fits the developers’ allocations and Noor’s six demo hours. |
| Recording as the main demo | Predictable timing. | Does not meet the live-demo requirement by itself. | Useful only as the fallback for this brief. |

Why: Live check-in and checkout demonstrate technical execution. A recording preserves evidence if the live setup fails. Proposed by the pitch and demo coach.

## 8. Who does what, and in what order

**In short:** Plan 35.5 of 52 person-hours; reserve 16.5 for problems.

| Area | Folders | Owner |
| --- | --- | --- |
| Experience and pitch | `content/`, `design/`, `demo/` | Noor |
| Phone interface | `web/` | Tom |
| Service and hosting | `server/`, `data/`, `tests/`, `deploy/` | Ilias |

| Block | Tasks |
| --- | --- |
| 1 | T1 Hours 0–2: Verify sample, permissions and wording (2h) (Noor · Experience and pitch) · T2 Hours 0–6: Check hosting; agree requests, load rooms and deploy (5h) (Ilias · Service and hosting) · T3 Hours 2–12: Design states in Figma; write pitch and slides (4.5h) (Noor · Experience and pitch) · T4 Hours 2–6: Build accessible list and visit panel (4h) (Tom · Phone interface) · T6 Hours 6–12: Build visit rules, storage and safe retries (5.5h) (Ilias · Service and hosting) · T7 Hours 6–12: Connect actions, refresh and failure states (5h) (Tom · Phone interface) · T9 Hours 12–18: Check phones, keyboard use and projection (2h) (Noor · Experience and pitch) · T10 Hours 12–24: Test rules, cookies, simultaneous users and laptop fallback (2h) (Ilias · Service and hosting) · T11 Hours 12–24: Test phone flow, fix failures and prepare demo sessions (3h) (Tom · Phone interface) · T14 Hours 18–24: Record before 23; rehearse pitch and fallbacks (2.5h) (Noor · Experience and pitch) |

| When | Working by then | Cut first if it slips |
| --- | --- | --- |
| Hour 2 | Agree room sample, wording and request/reply examples. | Room coverage. |
| Hour 6 | Host a small page; finish list layout. | Polish; extended hosting troubleshooting. |
| Hour 12 | Complete visit flow across two sessions. | Extra room content. |
| Hour 18 | Check phone flow; freeze features. | Remaining enhancements. |
| Hours 18–24 | Fix, check fallbacks, record before 23 and rehearse. | Slide decoration. |

## 9. Risks

**In short:** Protect honest labels, reliable visits and the live demo.

| Risk | Chance | Impact | What we do | Who watches |
| --- | --- | --- | --- | --- |
| Reports mistaken for available seats. | high | high | Keep limits visible in app and pitch. | Noor |
| Connecting the pieces runs late. | medium | high | Agree examples by hour 2; complete flow by 12. | Tom |
| Forgotten or false visits distort counts. | high | medium | Expire visits; allow one per browser. Separate browsers can still submit false reports. | Ilias |
| Hosting or venue internet fails. | medium | high | Deploy early; rehearse laptop and recording backups. | Ilias |

## 10. Smaller choices

- **What room status means:** Reported counts with unknown availability (also looked at: Inferred free/busy labels). Show reported activity and count refresh time, while explaining that bookings and unreported occupants are unknown.
- **Start with a building-grouped list:** Building-grouped list (also looked at: Campus map). It works on phones and during the three-minute demo using the available data.
- **Keep the visit flow on one page:** Room cards and embedded My check-in (also looked at: Separate Rooms, Details and My check-in views). The available room information fits on cards, and the active visit stays easy to find.
- **Show reports with count refresh time:** Reported counts with refresh time (also looked at: Binary free/busy labels). Use the same honest labels in the app and pitch. “Counts refreshed at” describes the timestamp accurately.
