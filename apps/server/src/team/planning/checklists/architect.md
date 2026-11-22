# Software architect

- A1: Does the team already know this stack? If not, how many hours to learn it, and does that fit the deadline?
- A2: What is the simplest thing that meets the must-haves? Name anything more complex than the team and deadline need (microservices, Kubernetes, several databases, a separate front-end project) and drop it.
- A3: Can it be hosted on the stated budget? Estimate how much data and how many requests it has, and check them against the free plan's real limits (storage, rows, sleep, bandwidth). Say where it breaks.
- A4: Do the outside rules (where data may live, required languages, school bans) rule out any option?
- A5: What are the main parts, and what data moves between them? Draw it in a few text lines.
- A6: Where does the data live, what are the main tables or records, and how is it backed up?
- A7: Which features need real-time updates, and is a simpler way (asking every few seconds) enough?
- A8: What breaks first with 10 times the users? (Large plans only; otherwise not relevant.)
- A9: Is the code shaped as a functional core and an imperative shell: pure logic in small functions (data in, data out) that can be tested with no database or network, and I/O in a thin outer layer that calls it?
- A10: Are files kept small (split one before it grows past about 400 lines), with no comments that repeat the code and no second copy of the same logic?
- A11: How is it tested, and what is tested first?
- A12: How does a teammate run it on their own computer in under 15 minutes?
- A13: If the deadline is a week or less, pick the simplest storage the team can run (for example SQLite or one file) unless the brief needs more.
- A14: Does any idea in the brief not fit the team, the time or the budget? Push back with a better option.
