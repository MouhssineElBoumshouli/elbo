A calm task list for Lina’s laptop, finished this weekend. Use 10 hours, leaving 2 spare. Everything is free, with no outside rules or AI.

## Keep it small
Use HTML, CSS, and plain JavaScript in `index.html`, `style.css`, and `app.js`. Save a short list with localStorage in one browser profile. Private browsing or clearing browser data can erase tasks. Direct-file storage varies across browsers, so use a fixed local address. [Storage details](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage).

## Day 1 — essentials, 6 hours
Lina handles every step.

- **Hour 1:** Create the files, labelled input, Add button, and list. Verify or install free Python 3. From the project folder, run `python3 -m http.server 8000 --bind 127.0.0.1` in a terminal. On Windows, replace `python3` with `py -3`. Bookmark `http://127.0.0.1:8000/index.html`. Save these reopening instructions: run the same command, leave the terminal running, and open the bookmark. Keep port 8000; if busy, stop the conflicting program and retry. [Python instructions](https://docs.python.org/3/library/http.server.html).
- **Hours 2–3:** Implement add, tick, untick, and delete. Ignore blanks; give tasks separate identities so duplicate names work independently.
- **Hours 4–5:** Save after changes and restore on opening. Separate task-changing functions from page updates and saving. Show saving failures.
- **Hour 6:** Run all four completion checks. Fix failures before polish.

## Day 2 — learn and finish, 4 hours
- **Hour 1 — Lina:** Trace a click through task data, page updates, and saving. Simplify confusing code and write brief learning notes.
- **Hour 2 — Lina:** Add calm spacing, readable text, labelled controls, and visible keyboard focus. Check keyboard use.
- **Hours 3–4 — Lina:** Rehearse the full flow and server restart using saved instructions. Fix problems and repeat affected checks. Use the 2 spare hours if needed.

## Completion checks
- **Add:** Nonblank input adds one task; blank input adds nothing.
- **Tick:** Each task can be ticked and unticked independently.
- **Delete:** Only the chosen task disappears, including with duplicate names.
- **Keep tasks:** At the bookmarked address in the same browser profile, reload and restart both browser and server. Names and completion states remain; deleted tasks stay gone.

## Push-back and cuts
The essentials fit. Adding due dates or dark mode this weekend would squeeze learning and checks; leave both for later. Cut due dates first, then dark mode, then extra visual polish. Keep all essentials and the final rehearsal.

## Decisions

- **How to build it:** HTML, CSS, and plain JavaScript (also looked at: A JavaScript framework, which supplies extra tools for building interfaces). Plain JavaScript fits Lina’s skills and learning goal; a framework adds unnecessary setup.
- **Saving and reopening:** localStorage at a fixed address served by Python 3 (also looked at: localStorage with index.html opened directly, localStorage with an unspecified preview tool, A local database file with a server, A hosted database). A fixed address preserves access without a database; Python’s server does not silently switch ports. Direct-file storage varies across browsers, and an unspecified preview tool leaves reopening unclear.
