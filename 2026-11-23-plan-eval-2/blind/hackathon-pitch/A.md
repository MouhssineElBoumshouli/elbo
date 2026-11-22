# 24-hour project plan

Build a phone-friendly room list that students can check at a glance, with one-tap “I’m here” and “Check out.” Prioritize a reliable live demo and an honest explanation of what the data means.

**Success at hour 24:** two phones can open the app, find a room, check in, see the updated status, and check out during a rehearsed 3-minute pitch.

## Scope and the key data decision

The PDF gives you room locations, not live availability. Present the app as **student-reported activity**, not confirmed vacancy or booking availability.

Use three clearly labelled states:

- **Unknown:** no recent reports.
- **Reported free:** the latest checkout left no active check-ins; show when it happened.
- **In use:** one or more active check-ins; show “3 students checked in,” not “full,” because room capacities are unknown.

Put “Based on student check-ins; availability isn’t guaranteed” near the status explanation. If a check-in expires without a checkout, return to Unknown rather than claiming the room is free. A checkout is only a recent signal, so “Reported free” also expires.

**Day-one features**

- A mobile room list grouped or filtered by building.
- A small, verified set of rooms transcribed from the PDF, with coverage clearly stated.
- Room name, building, status, active check-in count, and freshness.
- “I’m here,” “Check out,” and a visible reminder of the student’s current room.
- Automatic refresh and clear loading, empty, and connection-error states.

**Defer:** map, notifications, university login, favourites, noise levels, booking integration, and AI. A list avoids spending time on coordinates and map setup.

## Team schedule: 52 person-hours within 24 elapsed hours

Hours below are work allocations inside each window, not continuous attendance. Use the remaining time for food and rest, with everyone available for integration gates and the pitch.

| Window | Noor | Tom | Ilias | Deliverable |
|---|---|---|---|---|
| H0–2 | 2h: agree story, inspect PDF, sketch flow | 2h: React setup, agree API | 2h: Flask setup, data model, deployment check | Scope locked; app shell reachable on phones |
| H2–6 | 3h: mobile Figma screens, room transcription, copy | 4h: room list, building filter, status components | 4h: room seed data, persistence, check-in/out API | First end-to-end room flow |
| H6–10 | 2h: verify room data, phone usability checks | 4h: connect API, current-room controls, refresh | 4h: expiry rules, duplicate handling, rule tests | Two phones see shared state |
| H10–14 | 2h: student feedback, pitch outline | 3h: improve usability and error handling | 3h: integration fixes and persistence verification | Complete MVP; feature freeze |
| H14–18 | 2h: pitch visuals and demo script | 2h: mobile/browser testing and fixes | 2h: API checks and deployment fixes | Release candidate passes acceptance checks |
| H18–22 | 3h: timed rehearsals and backup recording | 2h: demo support and critical fixes | 2h: demo preparation and recovery practice | Rehearsed pitch; backup ready |
| H22–24 | 2h: final rehearsal, setup, presenting | 1h: final smoke test and demo support | 1h: service check and demo support | Live pitch at H24 |
| **Total** | **16h** | **18h** | **18h** | **52h** |

Noor owns scope and presentation decisions. Tom owns the mobile experience. Ilias owns shared state and deployment. All project code, designs, slides, and recordings are created during the hackathon.

## Technical approach

Use React, Flask, and SQLite in one small deployment. Choose and verify a zero-cost hosting option by H2, including storage and phone access; avoid paid services or anything requiring an upgrade. If free hosting cannot support the app, establish a laptop-hosted demo on a tested shared network early and disclose that limitation.

Keep the implementation small:

- Rooms come from the supplied PDF; manually verify names and buildings.
- Store a random browser identifier locally; collect no names, emails, or location history.
- Allow one active room per browser. Switching rooms closes the previous check-in; repeated taps do not add people.
- Use a 60-minute check-in expiry and a 15-minute “Reported free” window as initial assumptions. Make expiry visible and allow renewal.
- Poll for updates every 10 seconds; update the acting student’s screen immediately after a successful request.
- Keep status and expiry calculations in pure functions with the current time passed in. Keep database access and HTTP handling outside that logic.

Anonymous browser identity is sufficient for the prototype, but counts remain unverified reports rather than a reliable attendance measure.

## Delivery gates and cuts

- **H2:** API shape agreed and deployment route proven. If room transcription is slow, cover one building well.
- **H6:** one real check-in must travel from UI to database and back. Cut filters and visual extras if behind.
- **H10:** a second phone sees the change within 10 seconds. Shared state takes priority over polish.
- **H14:** freeze features. Spend the remaining time on reliability, clarity, and presentation.
- **H18:** acceptance checks pass. Record the working demo.
- **H22:** freeze the demo build except for blocking defects.

## Acceptance checks

- A student can find a room and check in on a small phone screen.
- A second phone sees the active count change within 10 seconds.
- Repeated taps do not duplicate a check-in; switching rooms updates both rooms.
- Checkout removes only that browser’s check-in. Remaining check-ins keep the room In use.
- Expired check-ins cannot produce a false “Reported free” status.
- Refreshing the browser preserves its active check-in; restarting the service preserves stored state where the chosen deployment supports it.
- Connection failures show an error or stale-data indication rather than a false success.

Ilias tests the status, expiry, and check-in rules without a database or network. Tom and Noor run the two-phone flow and usability checks on the deployed app. Aim for three brief student trials if participants are available; report only feedback actually collected.

## Three-minute pitch

| Time | Content |
|---|---|
| 0:00–0:30 | Noor explains the problem: walking between buildings looking for somewhere to study. |
| 0:30–0:50 | Explain the solution and its limits: recent student reports, with no university booking feed. |
| 0:50–1:50 | Live demo: open the list, check in on one phone, show the second phone updating, then check out. |
| 1:50–2:25 | Explain technical execution: shared state, duplicate prevention, expiry, and mobile usability. |
| 2:25–3:00 | Share any observed student feedback, explain the initial one-building rollout, and close with the benefit. |

Use a clearly labelled demo room for staged activity. Prepare the two devices before the pitch. Keep screenshots and a short recording of the actual working build available if venue connectivity fails; identify the recording as a backup.

The main product risk is participation: an empty app cannot establish that rooms are free. An initial rollout in one busy building makes reports more likely to be useful. Judge the prototype on whether students understand the signals and can complete the flow—not on invented usage or time-saving claims.
