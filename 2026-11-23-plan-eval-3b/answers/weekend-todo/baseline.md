Build a calm, minimal to-do page in two days, using Lina’s 12 hours. Day one delivers all four essentials; day two makes it reliable and leaves time to understand the JavaScript.

Use plain HTML, CSS, and JavaScript, with no framework, backend, accounts, or paid services. Store tasks in the browser’s localStorage. Use the same browser and local address each time; tasks survive reloads and closing the browser, but clearing browser data removes them.

Scope
- One page with a task input, Add button, and task list.
- Each task has a checkbox and Delete button.
- Reject empty tasks and clear the input after adding one.
- Calm styling: generous spacing, readable text, neutral colors, and a visible completed state.
- Due dates and dark mode stay out of this weekend’s scope.

Day 1 — working essentials, 6 hours
1. Set up and sketch the page — 30 minutes. Create index.html, styles.css, and app.js. Use a free local development server with a stable address.
2. Build the HTML and basic styling — 1 hour. Include a labeled input, form, list, and keyboard-visible focus styles.
3. Implement adding and displaying tasks — 2 hours. Represent each task with an ID, text, and completed flag. Learn arrays, objects, functions, form events, and DOM updates. Display task text using textContent.
4. Implement completion and deletion — 1.5 hours. Change tasks by ID so repeated task names work correctly.
5. Save and restore tasks — 1 hour. Read localStorage at startup and save after every change. Check that adding, completing, and deleting tasks all persist after reload.

Day 2 — checks, polish, and learning, 6 hours
1. Test the complete flow and fix bugs — 2 hours. Add several tasks, complete one, delete another, reload, then close and reopen the browser. Confirm the exact remaining tasks and completion states return. Also check blank input, repeated names, long text, and an empty list.
2. Refine usability and appearance — 1.5 hours. Support Enter to add, keep controls easy to use with the keyboard, and make long tasks wrap cleanly. Add a simple empty-list message.
3. Review and simplify the JavaScript — 1 hour. Keep task-changing functions separate from DOM and storage operations. Explain the flow in your own words: user action → update task array → save → render. Add a few small checks for the task-changing functions without using the browser or storage.
4. Write a short README — 30 minutes. Record how to run the page, where tasks are stored, and what you learned.
5. Keep a bug-fix buffer — 1 hour. If unused, practice rebuilding one small function from memory.

Done means Lina can add, complete, and delete tasks; the correct state survives reload and browser restart at the same address; and the page is comfortable to use with a keyboard. If time gets tight, cut visual polish first and protect persistence checks and the learning review.
