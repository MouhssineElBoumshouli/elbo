Build a calm, minimal to-do page in plain HTML, CSS, and JavaScript. Use browser localStorage to keep tasks after reloads and closing the browser. No framework, backend, accounts, paid services, or AI.

Lina owns all work: 12 hours over 2 days. The priority is a working day-one version, with time on day two to understand and polish the JavaScript.

Day 1 — working essentials (6 hours)
1. Set up the page and task form — 1 hour. Create an input, Add button, and task list with a simple, readable layout.
2. Add and display tasks — 2 hours. Practice form events, arrays, objects, and DOM updates. Give each task a stable ID; ignore empty or whitespace-only input. Render task text as text, not HTML.
3. Complete and delete tasks — 1.5 hours. Add a checkbox and Delete button for each task. Show completed tasks with a subtle strikethrough.
4. Save and restore tasks — 1.5 hours. Use JSON and localStorage; save after every change and load on startup. Check all four essentials before ending the day.

Day 2 — reliability, learning, and polish (6 hours)
1. Test and fix the essentials — 2 hours. Check adding multiple tasks, completing and uncompleting them, deleting the correct task, and preserving each change after reload and browser restart. Handle missing or invalid saved data without breaking the page.
2. Polish the minimal design — 1.5 hours. Use a neutral background, readable text, generous spacing, clear labels, and visible keyboard focus. Verify that adding, checking, and deleting work with the keyboard.
3. Review the JavaScript — 1 hour. Keep task-changing logic in small functions separate from DOM updates and browser storage. Explain each function in your own words and simplify anything you cannot yet explain.
4. Final check and short README — 0.5 hour. Record how to run it, how saving works, and its limits.
5. Buffer — 1 hour. Use this for bugs or learning time before considering extras.

Keep the implementation small: index.html, styles.css, and app.js. Store tasks as objects with an ID, text, and completed status. Use a free local static server at the same address and port each time so browser storage stays consistent.

Done means you can add, complete, uncomplete, and delete tasks; saved changes survive reloads and closing/reopening the browser; and the page feels calm and works with a keyboard. Verify this manually in your laptop’s browser—no test framework is needed for this weekend project.

Storage limit: tasks stay in that browser profile at that site address. Clearing browser data removes them; private browsing is unsuitable for keeping them. Sync and backups are outside this weekend’s scope.

Due dates and dark mode wait until the essentials pass every check. If time runs short, cut visual polish first and protect the four required features.
