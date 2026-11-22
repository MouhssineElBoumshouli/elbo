// team-layer: sorts a failed Codex or Claude turn into "limit reached", "subscription not active" or
// "other", for the chat's "Limit reached" card. The adapters only pass the failure through; this
// reads what they pass (class, code, message, reset time).
import { CHATGPT_USAGE_LIMIT_CODE, CHATGPT_WORKSPACE_USAGE_LIMIT_CODE } from "./usageLimits.ts";

export interface TurnFailure {
  /** The adapter's failure class, e.g. "usage_limit" or "provider_error". */
  readonly class: string | null;
  readonly code: string | null;
  readonly message: string | null;
  /** ISO time the adapter found for the limit's reset. */
  readonly resetAt: string | null;
}

export type FailureKind =
  | {
      readonly kind: "limit";
      readonly resetAt: string | null;
      /** The reset as the provider wrote it ("11:44 PM", "in 2h") when no exact time came with it. */
      readonly resetText: string | null;
    }
  | { readonly kind: "subscription" }
  | { readonly kind: "other" };

// Checked before limits: Claude reports an ended trial as a 429 rate-limit error.
const SUBSCRIPTION_CODES = new Set(["subscription_sharing_user_not_eligible", "billing_error"]);
const SUBSCRIPTION_TEXT = [
  /\bsubscription\b[^.]*\b(past due|expired|ended|cancel+ed|inactive|not active|disabled)\b/i,
  /\boverdue invoice\b/i,
  /\btrial has ended\b/i,
  /\b(Pro|Max|paid plan)\b[^.]*\brequired\b/i,
  /\bdoes not have access to Claude Code\b/i,
  /\bplan (does not|doesn't) include\b/i,
  /\bcredit balance is too low\b/i,
];

const LIMIT_CODES = new Set([
  CHATGPT_USAGE_LIMIT_CODE,
  CHATGPT_WORKSPACE_USAGE_LIMIT_CODE,
  "usageLimitExceeded",
  "rateLimitExceeded",
]);
const LIMIT_TEXT =
  /\b(hit your (usage )?limit|usage limit (reached|exceeded)|reached (their|your)[^.]*usage limit|limit reached)\b/i;

const RESET_TEXT = [/\btry again at ([^.]+?)\.?$/im, /\bresets (in [\w ]+?|at [^.]+?)\.?$/im];

function resetText(message: string): string | null {
  for (const pattern of RESET_TEXT) {
    const found = message.match(pattern)?.[1]?.trim();
    if (found) return found.replace(/^at /i, "");
  }
  return null;
}

export function classifyTurnFailure(failure: TurnFailure): FailureKind {
  const message = failure.message ?? "";
  if (
    (failure.code !== null && SUBSCRIPTION_CODES.has(failure.code)) ||
    SUBSCRIPTION_TEXT.some((pattern) => pattern.test(message))
  ) {
    return { kind: "subscription" };
  }
  if (
    failure.class === "usage_limit" ||
    (failure.code !== null && LIMIT_CODES.has(failure.code)) ||
    LIMIT_TEXT.test(message)
  ) {
    return {
      kind: "limit",
      resetAt: failure.resetAt,
      resetText: failure.resetAt === null ? resetText(message) : null,
    };
  }
  return { kind: "other" };
}
