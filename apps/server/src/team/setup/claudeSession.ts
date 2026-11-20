// team-layer: Claude's account check fails, instead of reporting "signed out", when a stored
// sign-in has expired; `claude auth status` still says loggedIn: true then. Claude's own error
// text names the cause, so read it.
const SIGNED_OUT_TEXT =
  /session has expired|sign in again|please run \/login|claude auth login|not logged in/iu;

export { TEAM_CLAUDE_SIGNED_OUT_MESSAGE as CLAUDE_SIGNED_OUT_MESSAGE } from "@t3tools/shared/teamSetupRows";

/** True when a failed account check says the user must sign in again. */
export function isClaudeSignedOutFailure(cause: unknown): boolean {
  const text = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";
  return SIGNED_OUT_TEXT.test(text);
}
