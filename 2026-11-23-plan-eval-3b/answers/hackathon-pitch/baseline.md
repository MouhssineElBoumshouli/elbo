Build a phone-first room list that shows student-reported occupancy. Make a reliable check-in/check-out demo the centre of the entry.

**Scope and honest status**

There is no live university data, so the app cannot guarantee that a room is free. Explain this clearly in the app and pitch: “Live student check-ins, not booking availability.”

- Start with 10–15 rooms from the PDF, grouped by building. Use a list; defer the map.
- Show room name, building, active check-in count, and freshness.
- Use “In use” when check-ins exist and “No active check-ins · availability unconfirmed” otherwise. Don’t label an unreported room as definitely free.
- Provide large “I’m here” and “Check out” buttons with immediate feedback.
- Expire check-ins after 60 minutes to reduce stale occupancy; show this rule to users.
- Allow one active room per anonymous browser identity. Switching rooms ends the previous check-in. This is a lightweight demo identity, not verified attendance.
- Defer notifications, university login, noise levels, capacity estimates, and AI.

**Ownership and effort**

These are person-hours inside the 24-hour event, including integration and rehearsal—not three continuous shifts.

| Owner | Work | Hours |
|---|---|---:|
| Noor | Shared kickoff; mobile design/copy; PDF transcription and validation; usability checks; pitch and rehearsal; final presentation | 1 + 3 + 2 + 3 + 4 + 2 + 1 = 16 |
| Tom | Shared kickoff; React list UI; check-in/out integration; freshness/error states; testing and fixes; rehearsal/support | 1 + 5 + 5 + 2 + 3 + 2 = 18 |
| Ilias | Shared kickoff; room data/storage; Flask API and expiry rules; integration/deployment; testing and fixes; rehearsal/support | 1 + 3 + 5 + 4 + 3 + 2 = 18 |
| **Total** | | **52** |

**24-hour delivery sequence**

| Event time | Deliverable and handoff |
|---|---|
| H0–1 | All: agree scope, status wording, data fields, API examples, acceptance checks, and demo story. Create all project assets during the event. |
| H1–4 | Noor supplies a simple mobile layout and validated room list. Tom builds against agreed sample responses. Ilias builds storage and API. Test a free hosting route early; retain a laptop-run fallback. |
| H4–9 | Connect the full path: load rooms → check in → count changes → check out. By H9, demonstrate this from two browsers. |
| H9–13 | Add automatic expiry, refresh every 15 seconds, loading/error feedback, and duplicate-request handling. Aim for a shared working URL by H13. |
| H13–17 | Noor runs three quick student usability checks if available. Tom and Ilias fix blockers. Verify phone layout, concurrent check-ins, and data persistence. Feature freeze at H17. |
| H17–20 | Assemble the pitch, rehearse the complete demo, and capture a clearly labelled backup recording. Fix only essential defects. |
| H20–23 | Keep contingency time and staggered breaks. Run two timed rehearsals; check the venue connection and local fallback. |
| H23–24 | Reset demo data, open the two demo sessions, verify the presentation setup, and deliver at H24. |

Schedule individual work within these windows to respect the 16/18/18-hour limits. Keep Tom and Ilias together for integration; stagger breaks elsewhere.

**Small technical design**

Use React and Flask, with a small persistent store behind Flask. Keep room records separate from check-ins. Store check-in identity, room, start time, and expiry time; derive counts from unexpired records.

Agree three API operations at H1: list rooms with counts, check in, and check out. Keep expiry and room-switching rules in small pure functions that accept the current time as an argument. Test these without a database or network. Keep storage and HTTP handling in a thin outer layer.

Use free tools and hosting only. Confirm that storage survives restarts before relying on the hosted version. If no suitable free deployment is working by H13, prioritise a reliable laptop-run demo and disclose that limitation.

**Done means**

- Every seeded room matches the PDF.
- Two separate browser sessions can check into one room; both see a count of two within 15 seconds.
- Repeated taps do not duplicate a check-in; switching rooms removes the old one.
- Checkout and expiry reduce the count correctly.
- Refresh preserves the browser’s active check-in.
- Failed requests show a retry option without falsely confirming success.
- The app explains that zero check-ins does not prove availability.
- The complete pitch and demo finish within three minutes.

**Pitch and demo**

- 0:00–0:30 — Impact: students waste time searching for somewhere to study.
- 0:30–0:50 — Explain the community reporting approach and its data limitation.
- 0:50–2:10 — Live demo: choose a room, check in on one device, show the update on another, then check out.
- 2:10–2:40 — Technical execution: shared state, expiry, duplicate protection, and mobile usability.
- 2:40–3:00 — Share actual usability observations and propose a small campus pilot. Do not invent adoption or time-saving results.

Use clearly labelled demo activity; never imply seeded check-ins are real students. If connectivity fails, switch to the local app or labelled recording.

The main product risk is participation: empty counts may mean nobody reported. Address that honestly in the prototype and propose testing adoption in one building before expanding.
