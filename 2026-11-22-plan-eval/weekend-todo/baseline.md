Build a calm, minimal to-do page with plain HTML, CSS, and JavaScript. Store tasks in localStorage so they survive reloads and closing the browser. No framework, backend, account, paid services, or AI needed.

Lina owns all work: 12 hours across this weekend.

Day 1 — Working essentials (6 hours)
1. Build the page: heading, labelled task input, Add button, and task list. Use generous spacing and readable colours. (1 hour)
2. Add tasks through a form, including the Enter key. Trim whitespace and reject empty tasks. Represent each task with an ID, text, and completed status. (1.5 hours)
3. Add completion checkboxes and Delete buttons. Keep task state in an array and render the list from it. (1.5 hours)
4. Save the array to localStorage after each change; load it when the page opens. (1 hour)
5. Check all four essentials: add, complete, delete, and reload without losing changes. Also close and reopen the browser. (1 hour)

Day 2 — Make it comfortable and reliable (6 hours)
1. Refine the minimal styling, completed-task appearance, and empty-list message. (1 hour)
2. Improve keyboard use, visible focus, labels, and long-task wrapping. (1 hour)
3. Handle missing or unreadable saved data and show a clear message if saving fails. Keep task-update functions separate from page rendering and storage calls so the logic is easy to understand and check. (1 hour)
4. Test blank input, duplicate task text, long text, deleting the correct task, completion persistence, and an empty saved list. Fix issues. (1.5 hours)
5. Review the JavaScript: explain how form events change the array, how rendering works, and why JSON is needed for storage. Write brief setup and usage notes. (0.5 hour)
6. Keep a buffer for debugging and finishing. (1 hour)

Done means
- A nonblank task can be added with the button or Enter.
- Tasks can be checked and unchecked independently.
- Deleting a task removes only that task.
- Task text and completion status survive reloads and browser restarts.
- The page works with a keyboard and has no uncaught errors during these checks.

Keep the scope small
Use three files: index.html, style.css, and app.js. Use a free local static server and reopen the same address and port each time, because browser storage belongs to that address. Tasks stay in this browser profile; clearing site data removes them. Sync and backup are outside this weekend’s scope.

Defer due dates and dark mode until after the weekend. For learning, build and verify one behaviour at a time using browser developer tools, rather than copying a complete app.
