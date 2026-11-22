// team-layer: the "Limit reached" card. When a chat's AI account runs out (or its subscription is not
// active), it says so in plain words and offers to continue with another account or the other AI,
// or to wait. Nothing switches unless the person clicks; there is no automatic switching. After a
// switch, a small card offers to switch back.
import {
  type EnvironmentId,
  type OrchestrationV2LimitRecovery,
  type OrchestrationV2LimitRecoveryUpdate,
  type OrchestrationV2ThreadProjection,
  type RunId,
  type RuntimeMode,
  type ScopedThreadRef,
  type ServerProvider,
} from "@t3tools/contracts";
import { type TimestampFormat } from "@t3tools/contracts/settings";
import { classifyTurnFailure } from "@t3tools/shared/limitFailure";
import { latestExecutedRun } from "@t3tools/shared/orchestrationV2ThreadError";
import {
  CHATGPT_USAGE_LIMIT_CODE,
  CHATGPT_WORKSPACE_USAGE_LIMIT_CODE,
} from "@t3tools/shared/usageLimits";
import { squashAtomCommandFailure } from "@t3tools/client-runtime/state/runtime";
import { ArrowLeftRightIcon, CreditCardIcon, GaugeIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useComposerDraftStore } from "../../../composerDraftStore";
import { newMessageId } from "../../../lib/utils";
import { threadEnvironment } from "../../../state/threads";
import { useOrchestrationCommand } from "../../../state/use-orchestration-command";
import { formatUpcomingTimestamp } from "../../../timestampFormat";
import { useDeadlinePassed } from "../../../hooks/useDeadline";
import { useNowMinute } from "../../../hooks/useNowMinute";
import { DEFAULT_INTERACTION_MODE } from "../../../types";
import type { ComposerBannerStackItem } from "../../chat/ComposerBannerStack";
import { copyAdminRequest } from "../../chat/ThreadErrorBanner";
import { OpenAI } from "../../Icons";
import { ChatGptUsageButton } from "../../settings/ChatGptUsageButton";
import { InlineButton } from "../../ui/button";
import { toastManager } from "../../ui/toast";
import {
  accountName,
  aiName,
  continueChoices,
  type ContinueChoice,
  limitCardWords,
  resetPhrase,
} from "./limitCard.logic";
import { limitStore, useLimitSwitch } from "./limitStore";

interface LimitCardInput {
  readonly environmentId: EnvironmentId;
  readonly threadRef: ScopedThreadRef | null;
  readonly threadKey: string | null;
  readonly projection: Pick<OrchestrationV2ThreadProjection, "runs" | "messages"> | null;
  readonly runtime: {
    readonly status: string;
    readonly lastError: string | null;
    readonly lastErrorClass?: string | null;
    readonly lastErrorCode?: string | null;
    readonly usageLimitResetAt?: string | null;
  } | null;
  /** Set when the server will take a manual continuation of the failed run (a usage limit). */
  readonly resumableRunId: RunId | null;
  readonly providers: ReadonlyArray<ServerProvider>;
  readonly recovery: OrchestrationV2LimitRecovery | null;
  readonly settled: boolean;
  readonly requestPending: boolean;
  readonly timestampFormat: TimestampFormat;
  readonly runtimeMode: RuntimeMode;
  readonly onRecoveryChange: (recovery: OrchestrationV2LimitRecoveryUpdate) => Promise<void>;
}

