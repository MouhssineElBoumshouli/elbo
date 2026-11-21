// team-layer: Elbo's word list (team/mockups/slice3/README.md, "Plain words"). Simple mode uses
// these; with it off, upstream's words come back (and upstream's tests, which run with it off,
// keep finding them). Words a normal user sees; deep settings and error toasts keep upstream's.
import { readTeamSimpleModeNow, useTeamSimpleMode } from "./simpleMode";

const UPSTREAM = {
  newChat: "New thread",
  newChatIn: "New thread in",
  newChatWithoutProject: "New thread without a project",
  done: "Settled",
  markDone: "Settle thread",
  markDoneShort: "Settle",
  reopen: "Un-settle thread",
  reopenShort: "Un-settle",
  reopening: "Un-settling...",
  missingBaseBranch: "Select a base branch before sending in New worktree mode.",
  findInChat: "Find in current thread",
  copyChat: "Copy thread",
  linkPullRequest: "Link pull request to thread",
  paletteSearch: "Search commands, projects, and threads...",
  paletteChatsGroup: "Threads",
  chatFinished: "Thread completed",
  chatFailed: "Thread failed",
  chatNeedsInput: "Input needed",
  openChat: "Open thread",
  needsYou: "Input",
  notificationsDescription:
    "System alerts when a thread finishes, fails, or needs input or approval. Applies to this device while Elbo is open.",
  terminalTooltip: "Toggle terminal drawer",
  rightPanelTooltip: "Toggle right panel",
};

const ELBO: typeof UPSTREAM = {
  newChat: "New chat",
  newChatIn: "New chat in",
  newChatWithoutProject: "New chat without a project",
  done: "Done",
  markDone: "Mark as done",
  markDoneShort: "Done",
  reopen: "Not done yet",
  reopenShort: "Reopen",
  reopening: "Reopening...",
  missingBaseBranch: "Pick the branch this chat starts from. It's under ⋯ below the message box.",
  findInChat: "Find in this chat",
  copyChat: "Copy chat",
  linkPullRequest: "Link a pull request to this chat",
  paletteSearch: "Search commands, projects, and chats...",
  paletteChatsGroup: "Chats",
  chatFinished: "Chat finished",
  chatFailed: "Chat failed",
  chatNeedsInput: "A chat needs you",
  openChat: "Open chat",
  needsYou: "Needs you",
  notificationsDescription:
    "System alerts when a chat finishes, fails or needs you. Applies to this device while Elbo is open.",
  terminalTooltip: "Show or hide the terminal",
  rightPanelTooltip: "Show or hide files and changes",
};

export type TeamWords = typeof UPSTREAM;

export function useTeamWords(): TeamWords {
  return useTeamSimpleMode() ? ELBO : UPSTREAM;
}

/** For code outside React; does not follow a later switch. */
export const teamWordsNow = (): TeamWords => (readTeamSimpleModeNow() ? ELBO : UPSTREAM);

/** A command palette group label in plain words ("Threads" → "Chats"). */
export function teamGroupLabel(label: string, words: TeamWords): string {
  if (label === "Threads") return words.paletteChatsGroup;
  if (label === "Recent Threads") return `Recent ${words.paletteChatsGroup.toLowerCase()}`;
  return label;
}

/** "Codex · Luna" from the AI's name and the model's short name ("6 Luna"), without its version. */
export function teamPlainModelLabel(aiName: string, modelShortName: string): string {
  const model = modelShortName.replace(/^[\d.]+\s+/, "");
  return model.toLowerCase().startsWith(aiName.toLowerCase()) ? model : `${aiName} · ${model}`;
}
