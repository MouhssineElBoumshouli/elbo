// team-layer: the planning page (team/PLANNING_FEATURE_PLAN.md section 4, slices 4 and 5): "What are
// you making?", the questions, the size check, writing and review, the plan and its decisions, and
// saving it.
import { useAtomValue } from "@effect/atom-react";
import { scopeProjectRef } from "@t3tools/client-runtime/environment";
import { squashAtomCommandFailure } from "@t3tools/client-runtime/state/runtime";
import type {
  EnvironmentId,
  ProjectId,
  TeamPlanDecideInput,
  TeamPlanRunState,
  TeamPlanSavePreview,
  TeamPlanSize,
} from "@t3tools/contracts";
import { useNavigate } from "@tanstack/react-router";
import { ListChecksIcon } from "lucide-react";
import { useState } from "react";

import { isElectron } from "~/env";
import { useNewThreadHandler } from "~/hooks/useHandleNewThread";
import { useProject } from "~/state/entities";
import { useEnvironmentQuery } from "~/state/query";
import { serverEnvironment } from "~/state/server";
import { teamPlanning } from "~/state/teamPlanning";
import { useTeamFeed } from "~/state/teamFeed";
import { useAtomCommand } from "~/state/use-atom-command";
import { ScrollArea } from "../../ui/scroll-area";
import { SidebarInset } from "../../ui/sidebar";
import { Button } from "../../ui/button";
import { toastManager } from "../../ui/toast";
import { WorkspacePageContainer } from "../../WorkspacePageContainer";
import { WorkspacePageHeader } from "../../WorkspacePageHeader";
import {
  briefFromAnswers,
  emptyAnswers,
  type PlanAnswers,
  progressText,
  suggestedSize,
} from "./planAnswers.logic";
import { PlanDecisions } from "./PlanDecisions";
import { newestState, saveBlocked } from "./planDecisions.logic";
import { PlanQuestions } from "./PlanQuestions";
import { PlanSaveDialog } from "./PlanSaveDialog";
import { PlanError, PlanProgress, PlanResult, PlanSizeCheck } from "./PlanSteps";

type Step = "start" | "questions" | "size";

const failureText = (result: { readonly _tag: "Failure" } & object) => {
  const error = squashAtomCommandFailure(result as never);
  return error instanceof Error ? error.message : "Try again.";
};

