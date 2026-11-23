# Planning feature: design

Status: method, eval, saving and the first screens built (slices 1 to 4). Rewritten 2026-11-23 for "one writer and a review from a different AI", which replaced the expert panel after two blind rounds where a plain chat beat it 7 of 7 at about 15 times the tokens.
Worked example: [PLANNING_EXAMPLE_ATTENDANCE.md](PLANNING_EXAMPLE_ATTENDANCE.md). Mockups: `test-screenshots`, `2026-11-22-planning-mockups/` (drawn for the panel; the screens still apply, minus the panel rows). Code: `apps/server/src/team/planning/`.

## 1. What it is

Before you build something (an app, a website, a research project, a hackathon pitch), Elbo helps you plan it. One AI writes the plan the way a good chat answer would; a different AI checks it, the way a second pair of eyes would. You get a short plan you can follow: what we build, the steps by day or week with who does what, how you know each must-have is done, what to cut first, and where your idea needs to change.

Three promises:

- **You understand all of it.** Plain words, short sections, no jargon without an explanation.
- **Nothing is decided without a reason.** Every decision records the options looked at and why one won. Every review point records what the writer did with it.
- **It fits the project.** A weekend project gets one page. A semester project gets more, never padding.

## 2. Writer and reviewer

- **The writer** is one of your connected AIs (Codex by default). It writes the whole plan in one turn: the text you read, plus the same plan as data for the app (decisions, tasks with one owner each, done checks, push-backs, cut-first list).
- **The reviewer** is your other AI (Claude when Codex writes, and the other way round), on its strongest model at high effort; a review costs about 6k tokens. It reads the brief and the plan, read-only, and returns a score out of 10 and problems marked **blocker** (the plan fails the brief or harms someone), **should** (a real problem the team will hit) or **nit** (everything else). It must not grow the plan: asking for more is a nit at most.
- **Only one AI connected:** the same AI reviews in a fresh session, and the plan says so.

Different models miss different things; one model playing several experts shares the same blind spots.

### Challenge goes both ways

- The writer pushes back on bad ideas in the brief (plain-text passwords, microservices for a 2-week project), with the problem and a better option.
- You can push back on any decision ("We don't know React, why not plain HTML?"). The writer must **defend** it with reasons that fit your situation or **change** it. Either way it is written down.
- The writer may decline a review point with a reason. The decision log keeps the point, the outcome and the reason.
- If you decide against the advice, the decision says so and the risk stays in the plan.

### Solo and team

- **Solo:** you answer, you push back, you decide.
- **Team:** everyone sees the plan, comments and votes on decisions through Notes (section 7). The team picks one decider; the default is the person who started the plan.

## 3. Size

Elbo picks a size from the brief (people, hours, deadline). You can change it.

| Size   | When                                 | Limits                     |
| ------ | ------------------------------------ | -------------------------- |
| Small  | a weekend, 1 person, under ~20 hours | ~500 words, 2 decisions    |
| Medium | a few weeks, 1 to 3 people           | ~1,500 words, 6 decisions  |
| Large  | a semester or a product, 3+ people   | ~3,000 words, 10 decisions |

Code enforces the limits: decisions past the limit become one-line "smaller choices", and an over-long plan goes back to the writer as a "should" to fix.

## 4. The flow, screen by screen

1. **Where it starts.** _New project_ asks "What are you making?" with **Plan it first** (the default for an empty folder) and **Start building** right next to it. An existing project gets "Plan the next part" in the command palette and on Team home / Today. An agent asked to "build me an app for…" in an empty project suggests planning first (one line, never forced).
2. **Questions.** About 10 plain questions on one screen, most with choices to tap, each with "Not sure, suggest something": what you are making, who uses it, must-haves (up to 5), nice-to-haves, deadline and hours, who is on the team and what each knows, budget, outside rules, AI in it, how it should feel, and "Anything else?". The answers become the **brief**.
3. **Size check.** "This looks like a medium project: 3 people, 6 weeks." Change it with one tap.
4. **Writing and review** (a short progress line, no panel): "Codex is writing the plan", "Claude is reviewing it", "Codex is fixing 2 points". You can stop at any time.
5. **The plan.** One page in the writer's plain layout, the decisions as a short list at the end, and the review's score with what changed.
6. **Deciding.** On a decision: **Agree**, **Pick another option**, or **Push back**. A push-back gets the writer's answer, defend or change, kept under "How we got here".
7. **Accept.** "Save the plan" shows what will be written (files and tasks) before writing (section 7).
8. **Afterwards.** The plan lives on **Team home** (team) or **Today** (solo): a progress line, the plan, and "Change the plan". The plan is also a normal file in the repo.

## 5. How it runs on your own AI

Elbo does not train or host models. The plan runs on your own Claude and Codex logins, like normal chats; never API keys.

1. **Brief.** The answers as short plain lines (under ~600 tokens). Every turn reads the brief, not the question chat.
2. **Write.** One turn on the writer.
3. **Review.** One turn on the reviewer, read-only, with the brief, the plan and its task list.
4. **Fix.** The writer fixes blockers and shoulds or declines one with a reason; code adds its own shoulds (over the word limit, lines about the planning instead of the project). Nits are kept, not acted on.
5. **Again only if needed.** A new review runs only after a fixed blocker, and checks only the open points and what changed. At most 3 rounds; it stops when only nits are left.
6. **Your turn.** Push-backs go to the writer with the brief, the decision and your message.

