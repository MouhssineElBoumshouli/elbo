# Planning feature: design

Status: design only, nothing built. 2026-11-22. Reviewed; the open questions are decided (section 12).
Worked example: [PLANNING_EXAMPLE_ATTENDANCE.md](PLANNING_EXAMPLE_ATTENDANCE.md). Mockups: `test-screenshots`, `2026-11-22-planning-mockups/`.

## 1. What it is

Before you build something (an app, a website, a research project, a hackathon pitch), Elbo runs a planning session the way a good team would. A small panel of experts asks you questions, drafts a plan, checks each other's work and argues with you where it matters. You get a real plan: what we build and for whom, the stack and why, how the parts fit together, security risks, the look, who does what and in what order, and the risks.

Three promises:

- **You understand all of it.** Every part opens with a short plain summary. "Go deeper" shows the details. Hard words are underlined and explained on hover or tap.
- **Nothing is decided without a reason.** Every decision records the options looked at, why one won, and who decided.
- **It fits the project.** A weekend project gets one page. A semester project gets the full plan.

## 2. The panel

| Expert             | Always?            | Checks (from its checklist, section 6)                                                             |
| ------------------ | ------------------ | -------------------------------------------------------------------------------------------------- |
| Project manager    | yes                | scope, must-haves vs nice-to-haves, deadline with buffer, who does what, order                     |
| Software architect | yes for software   | stack fits the team's skills and the deadline, parts and data, hosting and cost                    |
| Security engineer  | yes for software   | logins, who can see what, secrets, personal data, common mistakes                                  |
| Designer           | when people use it | who uses it, main screens, accessibility, empty and error states                                   |
| AI engineer        | when AI is in it   | is AI needed at all, cost per use, wrong answers, privacy                                          |
| Others by type     | when needed        | research methods and ethics (research), pitch and demo (hackathon), data (ML), app stores (mobile) |

The project manager runs the session and writes the final plan. A panel has 3 to 5 experts. More adds noise and tokens.

### Challenge goes both ways

- An expert who disagrees with an idea (yours, a teammate's or another expert's) says so on the card, with the reason and a better option.
- You can push back on any decision ("We don't know React, why not plain HTML?"). The expert who made it must either **defend** it with reasons that fit your situation or **change** it. Either way it is written down.
- Experts review each other's parts before you see the plan (section 5, step 4). Disagreements they could not settle reach you as a choice, not hidden.
- An expert never wins just by insisting. If you decide against its advice, the decision says so ("Decided by Mouhssine against the security engineer's advice: …") and the risk goes on the risk list.

### Solo and team

- **Solo:** the experts are your team. You answer, you push back, you decide.
- **Team:** everyone sees the plan as it forms, comments and votes on decisions through Notes (section 7). The team picks one decider at the start; the default is the person who started the session. The decider confirms the result.

## 3. Size

After the questions, the project manager proposes a size. You can change it.

| Size   | When                                 | Plan                                                                     | Session                                                                                             |
| ------ | ------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| Small  | a weekend, 1 person, under ~20 hours | one page: goal, must-haves, stack in one line, top 3 risks, a to-do list | 2 experts, no cross-review, about 5 minutes                                                         |
| Medium | a few weeks, 1 to 3 people           | all sections, short; 3 to 6 decisions                                    | 3 to 4 experts, one cross-review round                                                              |
| Large  | a semester or a product, 3+ people   | all sections in full, a schedule by week, 8+ decisions                   | 4 to 5 experts, cross-review; a second opinion is offered (off by default) if two AIs are connected |

## 4. The flow, screen by screen

Pictures 1 to 4 in the mockups folder.

