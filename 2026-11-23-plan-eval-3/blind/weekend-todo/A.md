A calm, minimal to-do page for Lina’s laptop. Build it this weekend in 10 hours, leaving 2 hours for unexpected fixes. Everything is free, with no outside rules or AI features. Lina will learn JavaScript by building it.

## Keep it small
Use plain HTML, CSS, and JavaScript in `index.html`, `style.css`, and `app.js`. No framework is needed.

Save tasks in localStorage, the browser’s built-in website storage. No server database or account is needed. Use the same browser profile and local address, outside private browsing. Clearing browser data can erase tasks; storage is not a backup.

## Day 1 — 5 hours
- **1 hour — Lina:** Create the files, start a free local preview server at a steady address, and sketch an input, Add button, and task list.
- **2 hours — Lina:** Build a calm layout with clear labels, readable text, checkboxes, Delete buttons, and keyboard controls.
- **2 hours — Lina:** Add JavaScript to add, tick, and delete tasks. Ignore blank input. Use unique task identifiers so matching names work. Keep task-changing functions separate from page updates.

## Day 2 — 5 hours
- **2 hours — Lina:** Save after each change and load on opening. Keep storage calls separate from task-changing functions. Show a clear message if saving fails.
- **1 hour — Lina:** Trace a click through task data, page updates, and storage. Explain it in her own words, tidy names, and remove repeated code.
- **Final 2 hours — Lina:** Run every check below and fix problems. Use the 2 spare hours if needed.

## Done checks
- **Add:** Press Add or Enter. Exactly one task appears. Blank input adds nothing.
- **Tick:** Tick a task to complete it. Untick it to make it active again.
- **Delete:** Delete one of two tasks with matching names. Only the selected task disappears.
- **Keep tasks:** Add three tasks, complete one, and delete another. Reload, then close and reopen the browser at the same address. Both remaining tasks keep their completion states; the deleted task stays gone.

## Cuts and push-back
Cut due dates first, dark mode second, and extra visual polish third. Keep every must-have and the final checking block.

No requested idea needs rejecting. The brief fits the time and budget. Browser storage’s limits are acceptable for this small personal project.

## Decisions

- **How to build the page:** Plain HTML, CSS, and JavaScript (also looked at: A JavaScript framework, a prebuilt structure for an app). Lina can use her HTML/CSS skills and spend her limited time learning JavaScript directly.
- **Where tasks live:** Browser localStorage (also looked at: A SQLite database file with a local server). Browser storage is enough for one person on one laptop and costs nothing. A database adds setup without helping the must-haves.
