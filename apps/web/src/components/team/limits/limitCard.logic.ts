// team-layer: the "Limit reached" card's choices and words. Pure, so the rules have tests.
import { isProviderAvailable, type ModelSelection, type ServerProvider } from "@t3tools/contracts";
import type { FailureKind } from "@t3tools/shared/limitFailure";
import { exhaustedUsageWindow } from "@t3tools/shared/usageLimits";

import { getDefaultProviderInstanceModel } from "../../../providerInstances";

const AI_NAMES: Readonly<Record<string, string>> = { codex: "ChatGPT", claudeAgent: "Claude" };
/** The AIs the card can move a chat between. */
const SWITCHABLE = ["codex", "claudeAgent"] as const;

export const aiName = (driver: string) => AI_NAMES[driver] ?? driver;

/** The account's own name (its email, usually); null when the provider does not say. */
function knownAccount(provider: ServerProvider): string | null {
  const named = provider.displayName !== aiName(provider.driver) ? provider.displayName : undefined;
  return provider.auth.email ?? provider.auth.label ?? named ?? null;
}

export const accountName = (provider: ServerProvider) =>
  knownAccount(provider) ?? aiName(provider.driver);

export interface ContinueChoice {
  readonly id: "account" | "ai";
  /** The account's email for another account, the AI's name for the other AI. */
  readonly name: string;
  readonly label: string;
  readonly selection: ModelSelection;
}

const ready = (provider: ServerProvider, now: number) =>
  provider.enabled &&
  provider.installed &&
  isProviderAvailable(provider) &&
  provider.auth.status === "authenticated" &&
  provider.status !== "error" &&
  exhaustedUsageWindow(provider, now) === undefined;

function selectionFor(
  providers: ReadonlyArray<ServerProvider>,
  provider: ServerProvider,
  keepModel: string | null,
): ModelSelection | null {
  if (keepModel !== null && provider.models.some((model) => model.slug === keepModel)) {
    return { instanceId: provider.instanceId, model: keepModel };
  }
  const model = getDefaultProviderInstanceModel(providers, provider.instanceId);
  return model === undefined ? null : { instanceId: provider.instanceId, model };
}

/**
 * What the card offers: another signed-in account of the same AI (same model when it has it),
 * then the other AI. Accounts that are out of usage themselves are left out.
 */
export function continueChoices(
  providers: ReadonlyArray<ServerProvider>,
  current: ModelSelection,
  now: number,
): ReadonlyArray<ContinueChoice> {
  const driver = providers.find((provider) => provider.instanceId === current.instanceId)?.driver;
  if (driver === undefined) return [];
  const sameAi = providers.find(
    (provider) =>
      provider.driver === driver &&
      provider.instanceId !== current.instanceId &&
      ready(provider, now),
  );
  const otherDriver = SWITCHABLE.find((candidate) => candidate !== driver);
  const otherAi =
    SWITCHABLE.includes(driver as (typeof SWITCHABLE)[number]) && otherDriver !== undefined
      ? providers.find((provider) => provider.driver === otherDriver && ready(provider, now))
      : undefined;
  const choices: ContinueChoice[] = [];
  const account = sameAi ? selectionFor(providers, sameAi, current.model) : null;
  if (sameAi && account) {
    const name = accountName(sameAi);
    choices.push({ id: "account", name, label: `Continue with ${name}`, selection: account });
  }
  const ai = otherAi ? selectionFor(providers, otherAi, null) : null;
  if (otherAi && ai) {
    const name = aiName(otherAi.driver);
    choices.push({ id: "ai", name, label: `Continue with ${name}`, selection: ai });
  }
  return choices;
}

/** "at 11:44 PM", "tomorrow at 9:00 AM", "in 2h": how the card says when the limit resets. */
export function resetPhrase(formatted: string | null, providerText: string | null): string | null {
  if (formatted) return /^(tomorrow|in )/i.test(formatted) ? formatted : `at ${formatted}`;
  if (providerText) return /^in /i.test(providerText) ? providerText : `at ${providerText}`;
  return null;
}

export function limitCardWords(
  kind: Exclude<FailureKind["kind"], "other">,
  provider: ServerProvider | undefined,
  reset: string | null,
  /** Names the AI when the account's provider is not known. */
  driver: string = provider?.driver ?? "",
): { readonly title: string; readonly description: string } {
  const ai = aiName(driver);
  const known = provider ? knownAccount(provider) : null;
  const account = known ? ` ${known}` : "";
  if (kind === "subscription") {
    return {
      title: `${ai} subscription not active`,
      description: `Your ${ai} account${account} has no active subscription, so it can't run this chat.`,
    };
  }
  return {
    title: `${ai} usage limit reached`,
    description: `Your ${ai} account${account} reached its usage limit.${reset ? ` It resets ${reset}.` : ""}`,
  };
}
