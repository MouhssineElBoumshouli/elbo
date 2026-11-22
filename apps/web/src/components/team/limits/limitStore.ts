// team-layer: what the "Limit reached" card shares with the rest of the app. A chat that moved to
// another account remembers where it came from, for "Switch back"; the card's buttons are also
// listed in the command palette, so the keyboard reaches them. Kept for this app session only.
import type { ModelSelection } from "@t3tools/contracts";
import { useSyncExternalStore } from "react";

export interface LimitSwitch {
  readonly from: ModelSelection;
  readonly fromName: string;
  readonly toName: string;
  readonly toInstanceId: string;
}

export interface LimitAction {
  readonly id: string;
  readonly label: string;
  readonly run: () => void;
}

const NO_ACTIONS: ReadonlyArray<LimitAction> = [];
const switches = new Map<string, LimitSwitch>();
const actions = new Map<string, ReadonlyArray<LimitAction>>();
const listeners = new Set<() => void>();

const changed = () => {
  for (const listener of listeners) listener();
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const limitStore = {
  recordSwitch(threadKey: string, entry: LimitSwitch) {
    switches.set(threadKey, entry);
    changed();
  },
  clearSwitch(threadKey: string) {
    if (switches.delete(threadKey)) changed();
  },
  setActions(threadKey: string, list: ReadonlyArray<LimitAction>) {
    if (list.length === 0) actions.delete(threadKey);
    else actions.set(threadKey, list);
    changed();
  },
};

export const useLimitSwitch = (threadKey: string | null) =>
  useSyncExternalStore(subscribe, () => (threadKey === null ? undefined : switches.get(threadKey)));

export const useLimitActions = (threadKey: string | null) =>
  useSyncExternalStore(subscribe, () =>
    threadKey === null ? NO_ACTIONS : (actions.get(threadKey) ?? NO_ACTIONS),
  );
