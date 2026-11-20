// team-layer: Claude's account check fails, instead of reporting "signed out", when a stored
// sign-in has expired; `claude auth status` still says loggedIn: true then. Claude's own error
// text names the cause, so read it.
const SIGNED_OUT_TEXT =
  /session has expired|sign in again|please run \/login|claude auth login|not logged in/iu;

export const CLAUDE_SIGNED_OUT_MESSAGE =
  "Claude is signed out on this computer. Sign in again to use Claude here.";

/** True when a failed account check says the user must sign in again. */
export function isClaudeSignedOutFailure(cause: unknown): boolean {
  const text = cause instanceof Error ? cause.message : typeof cause === "string" ? cause : "";
  return SIGNED_OUT_TEXT.test(text);
}