1. **Where it starts.** _New project_ now asks "What are you making?" with two buttons: **Plan it first** (the default for an empty folder) and **Start building** right next to it, one click away. An existing project gets "Plan the next part" in the command palette and on Team home / Today. Agents can offer it too: when you ask a chat to "build me an app for…" in an empty project, the agent suggests planning first (one line, never forced).
2. **Questions** (picture 1). About 10 plain questions, one screen, most with choices to tap. Each has "Not sure, suggest something":
   1. What are you making, in one or two sentences?
   2. Who will use it? (classmates, a teacher, the public, just me…)
   3. What must it do on day one? (up to 5 lines)
   4. What would be nice but can wait?
   5. Deadline, and how many hours a week each person can give?
   6. Who is on the team, and what does each person know? (pre-filled from the team's members; tags like "HTML/CSS", "Python", "never coded")
   7. Budget for hosting and services? (free only / a few euros a month / more)
   8. Any rules from outside? (a teacher requires Java, the school bans cloud storage, personal data…)
   9. Is there AI in it?
   10. How should it feel? (one word or a site you like)

   A last box: "Anything else we should know?" The answers become the **brief** (section 5).

3. **Size check.** "This looks like a medium project: 3 people, 6 weeks. Full plan, short." Change it with one tap.
4. **The panel at work** (no picture). Each expert shows as a row with its state: "Reading the brief", "Writing", "Reviewing the architect's part", "Done". A short live line under each ("Security engineer: checking how students log in"). You can stop at any time. Questions an expert really needs answered appear as a card ("Will teachers use their own phones?"), so the session never guesses on a key fact.
5. **The plan** (picture 2). One page with the sections in section 8. Each section: a 2 to 3 line summary, a "Go deeper" fold, and its decisions as cards. Challenges show on the card: "The security engineer disagrees: …" with the options.
6. **Deciding** (picture 3). On a decision card: **Agree**, **Pick another option**, or **Push back** (a text box). A push-back gets an answer from the expert in the card, defend or change, and the card keeps the whole exchange folded under "How we got here". In a team, the card also shows votes and comments.
7. **Accept.** "Save the plan" shows what will be written (files and tasks) before writing, like "Make this a team project" does. Then Elbo writes the plan files, the decisions, rulebook lines and tasks (section 7).
8. **Afterwards** (picture 4). The plan lives on **Team home** (team) or **Today** (solo) as a "Plan" section: a progress line ("Week 2 of 6 · 7 of 19 tasks done · 1 risk needs you"), the sections, and "Change the plan". The full plan is also a normal file in the repo, so it reads fine on GitHub.

## 5. How the session runs on your own AI

Elbo does not train or host models. Quality comes from the method: a fixed set of steps, real checklists, options fitted to you, and experts reviewing each other. The session runs in **one planning chat** with your own Claude or Codex, the same way a normal chat runs. Elbo sends each step as a turn with that step's role and checklist.

Steps:

1. **Brief.** The answers become a short structured brief (under ~600 tokens): goal, users, must-haves, nice-to-haves, deadline, hours, people and skills, budget, outside rules, AI yes/no, feel. Every later step reads the brief, not the question chat.
2. **Size and panel.** The project manager picks the size and the experts.
3. **Drafts.** Each expert writes its part from the brief and its checklist, with 2 to 3 options for each real choice, each with pros, cons and fit ("fits: Sara knows Python; doesn't fit: needs 3 weeks of learning"). Output is structured (a small schema: summary, details, decisions with options, risks, tasks), so Elbo can show cards and write files, not parse prose.
4. **Cross-review.** Each expert reads the other parts against its own checklist and returns only problems ("The architect picked Firebase; school rules say no cloud storage of student data"). The author fixes it, or it becomes a choice for you. One round for medium, two for large, none for small.
5. **Plan.** The project manager merges everything, orders the tasks and writes the summaries in plain words at the level the brief asked for.
6. **Your turn.** Push-backs go to the expert who owns the decision, with the brief, that decision and your message. It answers defend or change, in the same structured shape.

### One chat or several?

- **Default: one chat, roles per turn.** Each step's prompt starts with the same brief, so the provider's prompt cache covers most of the input. Works the same on every provider, and the whole session is one chat you can open and read.
- **Large projects with Claude:** the drafts in step 3 can run as Claude's own subagents in parallel (faster, same total tokens). Codex runs them one after another in the same chat. The result format is the same.
- **Two AIs connected (Claude and Codex):** the cross-review in step 4 can run on the other AI as a "second opinion". Different models miss different things. It is off by default and offered only for large plans; small and medium never offer it.
- **Only one AI connected:** everything works. The second opinion is just not offered.

### Token cost (estimates, characters / 4, no tokenizer run)

| Size   | Turns    | Input                          | Output     |
| ------ | -------- | ------------------------------ | ---------- |
| Small  | 3 to 4   | 15k to 30k (mostly cached)     | 3k to 6k   |
| Medium | 7 to 10  | 60k to 120k (60 to 70% cached) | 12k to 20k |
| Large  | 12 to 18 | 150k to 300k                   | 30k to 50k |

A push-back costs one turn: about 3k to 5k input, under 1k output.

How we keep it low:

- The brief, not the chat history, goes into every step. Checklists load only for the experts on the panel.
- Experts that are not relevant are not on the panel. Small skips cross-review.
- Cross-review returns problems only, not a rewrite.
- Structured output with length caps per field (summary 3 lines, details 150 words, at most 3 options).
- "Change the plan" re-runs only the expert and sections a change touches.
- The session shows its running cost in the same place a chat does.

## 6. Checklists

Plain Markdown files shipped with Elbo, one per expert, about 15 to 30 lines each, written as questions an expert must answer or mark "not relevant, because…". They are the main source of quality and are easy to improve after each eval run (section 10). Examples:

- **Security engineer:** How do people log in, and can they reset a password safely? Can one user see or change another user's data by changing an id in a link? Where do secrets live (never in the repo, never in the app bundle)? What personal data is stored, who can see it, how long is it kept (GDPR for EU students)? Is every input checked on the server? Are there limits on login attempts and sign-ups? Which dependencies are risky or unmaintained? What happens if the database leaks?
- **Software architect:** Does the team already know this stack? If not, how many hours to learn, and does that fit the deadline? Can it be hosted on the stated budget? What are the main parts and what data moves between them? What breaks first with 10x the users (only for large)? What is the simplest thing that meets the must-haves? Is the code shaped as a functional core and an imperative shell: pure logic in small functions (data in, data out) that can be tested with no database or network, and I/O in a thin outer layer that calls it? Are files kept small (split one before it grows past about 400 lines), with no comments that repeat the code and no second copy of the same logic?
- **Project manager:** Are the must-haves small enough for the hours available, with a 30% buffer? Is there a version that can be shown halfway? Does each task have one owner and one area? Is anyone's work blocked by someone else's for more than a few days?
- **Designer:** Who is the main user and on which device? What are the 3 to 5 main screens? What does an empty, loading and error screen show? Contrast, text size, keyboard use? Does the look match the "feel" answer?
- **AI engineer:** Could this work without AI? What does one use cost, and per month at the expected use? What happens when the AI is wrong? What user data goes to the AI provider? How will we test its answers?

## 7. How it plugs into what Elbo has

- **Decisions → rulebook and shared memory.** Each accepted decision becomes a file in `.team/decisions/` (the format the rulebook already describes), with three new front-matter fields: `options`, `decided_by`, `status` (`active`, or `replaced by NNNN`). Decisions agents must follow (stack, "all data access goes through the API", "no secrets in the repo") also become short lines in `.team/rulebook.md` under "Code rules", within its word limit. So every agent, on every teammate's machine, reads them. `team_memory_search` already ranks decisions high, and `team_plan`'s answer already names decisions on the planned files.
- **The plan file.** `.team/plan.md`: the sections in plain words, linking to the decision files. It goes through normal commits and pull requests, so the team reviews plan changes like code.
- **Tasks → team tasks.** Each plan task becomes a team task (`TeamTask` already has title, owner, paths and status) with an owner picked by skill and availability, and the area's folders as `paths`. Tasks show in the order the plan gave them.
- **Work split by area → fewer clashes.** The architect's parts map to folders (`src/api/`, `src/web/`, `src/auth/`). The project manager gives each person whole areas where it can, so claims rarely overlap. Shared files (the routes list, the database schema) go in the rulebook's "Shared files" list, and the overlap warnings stay quiet there.
- **Teammates comment and vote through Notes.** Each decision card opens a Note thread tied to its decision file. Notes gain two small things: replies, and a vote per member (agree / disagree / needs a talk). Votes are input, not a rule: the decider still decides.
- **Living plan.** "Where we are" on the plan page comes from task status, not from the AI, so it is never stale. **Change the plan** takes a sentence ("Sara left the team", "The teacher now wants a mobile app"), re-runs only the experts and sections that change, and shows the changes before saving. A changed decision gets a new file that replaces the old one, so the history stays. When an agent's work contradicts an active decision (it adds a library the plan ruled out), the turn note says so once, and the user is asked "change the plan or the code?".
- **Teaching.** Underlined terms explain themselves ("API: the part of the app other parts ask for data"). Each decision has "Why this?" and "What we didn't pick". With a "learning" option in the questions, summaries also say what to learn first and link to a starting point.

## 8. The plan's sections

Every section has: summary (2 to 3 lines), Go deeper, decisions, open questions.

1. What we build and for whom
2. Must-haves and later
3. Stack and why
4. How the parts fit together (a simple diagram in text)
5. Data and privacy
6. Security risks and what we do about them
7. The look and the main screens
8. AI (only when relevant)
9. Who does what, and in what order (by week for medium and large)
10. Risks (each: chance, impact, what we do, who watches it)
11. Decisions log (all decisions, with options and who decided)
12. Words used (the glossary)

Small plans use 1, 2, 3 (one line), 10 (top 3) and 9 (a to-do list).

## 9. What it is not

- Not a project management tool: no burndown charts, sprints or time tracking. The plan, tasks and Notes are enough.
- Not a code generator. Building starts after the plan, in normal chats that follow it.
- Not forced. "Start building" is always one tap away, and a plan can be dropped.

## 10. Testing that the plans are good, before building the UI

1. **Headless runner first.** A dev-only command (`elbo plan --brief <file> --out <dir>`) runs the whole method on one provider and writes the plan and decision files. No UI. This is slice 1.

   Every test run (the runner, the eval cases, the baseline, the judge) goes through Elbo's providers on Mouhssine's Claude and Codex subscriptions, the same way a normal chat does. No API keys. So the eval drives a provider session instead of calling a model API like the other evals in `evals/`, and its cost shows up as subscription usage, not a bill.

2. **A new eval, `evals/project-plans/`,** in the shape `evals/README.md` asks for. Cases are briefs: the attendance app, a portfolio website, a hackathon pitch in 24 hours, a research survey project, a club shop, an ML class project, a "weekend" to-do app, a group project where one member knows nothing. Each case names its source.
3. **Checks per case**, graded by a model judge with a fixed rubric, plus a few code checks:
   - the stack uses skills the team has, or the learning time fits the deadline;
   - the must-haves fit the hours with a buffer;
   - every real choice shows 2 to 3 options with fit to this team;
   - every security checklist item is answered or marked not relevant with a reason;
   - every task has one owner and an area;
   - a small project gets one page (word count);
   - summaries pass a plain-words check (sentence length, listed jargon explained).
4. **Planted mistakes.** Briefs with a bad idea in them: passwords stored as plain text, microservices for a 2-week school project, a free tier that cannot hold the data, scraping a site that forbids it. The panel must push back on each one. A plan that accepts it fails.
5. **Push-back test.** A scripted user pushes back twice on one decision: once with a weak reason (the expert must defend with reasons), once with a strong one (the expert must change). Both are checked.
6. **Against the baseline.** The same briefs given to plain Claude and Codex with "make me a project plan". You and the reviewer read pairs blind and pick the better one. Ship the UI only when the method clearly wins on most cases and never loses on the planted mistakes.
7. **Cost.** Every run records tokens per size, checked against section 5's table.

## 11. Order of slices

1. **Method and runner.** Brief schema, the 6 steps, structured outputs, the checklists, the headless runner. No UI.
2. **Eval.** `evals/project-plans/` with the cases and checks above. Tune the checklists until the method beats the baseline.
3. **Files.** `.team/plan.md`, the extended decision files, rulebook lines, team tasks. Written from the runner, shown before writing.
4. **Questions and plan page.** New project → Plan it first, the questions, size check, the panel at work, the plan page (read and accept).
5. **Challenge loop.** Push back, defend or change, "How we got here", pick another option.
6. **Team.** Note replies and votes on decisions, a decider for the session.
7. **Living plan.** Plan section on Team home / Today, "Where we are", "Change the plan", the turn-note check for code against decisions.
8. **Second opinion.** Cross-review on the other connected AI for large plans.

Slices 1 and 2 decide whether the idea works. If the plans are not clearly better than a plain chat, we stop there and change the method, not the screens.

## 12. Decided (2026-11-22)

1. **Start:** "Plan it first" is the default for an empty folder, with "Start building" right next to it, one click away.
2. **Who confirms:** a team picks a decider at the start; the default is the person who started the session.
3. **Second opinion:** off by default, and offered only for large plans.
4. **Testing plans:** runs use Mouhssine's Claude and Codex subscriptions through the providers, like normal chats, not API keys (section 10).

## 13. Changed (2026-11-23): one writer and a review from a different AI

After two blind rounds where the plain chat beat the panel 7 of 7, at about 15 times the tokens, the panel is gone. One provider writes the plan in a plain chat's style. The person's other provider reviews it read-only, with a score out of 10 and problems marked blocker, should or nit. The writer fixes blockers and shoulds or declines one with a reason; both go in the decision log. A new review runs only after a fixed blocker, for at most 3 rounds. With one provider signed in, the same provider reviews in a fresh session and the plan says so. This replaces the panel in sections 2, 4 (step 4), 5 and 6 and decision 3 above. Those sections still describe the panel until the UI slice rewrites them. Code: `apps/server/src/team/planning/`.
