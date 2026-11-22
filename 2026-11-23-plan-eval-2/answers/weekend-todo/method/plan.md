# Plan: Lina’s Simple Tasks

Small plan · 4 tasks · Experts: project manager, software architect. Decisions are proposals until you agree.

## 1. What we build and for whom

**In short:** Lina will build a calm to-do page for her laptop while practising JavaScript: 12 hours this weekend, free only, no AI and no outside rules.

## 2. Must-haves and later

**In short:** Day one covers adding, ticking off, deleting and keeping tasks; due dates and dark mode wait until later.

**Done means:**
- Add a task: A non-empty task appears; blank input adds nothing.
- Tick a task off: Ticking visibly marks the task complete.
- Delete a task: Deleting removes the chosen task.
- Keep tasks: Reload and reopen the same browser address: tasks and ticks remain; deleted tasks stay gone.

## 3. Stack and why

**In short:** Page and storage: choose plain JavaScript with localStorage, the browser’s built-in storage—free and familiar, but tied to one browser; SQLite, a database stored in a file, offers copyable data but needs extra server code beyond Lina’s weekend.

**Page and storage:** Plain JavaScript + localStorage (also looked at: JavaScript + SQLite). Lina already knows HTML/CSS and wants JavaScript practice. Browser storage meets the single-laptop requirement with the least code.

## 4. Top risks

**In short:** Protect learning time, check saved tasks early, and show saving failures clearly.

| Risk | Chance | Impact | What we do | Who watches |
| --- | --- | --- | --- | --- |
| JavaScript learning takes longer. | medium | high | Check each feature early; use the four spare hours. | Lina |
| Browser data is cleared or private browsing loses tasks. | medium | medium | Use the same normal browser and address; document this limit. | Lina |
| Saving fails or stored data cannot be read. | low | medium | Show an error and preserve unreadable data instead of overwriting it. | Lina |

## 5. Who does what, and in what order

**In short:** Plan 8 hours of work and keep 4 hours spare, exceeding a 30% buffer; keep task rules separate from page controls and saving, and serve the page at one fixed local address.

- [ ] Set up local serving and minimal HTML/CSS page (2h). (Lina · To-do page)
- [ ] Build add, tick and delete rules and controls (2h). (Lina · To-do page)
- [ ] Save and restore tasks; show save failures (2h). (Lina · To-do page)
- [ ] Check rules, reload and restart; fix problems; document running (2h). (Lina · To-do page)

| When | Working by then | Cut first if it slips |
| --- | --- | --- |
| Day one, after 6 planned hours | All four must-haves work. | Extra visual polish. |
| Day two, after 8 planned hours | Checks pass; running instructions are written; 4 spare hours cover problems. | Any optional additions. |
