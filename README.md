<p align="center">
  <img src="./assets/team/elbo-symbol-transparent.png" width="96" height="96" alt="Elbo logo" />
</p>

<h1 align="center">Elbo</h1>

<p align="center">One app for your AI coding agents, made for working as a team.</p>

<p align="center">
  <a href="https://github.com/MouhssineElBoumshouli/elbo/releases"><strong>Download for Windows</strong></a>
</p>

Elbo runs the AI coding agents you already use, such as Claude Code and Codex, in one simple window. It is made for students and small teams: several people, each with their own AI, working on the same project without getting in each other's way.

## What you get

- **Your own subscriptions.** Elbo does not sell tokens. It drives the agents you are already signed in to.
- **Team memory.** Every agent knows the project's rules, who is working on what, and its own task. A brand new chat can answer questions about the project without hints.
- **No clashes.** Before an agent edits a file, it claims it. If a teammate's agent is already on that file, you are warned first.
- **Handoffs and notes.** Leave a note for a teammate or for future you. Notes say when the files they talk about have changed since.
- **Team home and Today.** See who is working on what, what changed and what needs you.
- **Merge help.** Elbo checks your chats against the main branch and helps when they clash.
- **Simple by default.** Plain words, fewer buttons. Advanced settings are one switch away.

## Install

1. Download the newest `Elbo-…-x64.exe` from [Releases](https://github.com/MouhssineElBoumshouli/elbo/releases).
2. Open it. Windows shows "Windows protected your PC" because Elbo is not code-signed yet. Click **More info**, then **Run anyway**.
3. Elbo installs for your user only (no admin needed). Pick a project folder, connect one AI, and start a chat.

Elbo needs one AI agent that is installed and signed in. For example, install [Claude Code](https://claude.com/product/claude-code) and run `claude auth login`, or install [Codex CLI](https://developers.openai.com/codex/cli) and run `codex login`. Settings → Check my setup shows what is missing.

Updates arrive through the update button in the app. Settings → About → Update track picks Stable or Beta.

More in the [user guide](./docs/user/README.md).

## Privacy

Elbo collects no usage data. It sends nothing about how you use it to us or to anyone else. The AI tools you connect have their own privacy policies.

## For contributors

- How we work: [team/WORKING_RULES.md](./team/WORKING_RULES.md). Progress: [team/PROGRESS.md](./team/PROGRESS.md).
- Releasing: [team/RELEASING.md](./team/RELEASING.md).
- Build from source: [development runbook](./docs/operations/development.md#first-checkout).

## License

[MIT](./LICENSE). The license and the notices of the open source projects Elbo uses are in the app under Settings → About → Open source licenses.
