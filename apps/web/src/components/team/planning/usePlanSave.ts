// team-layer: "Save the plan" (team/PLANNING_FEATURE_PLAN.md section 7): preview, the AGENTS.md /
// CLAUDE.md choice, then the save. The preview is asked again when the choice changes, so the
// dialog always shows exactly what will be written.
import { squashAtomCommandFailure } from "@t3tools/client-runtime/state/runtime";
import type { EnvironmentId, TeamPlanSavePreview } from "@t3tools/contracts";
import { useState } from "react";

import { teamPlanning } from "~/state/teamPlanning";
import { useAtomCommand } from "~/state/use-atom-command";
import { toastManager } from "../../ui/toast";

const failureText = (result: { readonly _tag: "Failure" } & object) => {
  const error = squashAtomCommandFailure(result as never);
  return error instanceof Error ? error.message : "Try again.";
};

export function usePlanSave(environmentId: EnvironmentId, runId: string | undefined) {
  const previewSave = useAtomCommand(teamPlanning.previewSave, { reportFailure: false });
  const save = useAtomCommand(teamPlanning.save, { reportFailure: false });
  const [preview, setPreview] = useState<TeamPlanSavePreview | null>(null);
  const [tellAgents, setTellAgents] = useState(true);
  const [busy, setBusy] = useState(false);

  const call = async (
    command: typeof previewSave,
    tell: boolean,
    failure: string,
  ): Promise<void> => {
    if (runId === undefined) return;
    setBusy(true);
    const result = await command({ environmentId, input: { runId, tellAgents: tell } });
    setBusy(false);
    if (result._tag === "Failure") {
      toastManager.add({ type: "error", title: failure, description: failureText(result) });
      return;
    }
    setPreview(result.value);
  };

  return {
    preview,
    tellAgents,
    busy,
    open: () => call(previewSave, tellAgents, "Could not prepare the save"),
    setTellAgents: (tell: boolean) => {
      setTellAgents(tell);
      return call(previewSave, tell, "Could not prepare the save");
    },
    confirm: () => call(save, tellAgents, "Could not save the plan"),
    close: () => setPreview(null),
  };
}
