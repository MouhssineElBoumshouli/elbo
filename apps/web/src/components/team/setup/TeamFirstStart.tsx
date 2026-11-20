// team-layer: the first start (team/WINDOWS_RELEASE_PLAN.md section 4b). Three steps only: pick a
// project folder, connect one AI (the same rows as Check my setup), start a chat. Upstream's
// welcome page stays one click away as "More options".
import { scopeProjectRef } from "@t3tools/client-runtime/environment";
import {
  isAtomCommandInterrupted,
  squashAtomCommandFailure,
} from "@t3tools/client-runtime/state/runtime";
import { inferProjectTitleFromPath } from "@t3tools/client-runtime/state/projects";
import type { EnvironmentId, ScopedProjectRef } from "@t3tools/contracts";
import { hasReadyAgent } from "@t3tools/shared/teamSetupRows";
import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";
import { CheckIcon } from "lucide-react";
import { useState, type ReactNode } from "react";

import { openCommandPalette } from "../../../commandPaletteBus";
import { completeOnboarding } from "../../../onboarding/firstRun";
import { ensureLocalApi } from "../../../localApi";
import { newProjectId } from "../../../lib/utils";
import { waitForProject } from "../../../state/entities";
import { projectEnvironment } from "../../../state/projects";
import { useAtomCommand } from "../../../state/use-atom-command";
import { Button } from "../../ui/button";
import { ScrollArea } from "../../ui/scroll-area";
import { SidebarInset } from "../../ui/sidebar";
import { toastManager } from "../../ui/toast";
import { TeamSetupRows, useTeamSetupRows } from "./TeamSetupPanel";

function Step({
  number,
  title,
  done,
  children,
}: {
  readonly number: number;
  readonly title: string;
  readonly done: boolean;
  readonly children: ReactNode;
}) {
  return (
    <section className="flex gap-4 border-b border-border/60 py-6 last:border-b-0">
      <span
        className={
          done
            ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-success/15 text-success"
            : "flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm text-muted-foreground"
        }
      >
        {done ? <CheckIcon className="size-4" /> : number}
      </span>
      <div className="min-w-0 flex-1">
        <h2 className="text-base font-medium">{title}</h2>
        <div className="mt-3">{children}</div>
      </div>
    </section>
  );
}

export function TeamFirstStart({
  environmentId,
  onDone,
  onMore,
}: {
  readonly environmentId: EnvironmentId;
  readonly onDone: (projectRef: ScopedProjectRef | undefined) => Promise<void>;
  readonly onMore: () => void;
}) {
  const createProject = useAtomCommand(projectEnvironment.create, { reportFailure: false });
  const setup = useTeamSetupRows(environmentId);
  const [project, setProject] = useState<{ ref: ScopedProjectRef; title: string } | null>(null);
  const [picking, setPicking] = useState(false);
  const [starting, setStarting] = useState(false);
  const aiReady = hasReadyAgent(setup.rows);
  const canPickNatively = typeof window !== "undefined" && window.desktopBridge !== undefined;

  const addPickedFolder = async () => {
    const path = await ensureLocalApi().dialogs.pickFolder();
    if (!path) return null;
    const projectId = newProjectId();
    const title = inferProjectTitleFromPath(path);
    const result = await createProject({
      environmentId,
      input: {
        projectId,
        title,
        workspaceRoot: path,
        createWorkspaceRootIfMissing: true,
        defaultModelSelection: null,
      },
    });
    if (result._tag === "Failure") {
      if (!isAtomCommandInterrupted(result)) {
        const error = squashAtomCommandFailure(result);
        toastManager.add({
          type: "error",
          title: "Could not add the folder",
          description: error instanceof Error ? error.message : "Try another folder.",
        });
      }
      return null;
    }
    const ref = scopeProjectRef(environmentId, projectId);
    await waitForProject(ref, 3_000).catch(() => null);
    return { ref, title };
  };

  const pickFolder = async () => {
    if (!canPickNatively) {
      openCommandPalette({ open: "add-project" });
      return;
    }
    setPicking(true);
    const picked = await addPickedFolder().catch(() => null);
    setPicking(false);
    if (picked !== null) setProject(picked);
  };

  const finish = async (projectRef: ScopedProjectRef | undefined) => {
    await completeOnboarding();
    await onDone(projectRef);
  };

  const start = async () => {
    setStarting(true);
    await finish(project?.ref).catch(() => undefined);
    setStarting(false);
  };

  return (
    <SidebarInset>
      <ScrollArea className="h-full">
        <div className="mx-auto w-full max-w-2xl px-4 py-10">
          <h1 className="text-2xl font-semibold">Welcome to {TEAM_IDENTITY.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Three steps, then you can work.</p>

          <Step number={1} title="Pick a project folder" done={project !== null}>
            {project === null ? (
              <Button disabled={picking} onClick={() => void pickFolder()}>
                {picking ? "Opening…" : "Pick a folder"}
              </Button>
            ) : (
              <div className="flex items-center gap-3 text-sm">
                <span>{project.title}</span>
                <Button size="xs" variant="outline" onClick={() => void pickFolder()}>
                  Pick another
                </Button>
              </div>
            )}
          </Step>

          <Step number={2} title="Connect one AI" done={aiReady}>
            <p className="mb-2 text-sm text-muted-foreground">
              {aiReady ? "One is ready. That's enough to start." : "One working AI is enough."}
            </p>
            <div className="overflow-hidden rounded-lg border border-border/70">
              <TeamSetupRows environmentId={environmentId} setup={setup} agentsOnly />
            </div>
          </Step>

          <Step number={3} title="Start a chat" done={false}>
            <Button
              disabled={project === null || !aiReady || starting}
              onClick={() => void start()}
            >
              {starting ? "Starting…" : "Start a chat"}
            </Button>
            {project === null || !aiReady ? (
              <p className="mt-2 text-xs text-muted-foreground">
                {project === null ? "Pick a folder first." : "Connect one AI first."}
              </p>
            ) : null}
          </Step>

          <div className="mt-6 flex items-center justify-between">
            <Button size="sm" variant="ghost-muted" onClick={onMore}>
              More options
            </Button>
            <Button size="sm" variant="ghost-muted" onClick={() => void finish(undefined)}>
              Skip for now
            </Button>
          </div>
        </div>
      </ScrollArea>
    </SidebarInset>
  );
}