/** The card to show in the composer's banner stack, and whether it replaces the raw error. */
export function useLimitCard(input: LimitCardInput): {
  readonly item: ComposerBannerStackItem | null;
  readonly hidesError: boolean;
} {
  const { threadKey, threadRef, runtime, projection, providers } = input;
  const startThreadTurn = useOrchestrationCommand(threadEnvironment.startTurn, {
    reportFailure: false,
  });
  const [busy, setBusy] = useState(false);
  const nowMinute = useNowMinute();
  const switched = useLimitSwitch(threadKey);
  const run = projection === null ? null : latestExecutedRun(projection.runs);
  const failure =
    runtime?.status === "failed" && run?.status === "failed"
      ? classifyTurnFailure({
          class: runtime.lastErrorClass ?? null,
          code: runtime.lastErrorCode ?? null,
          message: runtime.lastError,
          resetAt: runtime.usageLimitResetAt ?? null,
        })
      : { kind: "other" as const };
  const provider = providers.find((entry) => entry.instanceId === run?.providerInstanceId);
  const choices =
    failure.kind === "other" || run === null
      ? []
      : continueChoices(providers, run.modelSelection, Date.parse(nowMinute));

  const resetAt = failure.kind === "limit" ? failure.resetAt : null;
  const resetPassed = useDeadlinePassed(resetAt === null ? null : Date.parse(resetAt));
  const canWait =
    failure.kind === "limit" &&
    input.resumableRunId !== null &&
    resetAt !== null &&
    !resetPassed &&
    !input.settled &&
    !input.requestPending;
  const waiting =
    canWait &&
    input.recovery?.runId === input.resumableRunId &&
    input.recovery.resetAt === resetAt &&
    input.recovery.autoResume;

  const continueWith = async (choice: ContinueChoice) => {
    if (busy || threadRef === null || threadKey === null || run === null) return;
    setBusy(true);
    useComposerDraftStore.getState().setModelSelection(threadRef, choice.selection, {
      explicit: true,
    });
    const text = projection?.messages.find((message) => message.id === run.userMessageId)?.text;
    const result = await startThreadTurn({
      environmentId: input.environmentId,
      input: {
        threadId: threadRef.threadId,
        // A usage limit continues the failed run (its message again if the AI never got it);
        // anything else resends the last message.
        ...(input.resumableRunId === null
          ? {}
          : { manualContinuationOfRunId: input.resumableRunId }),
        modelSelection: choice.selection,
        message: {
          messageId: newMessageId(),
          role: "user",
          text: input.resumableRunId === null ? (text ?? "") : "",
          attachments: [],
        },
        runtimeMode: input.runtimeMode,
        interactionMode: DEFAULT_INTERACTION_MODE,
        dispatchMode: "start",
      },
    });
    setBusy(false);
    if (result._tag === "Failure") {
      const error = squashAtomCommandFailure(result);
      toastManager.add({
        type: "error",
        title: "Could not continue",
        description: error instanceof Error ? error.message : "Try again.",
      });
      return;
    }
    limitStore.recordSwitch(threadKey, {
      from: run.modelSelection,
      // Names that tell the two apart: the emails of two accounts, or the names of two AIs.
      fromName:
        choice.id === "ai"
          ? aiName(provider?.driver ?? "")
          : provider
            ? accountName(provider)
            : "the first account",
      toName: choice.name,
      toInstanceId: choice.selection.instanceId,
    });
  };

  const toggleWait = async () => {
    if (!canWait || input.resumableRunId === null || resetAt === null) return;
    setBusy(true);
    await input
      .onRecoveryChange({ runId: input.resumableRunId, resetAt, autoResume: !waiting })
      .catch((cause: unknown) =>
        toastManager.add({
          type: "error",
          title: "Could not change waiting",
          description: cause instanceof Error ? cause.message : "Try again.",
        }),
      );
    setBusy(false);
  };

  const switchBack = () => {
    if (threadRef === null || threadKey === null || switched === undefined) return;
    useComposerDraftStore.getState().setModelSelection(threadRef, switched.from, {
      explicit: true,
    });
    limitStore.clearSwitch(threadKey);
    toastManager.add({
      type: "success",
      title: `Switched back to ${switched.fromName}`,
      description: "Your next message goes there.",
    });
  };

  const showsSwitchBack =
    failure.kind === "other" &&
    switched !== undefined &&
    run?.providerInstanceId === switched.toInstanceId;

  const handlers: Record<string, () => void> = {};
  const listed: { id: string; label: string }[] = [];
  if (failure.kind !== "other") {
    for (const choice of choices) {
      handlers[choice.id] = () => void continueWith(choice);
      listed.push({ id: choice.id, label: choice.label });
    }
    if (canWait) {
      handlers.wait = () => void toggleWait();
      listed.push({ id: "wait", label: waiting ? "Stop waiting" : "Wait" });
    }
  } else if (showsSwitchBack) {
    handlers.back = switchBack;
    listed.push({ id: "back", label: `Switch back to ${switched.fromName}` });
  }

  // The palette runs the newest handlers, while the store only changes when the labels do.
  const latestHandlers = useRef(handlers);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- keeps the palette's handlers current after every render
  useEffect(() => {
    latestHandlers.current = handlers;
  });
  const listedKey = JSON.stringify(listed);
  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- publishes this card's buttons to the command palette store, outside React
  useEffect(() => {
    if (threadKey === null) return;
    const entries = JSON.parse(listedKey) as ReadonlyArray<{ id: string; label: string }>;
    limitStore.setActions(
      threadKey,
      entries.map((entry) => ({ ...entry, run: () => latestHandlers.current[entry.id]?.() })),
    );
    return () => limitStore.setActions(threadKey, []);
  }, [threadKey, listedKey, latestHandlers]);

  const buttons = listed.map((entry) => (
    <InlineButton
      key={entry.id}
      touchTarget="padded"
      disabled={busy}
      onClick={() => handlers[entry.id]?.()}
    >
      {entry.label}
    </InlineButton>
  ));

  if (showsSwitchBack) {
    return {
      hidesError: false,
      item: {
        id: `limit-switch-back:${switched.toInstanceId}`,
        variant: "info",
        group: "environment",
        icon: <ArrowLeftRightIcon />,
        title: `This chat now uses ${switched.toName}`,
        children: (
          <p className="text-sm text-muted-foreground">
            {switched.fromName} reached its limit. Switch back whenever you like.
          </p>
        ),
        actions: <span className="flex flex-wrap items-center gap-x-3 px-1">{buttons}</span>,
        dismissLabel: "Keep this account",
        onDismiss: () => threadKey !== null && limitStore.clearSwitch(threadKey),
      },
    };
  }
  if (failure.kind === "other" || run === null) return { item: null, hidesError: false };

  const formatted = resetAt ? formatUpcomingTimestamp(resetAt, input.timestampFormat) : null;
  const words = limitCardWords(
    failure.kind,
    provider,
    failure.kind === "limit" ? resetPhrase(formatted, failure.resetText) : null,
  );
  const workspaceLimit = runtime?.lastErrorCode === CHATGPT_WORKSPACE_USAGE_LIMIT_CODE;
  const chatGptLimit = workspaceLimit || runtime?.lastErrorCode === CHATGPT_USAGE_LIMIT_CODE;
  return {
    hidesError: true,
    item: {
      id: `limit-card:${run.id}`,
      variant: "warning",
      group: "environment",
      icon:
        provider?.driver === "codex" ? (
          <OpenAI aria-hidden="true" />
        ) : failure.kind === "subscription" ? (
          <CreditCardIcon />
        ) : (
          <GaugeIcon />
        ),
      title: words.title,
      // Below the title, where it wraps: a one-line description would cut off the reset time.
      children: (
        <p className="text-sm text-muted-foreground">
          {workspaceLimit
            ? "You've reached your workspace's limit for using your ChatGPT plan in other apps."
            : words.description}
        </p>
      ),
      actions: (
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 px-1">
          {buttons}
          {/* OpenAI's partner guidelines ask for these on the ChatGPT notice. */}
          {workspaceLimit ? (
            <InlineButton touchTarget="padded" onClick={copyAdminRequest}>
              Copy request for admin
            </InlineButton>
          ) : chatGptLimit ? (
            <ChatGptUsageButton size="xs" variant="ghost" />
          ) : null}
        </span>
      ),
    },
  };
}
