# Elbo 1.0: the finish line

Elbo 1.0 is done when all seven are true. Anything else goes to [LATER.md](LATER.md).

| #   | Done when                                                                                                                                                                                                                                     | How we know                                                               |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 1   | The Part 1 fixes are in: the palette never types into the chat box, plans follow the project's existing AGENTS.md / CLAUDE.md, and rules are few and short.                                                                                   | Tests in `main`; the attendance rerun's rules listed in PROGRESS.md.      |
| 2   | Planning slice 6 works: a team shares a plan, votes on each decision, and the decider decides.                                                                                                                                                | Two dev servers on a local team; one real push-back by the second person. |
| 3   | The finish-line feature works: "Done when" checks, the Later list, and the "Version 1 is done" card.                                                                                                                                          | Tests for the "done" logic; seen on a demo project.                       |
| 4   | `docs/user/README.md` covers planning.                                                                                                                                                                                                        | The section is there, short, in the product's voice.                      |
| 5   | A release-candidate Beta passes the walkthrough: solo chat, access list, Check my setup, team claim and overlap warning, Notes, plan → push back → save, team vote → decide, the Done when card, the limit card's wording, the Update button. | Pass/fail per flow in PROGRESS.md.                                        |
| 6   | Mouhssine and a classmate pass the two-person test on two Windows computers.                                                                                                                                                                  | Their notes in PROGRESS.md.                                               |
| 7   | Stable 1.0 is released.                                                                                                                                                                                                                       | `team/RELEASING.md`, channel stable.                                      |

## Scope rule

Anything new noticed while finishing goes into LATER.md with one line and is not built, unless it breaks a must-have, loses data, or is a security hole.
