# Using Elbo

Elbo runs the AI coding agents you already use, such as Claude Code and Codex, in one window. You can use it alone or with a small team on the same project.

## Install

1. Download the newest `Elbo-…-x64.exe` from [Releases](https://github.com/MouhssineElBoumshouli/elbo/releases).
2. Open it. Windows shows **Windows protected your PC**, because Elbo is not code-signed yet. Click **More info**, then **Run anyway**.
3. Elbo installs for your Windows user only. You don't need to be an admin.

You need one AI agent that is installed and signed in. For example, install [Claude Code](https://claude.com/product/claude-code) and run `claude auth login`, or install [Codex CLI](https://developers.openai.com/codex/cli) and run `codex login`. Elbo uses your own subscription; it does not sell tokens.

## First start

Elbo asks for three things:

1. **Pick a project folder.** The folder with your code.
2. **Connect one AI.** One that works is enough. You can add more later.
3. **Start a chat.** Tell the agent what to change, or type `@` to point at a file.

## Check my setup

Open **Setup** in the left rail, or **Settings → Check my setup**. It lists your AI agents and the tools Elbo uses (Git and the GitHub CLI) and says what is missing. Each row has a button that fixes it: **Install**, **Sign in**, **Update** or **Turn on**. After you fix something outside Elbo, click **Check again**.

## Working alone

Every project keeps a memory of its own, even if you never make a team. Your chats know what the others did, leave notes for each other, and warn you before two chats edit the same file. Nothing is added to your project folder. **Today** in the left rail shows what changed and what needs you.

## Working as a team

A team shares one GitHub repository. Everyone needs push access to it and the GitHub CLI signed in (`gh auth login`; Check my setup shows it).

**Make the team (once):**

1. Use a **private** repository. Anyone who can read the repo can read the team's notes, so Elbo refuses public ones.
2. Install the `elbo` command: **Settings → About → elbo command**. Open a new terminal afterwards.
3. In the project folder, run `elbo team init`. It adds a small `.team/` folder. Commit it and push.

**Join a team:** pull the repo and open the project in Elbo. Notes, tasks and claims you made alone in that project carry over.

**What changes once you are a team:**

- **Files are claimed.** Before an agent edits a file, it claims it. If a teammate's chat holds that file, Elbo stops and asks you: go anyway, find another way, or wait for them.
- **Notes and handoffs.** Agents and people leave notes for each other. A note says when the files it talks about have changed since.
- **Team home.** **Team** in the left rail shows who is working on what, open tasks, notes, and what needs you.
- **Merge help.** Elbo checks your chats against the main branch and helps when they clash.

## Updates

When a new version is ready, an **Update** button appears in the app. Click it to download the update, then again to restart and install it. The restart stops running chats, so let them finish first.

**Settings → About → Update track** picks **Stable** or **Beta**. Beta gets new features first and may have more bugs.

## Privacy

Elbo collects no usage data. It sends nothing about how you use it to us or to anyone else. The AI tools you connect have their own privacy policies.
