// team-layer: Elbo's word list (team/mockups/slice3/README.md, "Plain words"). Simple mode uses
// these; with it off, upstream's words come back (and upstream's tests, which run with it off,
// keep finding them). Only words on the main screens; menus and error toasts keep upstream's.
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
};

export type TeamWords = typeof UPSTREAM;

export function useTeamWords(): TeamWords {
  return useTeamSimpleMode() ? ELBO : UPSTREAM;
}

/** For code outside React; does not follow a later switch. */
export const teamWordsNow = (): TeamWords => (readTeamSimpleModeNow() ? ELBO : UPSTREAM);
