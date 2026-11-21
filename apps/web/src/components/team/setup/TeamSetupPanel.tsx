// team-layer: "Check my setup" (team/WINDOWS_RELEASE_PLAN.md section 4a). One row per provider and
// tool, in plain words, with one button for the next step. Install and sign-in run for the user in
// an app terminal; the row turns green by itself once the provider is checked again.
import { useAtomValue } from "@effect/atom-react";
import {
  AuthProvidersManageScope,
  AuthTerminalOperateScope,
  type EnvironmentId,
  type TeamSetupFacts,
} from "@t3tools/contracts";
import {
  buildTeamSetupRows,
  type TeamSetupAction,
  type TeamSetupRow,
} from "@t3tools/shared/teamSetupRows";
import { useNavigate } from "@tanstack/react-router";
import { FolderGit2Icon, GithubIcon, PlugIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { usePersistEnvironmentProviderInstanceMutation } from "../../../hooks/useSettings";
import { turnedOnInstance } from "../../../onboarding/welcomePage.logic";
import { serverEnvironment } from "../../../state/server";
import { useEnvironmentScope } from "../../../state/session";
import { teamSetup } from "../../../state/teamSetup";
import { useAtomCommand } from "../../../state/use-atom-command";
import { cn } from "../../../lib/utils";
import { ClaudeAI, GitIcon, OpenAI } from "../../Icons";
import { Button } from "../../ui/button";
import { toastManager } from "../../ui/toast";
import { TeamSetupTerminal, type TeamSetupRun } from "./TeamSetupTerminal";

/** The rows for one environment, kept current with the provider statuses. */
export function useTeamSetupRows(environmentId: EnvironmentId) {
  const providers = useAtomValue(serverEnvironment.providersValueAtom(environmentId));
  const loadFacts = useAtomCommand(teamSetup.facts, { reportFailure: false });
  const refreshProviders = useAtomCommand(serverEnvironment.refreshProviders, {
    reportFailure: false,
  });
  const [facts, setFacts] = useState<TeamSetupFacts | null>(null);
  const [checking, setChecking] = useState(false);

  const load = async (refresh: boolean) => {
    const result = await loadFacts({ environmentId, input: { refresh } });
    if (result._tag === "Success") setFacts(result.value);
  };

  // oxlint-disable-next-line t3code/no-unreasoned-state-sync -- asks the server for this computer's setup facts when the environment changes
  useEffect(() => {
    void loadFacts({ environmentId, input: {} }).then((result) => {
      if (result._tag === "Success") setFacts(result.value);
    });
  }, [environmentId, loadFacts]);

  const checkAgain = async () => {
    setChecking(true);
    await refreshProviders({ environmentId, input: {} });
    await load(true);
    setChecking(false);
  };

  return {
    rows: buildTeamSetupRows(providers ?? [], facts),
    checking,
    checkAgain,
    reloadFacts: () => load(true),
    setFacts,
  };
}

const STATE_LOOK: Record<TeamSetupRow["state"], { pill: string; word: string }> = {
  ready: { pill: "bg-success/12 text-success", word: "Ready" },
  needsAction: { pill: "bg-warning/14 text-warning-foreground", word: "Needs you" },
  info: { pill: "bg-muted text-muted-foreground", word: "Good to know" },
  off: { pill: "bg-muted text-muted-foreground", word: "Off" },
  checking: { pill: "bg-muted text-muted-foreground", word: "Checking…" },
};

/** Each row's mark: the agent's logo, or an icon for the tool; the state shows in the pill. */
function RowMark({ row }: { readonly row: TeamSetupRow }) {
  if (row.driver === "codex") return <OpenAI className="size-4.5 text-foreground" />;
  if (row.driver === "claudeAgent") return <ClaudeAI className="size-4.5 text-[#d97757]" />;
  if (row.group === "agentTool") return <PlugIcon className="size-4.5" />;
  if (row.id === "git") return <GitIcon className="size-4.5" />;
  if (row.id === "gh") return <GithubIcon className="size-4.5 text-foreground" />;
  if (row.id === "home-repository") return <FolderGit2Icon className="size-4.5" />;
  return (
    <span className="text-xs font-bold">
      {row.name
        .replace(/[^\p{L}\p{N}]/gu, "")
        .slice(0, 1)
        .toUpperCase()}
    </span>
  );
}

function RowBadge({ row }: { readonly row: TeamSetupRow }) {
  return (
    <div
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg text-muted-foreground",
        row.state === "off" ? "bg-muted opacity-60" : "bg-muted",
      )}
    >
      <RowMark row={row} />
    </div>
  );
}

function StatusPill({ state }: { readonly state: TeamSetupRow["state"] }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        STATE_LOOK[state].pill,
      )}
    >
      {state === "ready" || state === "needsAction" ? (
        <span aria-hidden className="size-1.5 rounded-full bg-current" />
      ) : null}
      {STATE_LOOK[state].word}
    </span>
  );
}

export type TeamSetupState = ReturnType<typeof useTeamSetupRows>;