export function PlanPage(props: {
  readonly environmentId: EnvironmentId;
  readonly projectId: ProjectId;
  /** From "New project": ask "Plan it first" or "Start building" before the questions. */
  readonly fresh: boolean;
  readonly runId: string | undefined;
}) {
  const navigate = useNavigate();
  const projectRef = scopeProjectRef(props.environmentId, props.projectId);
  const project = useProject(projectRef);
  const handleNewThread = useNewThreadHandler();
  const team = useTeamFeed(props.environmentId).find((entry) =>
    entry.projects.some((item) => item.projectId === props.projectId),
  );
  const me = team?.members.find((member) => member.memberId === team.me);
  const members = team === undefined || team.solo ? null : team.members;
  const [answers, setAnswers] = useState<PlanAnswers>(() =>
    emptyAnswers(
      members !== null
        ? members.map((member) => ({
            name: member.displayName,
            memberId: member.memberId,
            skills: "",
            hours: "",
          }))
        : [
            {
              name: me?.displayName ?? "You",
              memberId: me?.memberId ?? null,
              skills: "",
              hours: "",
            },
          ],
    ),
  );
  const [step, setStep] = useState<Step>(props.fresh ? "start" : "questions");
  const brief = briefFromAnswers(answers);
  const suggested = suggestedSize(brief);
  const [size, setSize] = useState<TeamPlanSize | null>(null);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<TeamPlanSavePreview | null>(null);

  const start = useAtomCommand(teamPlanning.start, { reportFailure: false });
  const stop = useAtomCommand(teamPlanning.stop, { reportFailure: false });
  const previewSave = useAtomCommand(teamPlanning.previewSave, { reportFailure: false });
  const save = useAtomCommand(teamPlanning.save, { reportFailure: false });
  const decide = useAtomCommand(teamPlanning.decide, { reportFailure: false });
  const [decided, setDecided] = useState<TeamPlanRunState | null>(null);
  const [pending, setPending] = useState<TeamPlanRunState["answering"]>(null);
  const query = useEnvironmentQuery(
    props.runId === undefined
      ? null
      : teamPlanning.run({ environmentId: props.environmentId, input: { runId: props.runId } }),
  );
  const streamed = query.data;
  const run = props.runId === undefined ? null : newestState(streamed, decided);
  const providers = useAtomValue(serverEnvironment.providersValueAtom(props.environmentId));

  const toRun = (runId: string | undefined) =>
    navigate({
      to: "/plan",
      search: {
        environmentId: props.environmentId,
        projectId: props.projectId,
        ...(runId === undefined ? {} : { runId }),
      },
    });

  const write = async () => {
    setBusy(true);
    const result = await start({
      environmentId: props.environmentId,
      input: { projectId: props.projectId, brief, size: size ?? suggested },
    });
    setBusy(false);
    if (result._tag === "Failure") {
      toastManager.add({
        type: "error",
        title: "Could not start the plan",
        description: failureText(result),
      });
      return;
    }
    await toRun(result.value.runId);
  };

  const stopRun = async () => {
    if (props.runId === undefined) return;
    setBusy(true);
    await stop({ environmentId: props.environmentId, input: { runId: props.runId } });
    setBusy(false);
  };

  const openSave = async () => {
    if (props.runId === undefined) return;
    setBusy(true);
    const result = await previewSave({
      environmentId: props.environmentId,
      input: { runId: props.runId },
    });
    setBusy(false);
    if (result._tag === "Failure") {
      toastManager.add({
        type: "error",
        title: "Could not prepare the save",
        description: failureText(result),
      });
      return;
    }
    setPreview(result.value);
  };

  const confirmSave = async () => {
    if (props.runId === undefined) return;
    setBusy(true);
    const result = await save({
      environmentId: props.environmentId,
      input: { runId: props.runId },
    });
    setBusy(false);
    if (result._tag === "Failure") {
      toastManager.add({
        type: "error",
        title: "Could not save the plan",
        description: failureText(result),
      });
      return;
    }
    setPreview(result.value);
  };

  const onDecide = async (number: string, ask: TeamPlanDecideInput["ask"]) => {
    if (props.runId === undefined) return false;
    // The run's stream has ended once the plan is done; this shows the turn until it answers.
    if (ask.kind !== "agree") setPending({ number, kind: ask.kind });
    const result = await decide({
      environmentId: props.environmentId,
      input: { runId: props.runId, number, ask },
    });
    setPending(null);
    if (result._tag === "Failure") {
      toastManager.add({
        type: "error",
        title:
          ask.kind === "push-back"
            ? "The push-back got no answer"
            : "Could not change the decision",
        description: failureText(result),
      });
      return false;
    }
    setDecided(result.value);
    return true;
  };

  const running = run?.status === "running";
  const blocked = run?.view ? saveBlocked(run.view.decisions) : null;
  const provider = providers?.find((entry) => entry.driver === run?.error?.driver);

  return (
    <SidebarInset className="h-dvh min-h-0 overflow-hidden overscroll-y-none isolate">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-background text-foreground">
        <WorkspacePageHeader electron={isElectron}>
          <span className="flex items-center gap-2 text-sm font-medium">
            <ListChecksIcon className="size-4" />
            Plan
          </span>
        </WorkspacePageHeader>
        <ScrollArea className="min-h-0 flex-1">
          <WorkspacePageContainer width="wide" data-plan-step={props.runId ? "run" : step}>
            <div className="flex flex-col gap-1">
              <span className="text-sm text-muted-foreground">
                {props.fresh ? "New project" : "Plan the next part"} · {project?.title}
              </span>
              <h1 className="text-xl font-semibold">
                {run?.view?.title ??
                  (props.runId !== undefined
                    ? run?.status === "running" || (run === null && query.error === null)
                      ? "Writing the plan"
                      : "The plan was not finished"
                    : step === "size"
                      ? "How big is it?"
                      : "What are you making?")}
              </h1>
            </div>

            {props.runId === undefined && step === "start" ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button autoFocus onClick={() => setStep("questions")}>
                  Plan it first
                </Button>
                <Button variant="outline" onClick={() => void handleNewThread(projectRef)}>
                  Start building
                </Button>
                <span className="text-sm text-muted-foreground">
                  A plan takes a few minutes. You can skip it any time.
                </span>
              </div>
            ) : null}

            {props.runId === undefined && step === "questions" ? (
              <>
                <PlanQuestions answers={answers} members={members} onChange={setAnswers} />
                <div className="flex flex-wrap items-center gap-3">
                  <Button onClick={() => setStep("size")}>Next: size</Button>
                  {props.fresh ? (
                    <Button variant="ghost" onClick={() => setStep("start")}>
                      Back
                    </Button>
                  ) : null}
                  <span className="text-sm text-muted-foreground">
                    Leave anything you're not sure about; the plan will suggest it.
                  </span>
                </div>
              </>
            ) : null}

            {props.runId === undefined && step === "size" ? (
              <>
                <PlanSizeCheck
                  brief={brief}
                  suggested={suggested}
                  size={size ?? suggested}
                  onSize={setSize}
                />
                <div className="flex flex-wrap items-center gap-3">
                  <Button autoFocus disabled={busy} onClick={() => void write()}>
                    Write the plan
                  </Button>
                  <Button variant="ghost" onClick={() => setStep("questions")}>
                    Back to the questions
                  </Button>
                </div>
              </>
            ) : null}

            {props.runId !== undefined && run === null ? (
              <div className="flex flex-col items-start gap-3">
                <p className="text-sm text-muted-foreground">
                  {query.error ?? "Loading the plan…"}
                </p>
                {query.error !== null ? (
                  <Button onClick={() => void toRun(undefined)}>Back to the questions</Button>
                ) : null}
              </div>
            ) : null}
            {run && running ? (
              <PlanProgress state={run} stopping={busy} onStop={() => void stopRun()} />
            ) : null}
            {run?.status === "failed" ? <PlanError state={run} provider={provider} /> : null}
            {run?.status === "stopped" ? (
              <p className="text-sm text-muted-foreground">{progressText(run)}</p>
            ) : null}
            {run?.status === "done" && run.view ? (
              <PlanResult
                state={run}
                decisions={
                  <PlanDecisions
                    decisions={run.view.decisions}
                    writer={run.writer.name}
                    answering={run.answering ?? pending}
                    busy={busy}
                    onDecide={onDecide}
                  />
                }
              />
            ) : null}
            {run && !running ? (
              <div className="flex flex-wrap items-center gap-3">
                {run.status === "done" ? (
                  <Button
                    disabled={busy || blocked !== null || (run.answering ?? pending) !== null}
                    onClick={() => void openSave()}
                  >
                    Save the plan
                  </Button>
                ) : null}
                <Button
                  variant={run.status === "done" ? "outline" : "default"}
                  onClick={() => {
                    setStep("questions");
                    void toRun(undefined);
                  }}
                >
                  {run.status === "done" ? "Change the answers" : "Back to the questions"}
                </Button>
                <Button variant="ghost" onClick={() => void handleNewThread(projectRef)}>
                  Start building
                </Button>
                {blocked !== null ? (
                  <span className="w-full text-sm text-warning-foreground">{blocked}</span>
                ) : null}
              </div>
            ) : null}
          </WorkspacePageContainer>
        </ScrollArea>
      </div>
      {preview ? (
        <PlanSaveDialog
          preview={preview}
          saving={busy}
          onSave={() => void confirmSave()}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </SidebarInset>
  );
}
