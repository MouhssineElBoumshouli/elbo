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
import { CircleAlertIcon, CircleCheckIcon, CircleDashedIcon, InfoIcon } from "lucide-react";
import { useEffect, useState } from "react";

import { usePersistEnvironmentProviderInstanceMutation } from "../../../hooks/useSettings";
import { turnedOnInstance } from "../../../onboarding/welcomePage.logic";
import { serverEnvironment } from "../../../state/server";
import { useEnvironmentScope } from "../../../state/session";
import { teamSetup } from "../../../state/teamSetup";
import { useAtomCommand } from "../../../state/use-atom-command";
import { SettingsRow } from "../../settings/settingsLayout";
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

function RowIcon({ state }: { readonly state: TeamSetupRow["state"] }) {
  if (state === "ready") return <CircleCheckIcon className="size-4 text-success" />;
  if (state === "needsAction") return <CircleAlertIcon className="size-4 text-warning" />;
  if (state === "info") return <InfoIcon className="size-4 text-muted-foreground" />;
  return <CircleDashedIcon className="size-4 text-muted-foreground" />;
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

  return (
    <>
      {shown.map((row) => (
        <SettingsRow
          key={row.id}
          title={
            <span className="flex items-center gap-2">
              <RowIcon state={row.state} />
              {row.name}
            </span>
          }
          description={row.note ? `${row.message} ${row.note}` : row.message}
          control={
            row.actions.length === 0 ? null : (
              <div className="flex flex-wrap justify-end gap-2">
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
            )
          }
        />
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
