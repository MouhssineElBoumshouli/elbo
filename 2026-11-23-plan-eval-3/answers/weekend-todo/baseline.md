Build a calm, minimal, single-page to-do list using HTML, CSS, and plain JavaScript. Store tasks in localStorage so they survive reloads and closing the browser. No accounts, backend, paid tools, or AI.

Scope for this weekend
- Add a task, rejecting empty or whitespace-only text.
- Tick tasks complete or incomplete.
- Delete a task.
- Save and restore task text and completion status.
- Keep due dates and dark mode for later.

Lina’s schedule — 12 hours across 2 days

Day 1 — Working essentials (6 hours)
1. Set up index.html, styles.css, and app.js; create a labelled input, Add button, and task list — 1 hour.
2. Learn arrays, objects, and functions while building task state and rendering it on screen — 1.5 hours.
3. Connect form submission, checkboxes, and Delete buttons using event listeners — 1.5 hours.
4. Save changes to localStorage and restore tasks on page load — 1 hour.
5. Check all four required features, including reload and closing/reopening the browser — 1 hour.

Day 2 — Polish, practice, and finish (6 hours)
1. Apply a quiet palette, readable text, generous spacing, and clear completed-task styling — 1.5 hours.
2. Improve keyboard use, visible focus, labels, and the empty-list message — 1 hour.
3. Refactor small functions: keep task updates separate from DOM rendering and browser storage — 1 hour.
4. Run the acceptance checks below and fix issues — 1 hour.
5. Write brief setup notes and explain the JavaScript flow in your own words — 0.5 hour.
6. Keep a buffer for bugs and learning — 1 hour.

Implementation approach
Use task objects with an ID, text, and completed flag. Keep one tasks array as the source of truth. Event handlers update it, save it, and render the list. Keep add, toggle, and delete logic in small functions that can be checked without the browser or storage. Insert task text using textContent.

Run the page at the same local address using a free local development server. Browser storage belongs to that address and browser profile; clearing browser data removes the tasks. Show a clear message if saving fails.

Done means
- A nonempty task can be added by clicking Add or pressing Enter.
- Blank input creates no task.
- A task can be completed and reopened.
- Deleting one task leaves the others intact.
- Task text and completion states survive reload and browser restart at the same address.
- The main actions work with the keyboard and have visible focus.
- There are no console errors during these checks.

Learning priority
Build one small feature at a time, predict what the code will do, then test it. Focus on arrays, objects, functions, DOM events, and JSON storage. If time gets tight, simplify styling and protect the working essentials and testing time.