export function TeamSetupRows({
  environmentId,
  setup,
  agentsOnly = false,
}: {
  readonly environmentId: EnvironmentId;
  readonly setup: TeamSetupState;
  /** The first start shows only the AI rows. */
  readonly agentsOnly?: boolean;
}) {
  const { rows, reloadFacts, setFacts } = setup;
  const providers = useAtomValue(serverEnvironment.providersValueAtom(environmentId));
  const serverConfig = useAtomValue(serverEnvironment.configValueAtom(environmentId));
  const refreshProviders = useAtomCommand(serverEnvironment.refreshProviders, {
    reportFailure: false,
  });
  const choose = useAtomCommand(teamSetup.choose, { reportFailure: false });
  const persistProviderInstance = usePersistEnvironmentProviderInstanceMutation(environmentId);
  const canOperateTerminal = useEnvironmentScope(environmentId, AuthTerminalOperateScope);
  const canManageProviders = useEnvironmentScope(environmentId, AuthProvidersManageScope);
  const navigate = useNavigate();
  const [run, setRun] = useState<TeamSetupRun | null>(null);
  const [busyRow, setBusyRow] = useState<string | null>(null);
  const hasDesktop = typeof window !== "undefined" && window.desktopBridge !== undefined;

  const refreshRow = async (row: TeamSetupRow) => {
    await refreshProviders({
      environmentId,
      input: row.instanceId === undefined ? {} : { instanceId: row.instanceId },
    });
    await reloadFacts();
  };

  const act = async (row: TeamSetupRow, action: TeamSetupAction) => {
    if ((action.kind === "install" || action.kind === "signIn") && action.command) {
      setRun({
        label: `${action.label}: ${row.name}`,
        command: action.command,
        providerInstanceId: row.instanceId,
        rowId: row.id,
      });
      return;
    }
    setBusyRow(row.id);
    await perform(row, action).catch(() => undefined);
    setBusyRow(null);
  };

  const perform = async (row: TeamSetupRow, action: TeamSetupAction) => {
    const provider = providers?.find((entry) => entry.instanceId === row.instanceId);
    if (action.kind === "turnOn" && provider !== undefined && serverConfig !== null) {
      const instance = serverConfig.settings.providerInstances[provider.instanceId] ?? {
        driver: provider.driver,
      };
      await persistProviderInstance({
        operation: "upsert",
        instanceId: provider.instanceId,
        instance: turnedOnInstance(instance),
      });
      await refreshRow(row);
    } else if ((action.kind === "dontUse" || action.kind === "useAgain") && row.codexTool) {
      const result = await choose({
        environmentId,
        input: { codexTool: row.codexTool, use: action.kind === "useAgain" },
      });
      if (result._tag === "Success") setFacts(result.value);
    } else if (action.kind === "useWsl") {
      await window.desktopBridge?.setWslBackendEnabled(true);
      toastManager.add({
        type: "success",
        title: "Ubuntu (WSL) is on",
        description:
          "Open a project folder from Ubuntu to use the agents installed there, with their own sign-ins.",
      });
    } else if (action.kind === "update") {
      await navigate({
        to: "/settings/providers",
        ...(row.instanceId ? { search: { environmentId, instanceId: row.instanceId } } : {}),
      });
    } else {
      await refreshRow(row);
    }
  };

  const disabledFor = (action: TeamSetupAction) => {
    if (action.kind === "install" || action.kind === "signIn")
      return !canOperateTerminal || run !== null;
    if (action.kind === "turnOn" || action.kind === "dontUse" || action.kind === "useAgain") {
      return !canManageProviders;
    }
    return false;
  };

  const shown = rows
    .filter((row) => !agentsOnly || row.group === "agent")
    .map((row) => ({
      ...row,
      actions: row.actions.filter((action) => action.kind !== "useWsl" || hasDesktop),
    }));

  const groups = agentsOnly
    ? [{ title: null, rows: shown }]
    : [
        { title: "AI", rows: shown.filter((row) => row.group !== "tool") },
        { title: "Tools", rows: shown.filter((row) => row.group === "tool") },
      ];

  return (
    <>
      {groups
        .filter((group) => group.rows.length > 0)
        .map((group) => (
          <section key={group.title ?? "rows"} className="flex flex-col gap-2">
            {group.title ? (
              <h3 className="ms-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {group.title}
              </h3>
            ) : null}
            <div className="divide-y divide-border overflow-hidden rounded-xl border bg-card">
              {group.rows.map((row) => (
                <div
                  key={row.id}
                  data-team-setup-row={row.id}
                  className="flex items-center gap-3.5 px-4 py-3.5"
                >
                  <RowBadge row={row} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{row.name}</div>
                    <div className="mt-0.5 text-sm text-muted-foreground">{row.message}</div>
                    {row.note ? (
                      <div className="mt-1 text-xs text-muted-foreground/80">{row.note}</div>
                    ) : null}
                  </div>
                  {row.actions.length === 0 ? (
                    <StatusPill state={row.state} />
                  ) : (
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      {row.actions.map((action, index) => (
                        <Button
                          key={action.kind}
                          size="sm"
                          variant={index === 0 ? "default" : "outline"}
                          disabled={busyRow === row.id || disabledFor(action)}
                          onClick={() => void act(row, action)}
                        >
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      {!canOperateTerminal && shown.some((row) => row.state === "needsAction") ? (
        <p className="px-4 py-2 text-xs text-muted-foreground">
          This connection cannot run setup steps on this computer.
        </p>
      ) : null}
      {run !== null ? (
        <div className="px-4 pb-4">
          <TeamSetupTerminal
            key={run.command}
            environmentId={environmentId}
            run={run}
            onFinished={() => {
              const row = rows.find((entry) => entry.id === run.rowId);
              if (row !== undefined) void refreshRow(row);
              else void reloadFacts();
            }}
            onClose={() => {
              setRun(null);
              void reloadFacts();
            }}
          />
        </div>
      ) : null}
    </>
  );
}
