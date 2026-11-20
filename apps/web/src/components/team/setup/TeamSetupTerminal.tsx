// team-layer: runs one setup command (install, sign in) for the user in a terminal the app opens,
// so nobody types a command. Upstream's welcome page types the command and waits for Enter; this
// presses Enter itself, since the user already chose it with a button.
import { scopeThreadRef } from "@t3tools/client-runtime/environment";
import {
  AuthTerminalOperateScope,
  type EnvironmentId,
  type ProviderInstanceId,
  ThreadId,
} from "@t3tools/contracts";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import { randomUUID } from "../../../lib/utils";
import { serverEnvironment } from "../../../state/server";
import { readEnvironmentScope } from "../../../state/session";
import { terminalEnvironment } from "../../../state/terminal";
import { useThreadRunningTerminalIds } from "../../../state/terminalSessions";
import { useAtomCommand } from "../../../state/use-atom-command";
import { useAtomValue } from "@effect/atom-react";
import { TerminalViewport } from "../../ThreadTerminalDrawer";
import { Button } from "../../ui/button";

const SETUP_THREAD_ID = ThreadId.make("team-setup");

export interface TeamSetupRun {
  /** The row to check again once the command ends. */
  readonly rowId: string;
  readonly label: string;
  readonly command: string;
  readonly providerInstanceId?: ProviderInstanceId | undefined;
}

export function TeamSetupTerminal({
  environmentId,
  run,
  onFinished,
  onClose,
}: {
  readonly environmentId: EnvironmentId;
  readonly run: TeamSetupRun;
  readonly onFinished: () => void;
  readonly onClose: () => void;
}) {
  const serverConfig = useAtomValue(serverEnvironment.configValueAtom(environmentId));
  const openTerminal = useAtomCommand(terminalEnvironment.open, { reportFailure: false });
  const writeTerminal = useAtomCommand(terminalEnvironment.write, { reportFailure: false });
  const closeTerminal = useAtomCommand(terminalEnvironment.close, { reportFailure: false });
  const [terminalId] = useState(() => `team-setup-${randomUUID()}`);
  const [state, setState] = useState<"starting" | "running" | "failed">("starting");
  const running = useThreadRunningTerminalIds({
    environmentId,
    threadId: SETUP_THREAD_ID,
  }).includes(terminalId);
  const startedRef = useRef(false);
  const finished = useEffectEvent(onFinished);
  const cwd = serverConfig?.cwd ?? null;

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- the shell stays open after the command, so its command ending is the only sign to check again
  useEffect(() => {
    if (running) startedRef.current = true;
    else if (startedRef.current) {
      startedRef.current = false;
      finished();
    }
  }, [running]);

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- opens the PTY, starts the command and closes the PTY on unmount
  useEffect(() => {
    if (cwd === null) return;
    let cancelled = false;
    void (async () => {
      if (!readEnvironmentScope(environmentId, AuthTerminalOperateScope)) {
        setState("failed");
        return;
      }
      const opened = await openTerminal({
        environmentId,
        input: {
          threadId: SETUP_THREAD_ID,
          terminalId,
          cwd,
          ...(run.providerInstanceId ? { providerInstanceId: run.providerInstanceId } : {}),
        },
      });
      if (cancelled) return;
      if (opened._tag !== "Success") {
        setState("failed");
        return;
      }
      const wrote = await writeTerminal({
        environmentId,
        input: { threadId: SETUP_THREAD_ID, terminalId, data: `${run.command}\r` },
      });
      if (!cancelled) setState(wrote._tag === "Success" ? "running" : "failed");
    })();
    return () => {
      cancelled = true;
      void closeTerminal({
        environmentId,
        input: { threadId: SETUP_THREAD_ID, terminalId, deleteHistory: true },
      });
    };
  }, [closeTerminal, cwd, environmentId, openTerminal, run, terminalId, writeTerminal]);

  return (
    <div
      data-thread-terminal-drawer
      className="mt-3 overflow-hidden rounded-lg border border-border/70 bg-background"
    >
      <div className="flex items-center justify-between border-b border-border/60 px-3 py-1.5">
        <span className="text-2xs text-muted-foreground">
          {state === "failed"
            ? "Could not open the terminal for this step."
            : `${run.label}. A browser window may open; approve there and this updates by itself.`}
        </span>
        <Button size="xs" variant="ghost-muted" onClick={onClose}>
          Close
        </Button>
      </div>
      <div className="h-56">
        {state === "running" && cwd !== null ? (
          <TerminalViewport
            threadRef={scopeThreadRef(environmentId, SETUP_THREAD_ID)}
            threadId={SETUP_THREAD_ID}
            terminalId={terminalId}
            terminalLabel={run.label}
            cwd={cwd}
            {...(run.providerInstanceId ? { providerInstanceId: run.providerInstanceId } : {})}
            advancedTypography={false}
            onSessionExited={onClose}
            autoFocus
            visible
            keybindings={serverConfig?.keybindings ?? []}
          />
        ) : null}
      </div>
    </div>
  );
}