The steps are pure code with the model turn injected, so the rules are tested without a provider (`planMethod.ts`, `planReview.ts`).

### Token cost (measured)

From eval round 3b (`test-screenshots`, `2026-11-23-plan-eval-3b/answers/REPORT.md`), Codex writing and Claude Opus 5.5 reviewing at high effort:

| Case                                 | Turns  | Input        | Output      |
| ------------------------------------ | ------ | ------------ | ----------- |
| No fix needed (hackathon, medium)    | 2      | ~23k         | ~6k         |
| With a fix (medium)                  | 3 to 4 | ~95k to 110k | ~12k to 16k |
| Small, with a fix and a shorten turn | 4      | ~94k         | ~7k         |

Each Codex turn carries about 13k tokens of Codex's own instructions, and each fix re-sends the plan and brief, so fix and shorten turns are most of the cost. A Claude review is 6k to 9k input. A push-back is one writer turn.

## 6. What the reviewer checks

No checklist files: the review prompt asks for what would really hurt the team. An unsafe idea the plan accepts; a schedule or hours that cannot fit; a must-have with no path to done; a choice the team cannot build with their skills, budget or outside rules; a bad idea in the brief the plan does not push back on. Fixes that cut are preferred over fixes that add.

## 7. How it plugs into what Elbo has

- **Decisions → rulebook and shared memory.** Each accepted decision becomes a file in `.team/decisions/` (the rulebook's format) with `options`, `decided_by` and `status` (`active`, or `replaced by NNNN`). Decisions agents must follow (stack, "no secrets in the repo") also become short lines in `.team/rulebook.md` under "Code rules".
- **The plan file.** `.team/plan.md`, reviewed through normal commits and pull requests.
- **Tasks → team tasks.** Each plan task becomes a team task with its owner and area as `paths`, in the plan's order.
- **Work split by area → fewer clashes.** Each person gets whole areas where possible, so claims rarely overlap.
- **Teammates comment and vote through Notes.** Each decision opens a Note thread; Notes gain replies and a vote per member. Votes are input; the decider decides.
- **Living plan.** "Where we are" comes from task status, never from the AI. **Change the plan** takes a sentence ("Sara left the team"), rewrites only what changes and shows it before saving. When an agent's work contradicts an active decision, the turn note says so once.

## 8. What it is not

- Not a project management tool: no burndown charts, sprints or time tracking.
- Not a code generator. Building starts after the plan, in normal chats that follow it.
- Not forced. "Start building" is always one tap away, and a plan can be dropped.

## 9. Testing that the plans are good, before building the UI

- **Headless runner:** `node apps/server/scripts/team-plan.ts --brief <file> --out <dir>` writes `plan.md`, `decision-log.md`, `plan.json` and tokens per provider. Push-back: `--push-back 0002 --message "…"`.
- **Eval:** `evals/project-plans/`. Four briefs (attendance app, weekend to-do, 24-hour hackathon, planted mistakes), each run through writer + review and as a plain chat on the writer's model. Both sides are written in one heading style and saved as blind A/B pairs; people pick, not a model judge.
- **Code checks:** word and decision limits, one owner and an area per task, no lines about the planning itself, and every planted mistake pushed back on (plain-text passwords, microservices for a 2-week project, photos that do not fit a free database).
- Ship the UI only when writer + review clearly wins on most cases and never loses on the planted mistakes.

## 10. Order of slices

1. **Method and runner.** Done.
2. **Eval.** Done; run after each method change.
3. **Files.** Done: `.team/plan.md`, decision files, rulebook lines, team tasks, previewed before writing. Agents use `team_save_plan`; the runner takes `--save-to <folder> [--dry-run]`. Saving again changes nothing; a changed decision gets a new file and the old one says "replaced by NNNN".
4. **Questions and plan page.** Done: New project offers "Plan it first", Ctrl+K "Plan the next part", the questions, size check, a progress line with Stop, the plan page with the review, and saving after a preview. The writer and reviewer follow the connected AIs.
5. **Challenge loop.** Push back, defend or change, "How we got here", pick another option.
6. **Team.** Note replies and votes, a decider.
7. **Living plan.** Plan section on Team home / Today, "Change the plan", the turn-note check.

If writer + review is not clearly better than a plain chat, we change the method, not the screens.

## 11. Decided

1. **Start:** "Plan it first" is the default for an empty folder, with "Start building" one click away. (2026-11-22)
2. **Who confirms:** a team picks a decider; the default is the person who started the plan. (2026-11-22)
3. **Review:** always by a different AI when two are connected, on its strongest model at high effort; the same AI in a fresh session otherwise. (2026-11-23, replaces "second opinion off by default")
4. **Testing plans:** runs use Mouhssine's Claude and Codex subscriptions through the providers, like normal chats, not API keys. (2026-11-22)
