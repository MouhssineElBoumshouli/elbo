Study Spot helps students find rooms worth checking. It shows recent student reports, with a quick “I’m here” button and a clear way to leave. We build a small, working demo in 24 hours, using 46 of the team’s 52 available hours.

## What we can honestly show

We cannot promise that a room is free right now. The PDF gives us room names and buildings, not bookings, capacity or live occupancy. An empty report count does not mean an empty room.

Use these labels: “No recent reports — availability unknown” and “3 students checked in.” Show when the information was updated. Add “Student reports only; this is not a booking.” This gives students useful evidence without pretending we know more than we do.

## Assumptions and limits

We assume the team has laptops, can install free development tools, and may use the PDF’s room names in the entry. Noor checks that assumption at the start. We also assume judges can view a laptop demo. Venue Wi-Fi may prevent phones from reaching that laptop, so test this early.

All project work, including design, room entry, code and slides, happens during the hackathon. Noor checks the event’s rules on libraries and starter templates before the team uses them. There is no AI feature. Spending stays at zero.

## The small version

Start with a phone-friendly list grouped by building. Include up to 12 rooms copied and checked against the PDF. Label it as a selected set of rooms. A map would need location information we do not have.

Tom uses React, which he knows, for the screens. Ilias uses Flask, his Python web tool, for saving and returning reports. Keep everything in SQLite: one small database file on the demo laptop. Flask also serves the finished screens, so the team runs one app.

Each browser gets a random identifier so it can change its own check-in. Store no names, university accounts or precise locations. Keep only one active room per browser. Repeated taps must not add extra people. Moving to another room ends the previous check-in. Check-ins expire after 60 minutes, and the app tells students this. Delete expired records; do not build a history of visits.

This counts browser reports, not verified people. Someone could use another browser to report twice. That is acceptable for a clearly labelled hackathon demonstration, but it is not reliable campus occupancy data.

Refresh room counts every 15 seconds. If the connection fails, show “Could not refresh” and the last update time. Never turn a failed request into an empty-room message.

## Hours 0–2: agree and prove the setup

- **Noor — Scope and phone sketch, 2 hours:** Check event rules and PDF use, choose the wording, and sketch one list screen in Figma. Use her presenting skills to frame the problem for judges.
- **Tom — Screen setup, 1 hour:** Create the React screen with large buttons and test a phone reaching the demo laptop with Ilias.
- **Ilias — Server setup, 1 hour:** Start Flask, establish the shared request format with Tom, and test the laptop connection. Keep the laptop demo as the fallback.

## Hours 2–6: build the first usable path

- **Noor — Room list and visual design, 3 hours:** Copy and verify up to 12 room names and buildings. Finish friendly, readable screen designs, including unknown and connection-error states.
- **Tom — Room list and controls, 4 hours:** Build the building groups, report labels, and check-in and check-out controls using temporary sample responses.
- **Ilias — Report storage and rules, 4 hours:** Create the database and requests for listing rooms, checking in and leaving. Keep expiry and room-switching rules in small functions that can be tested without a server or database.

## Hours 6–12: connect the whole app

- **Noor — Usability check and pitch draft, 3 hours:** Ask two nearby participants, if available, to find a room and check out. Otherwise, run those tasks herself. Note confusing wording and draft the impact story.
- **Tom — Live screen integration, 5 hours:** Connect the screens to Flask. Add automatic refresh, last-update times, clear failure messages and feedback after each tap.
- **Ilias — Expiry and rule checks, 5 hours:** Finish browser identifiers and automatic expiry. Test repeat taps, changing rooms, checkout and expiry. Connect the database operations and verify that restarting the app keeps active reports.

By hour 12, one browser must be able to check in and another must see the change.

## Hours 12–18: make it dependable

- **Noor — Demo script and slides, 2 hours:** Write a three-minute story: 40 seconds on the problem, 100 seconds on the live demo, and 40 seconds on limits and next steps.
- **Tom — Phone and full-flow checks, 4 hours:** Test narrow screens, two browser sessions, refresh timing and a lost connection. Fix issues that block the main journey.
- **Ilias — Demo packaging and recovery, 4 hours:** Make Flask serve the finished screens. Write short start and reset instructions. Prepare a separate, clearly labelled demo database with invented reports. Test recovery after restarting the laptop app.

Freeze features at hour 18. Demonstration reports must never look like genuine campus activity.

## Hours 18–24: rehearsal and fixes only

- **Noor — Rehearsal and pitch, 4 hours:** Run two timed rehearsals with the team, simplify the story, and deliver the pitch at hour 24.
- **Tom — Final screen fixes, 2 hours:** Join rehearsals and fix only problems that threaten the demo. Capture a short backup recording during the event.
- **Ilias — Final server fixes, 2 hours:** Join rehearsals, reset the demo data, and verify startup and the two-browser demonstration.

Rehearse around hours 20 and 22. Have the app ready by hour 23. Use the laptop if venue Wi-Fi blocks phones. The recording is emergency backup; it does not replace the live-demo target.

## Time and budget

Noor uses 14 of 16 hours. Tom uses 16 of 18. Ilias uses 16 of 18. Each has two unassigned hours for surprises. These are working hours spread across the schedule, not continuous shifts. Coordinate handoffs and leave time to rest. Use existing laptops and free tools; buy no hosting or services.

## How we know it is done

- **Room status list:** On a phone-sized screen, all selected rooms match the PDF and show either a recent report count or “No recent reports — availability unknown,” with an update time. A connection failure is visible.
- **Check in and check out:** Two browser sessions show a check-in and checkout within 15 seconds. Repeated taps count once, moving rooms clears the old report, and a controlled time test proves expiry after 60 minutes.
- **Three-minute live demo:** Two timed rehearsals finish within three minutes. At hour 24, Noor demonstrates the room list, check-in and checkout live, using clearly labelled demonstration data.

## Push-back

- **Guaranteed free/busy status:** We lack bookings and live occupancy. Show recent reports and unknown availability instead.
- **A campus map on day one:** The PDF has no confirmed map positions, and mapping adds work. Use a building-grouped list.
- **A public campus launch in 24 hours:** Anonymous reports and a laptop demo are not enough for a dependable public service. Deliver the judged prototype and explain its limits.

## Cut first

1. Notifications, university login and noise levels: leave all three out from the start.
2. Extra visual polish and animations: keep readable text and clear buttons.
3. Room coverage: reduce the selected set from 12 rooms to 6, keeping its limited coverage visible.

Keep honest status labels, check-in, checkout, expiry, connection errors and rehearsal time.

Decisions

- **What room status means:** Recent check-in counts and explicit unknown availability (also looked at: Free/busy labels inferred from zero check-ins). There is no booking or occupancy feed. Zero reports cannot prove a room is free.
- **Room browsing:** A phone-friendly list grouped by building (also looked at: A campus map). The PDF supports a list without inventing coordinates. This keeps Tom's work within his available hours.
- **Storage:** SQLite on the demo laptop (also looked at: One JSON file, A hosted database). SQLite keeps reports in one file and supports updates from multiple browser sessions. Ilias avoids running a separate database service.
- **Check-in identity:** A random browser identifier with 60-minute expiry (also looked at: University account login, Anonymous taps with no browser identifier). This allows checkout and prevents repeat taps from inflating counts without building login. Reports remain unverified, and forgotten check-ins expire.
- **Demo delivery:** React screens served by Flask on one laptop (also looked at: Separate hosted frontend and backend, A static screen mockup). Tom and Ilias use their existing skills, and the demo needs no paid service. A local working app supports the technical score, with phone access tested early.
