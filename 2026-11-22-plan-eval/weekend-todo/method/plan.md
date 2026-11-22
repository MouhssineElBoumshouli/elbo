# Plan: Lina’s Quiet To-Do

Small plan · 6 tasks · Panel: project manager, software architect. Decisions are proposals until you agree.

## 1. What we build and for whom

**In short:** Build a calm, minimal task page for Lina’s laptop this weekend while she learns JavaScript.

## 2. Must-haves and later

**In short:** Day one: add, tick off, delete and keep tasks after reopening; due dates and dark mode wait.

## 3. Stack and why

**In short:** Choose HTML, CSS and plain JavaScript: free and direct learning, but requires wiring actions; React offers reusable screen pieces but adds too much learning for Lina’s 12 hours.

**Page stack:** Plain JavaScript + localStorage (also looked at: React + localStorage). Meets every must-have without a database, account or build tools.

## 4. Top risks

**In short:** Use localStorage in the same browser at a fixed local address; saved tasks can disappear if browser data is cleared.

| Risk | Chance | Impact | What we do | Who watches |
| --- | --- | --- | --- | --- |
| JavaScript learning takes longer. | medium | medium | Build one action at a time; use the 4-hour reserve and keep optional features deferred. | Lina |
| Saving fails or browser data is cleared. | medium | high | Check reopening early, show errors, avoid private browsing and explain that clearing browser data removes tasks. | Lina |

## 5. Who does what, and in what order

**In short:** Lina owns block 1: 8 planned hours, including learning, plus 4 hours for problems—above the required 30% buffer.

- [ ] Set up free local serving; learn JavaScript basics (1.5h). (Lina · Page and setup)
- [ ] Build calm page with labelled controls (0.75h). (Lina · Page and setup)
- [ ] Add, tick, delete; reject blanks; separate task rules from screen updates (2h). (Lina · Task behavior and saving)
- [ ] Save and restore tasks and ticks; show saving errors (1.25h). (Lina · Task behavior and saving)
- [ ] Demonstrate all essentials and review progress (0.5h). (Lina · Review)
- [ ] Check rules, keyboard use, reload and reopening; fix issues; write startup steps (2h). (Lina · Review)
