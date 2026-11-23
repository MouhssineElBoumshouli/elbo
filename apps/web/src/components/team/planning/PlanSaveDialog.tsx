// team-layer: "Save the plan": shows exactly what will be written, writes only after the person
// confirms, then says where it went (team/PLANNING_FEATURE_PLAN.md section 7, slice 4).
import type { TeamPlanSavePreview } from "@t3tools/contracts";

import { Button } from "../../ui/button";
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from "../../ui/dialog";

const FILE_STATUS: Record<TeamPlanSavePreview["files"][number]["status"], string> = {
  new: "new",
  changed: "changes",
  unchanged: "same",
};

const TASK_ACTION: Record<TeamPlanSavePreview["tasks"][number]["action"], string> = {
  create: "new",
  update: "changes",
  keep: "same",
};

export function PlanSaveDialog(props: {
  readonly preview: TeamPlanSavePreview;
  readonly saving: boolean;
  readonly onSave: () => void;
  readonly onClose: () => void;
}) {
  const { preview } = props;
  const writes =
    preview.files.some((file) => file.status !== "unchanged") ||
    preview.rules.added.length + preview.rules.removed.length > 0 ||
    preview.tasks.some((task) => task.action !== "keep");
  return (
    <Dialog open onOpenChange={(open) => !open && props.onClose()}>
      <DialogPopup className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{preview.saved ? "Plan saved" : "Save the plan"}</DialogTitle>
          <DialogDescription>
            {preview.saved
              ? `Saved in ${preview.folder}. Agents read the decisions and code rules from now on.`
              : writes
                ? `This is everything that will be written in ${preview.folder}. Nothing is written until you save.`
                : "This plan is already saved; saving again changes nothing."}
          </DialogDescription>
        </DialogHeader>
        <DialogPanel>
          <div className="flex flex-col gap-4 text-sm">
            <section aria-label="Files">
              <h3 className="mb-1 font-medium">Files</h3>
              <ul className="space-y-0.5">
                {preview.files.map((file) => (
                  <li key={file.path} className="flex gap-2">
                    <span className="w-16 shrink-0 text-muted-foreground">
                      {FILE_STATUS[file.status]}
                    </span>
                    <code className="truncate">{file.path}</code>
                    <span className="truncate text-muted-foreground">{file.detail}</span>
                  </li>
                ))}
              </ul>
            </section>
            <section aria-label="Code rules">
              <h3 className="mb-1 font-medium">Code rules every agent follows</h3>
              {preview.rules.added.length + preview.rules.removed.length === 0 ? (
                <p className="text-muted-foreground">No change.</p>
              ) : (
                <ul className="space-y-0.5">
                  {preview.rules.added.map((rule) => (
                    <li key={`add:${rule}`}>+ {rule}</li>
                  ))}
                  {preview.rules.removed.map((rule) => (
                    <li key={`remove:${rule}`} className="text-muted-foreground line-through">
                      {rule}
                    </li>
                  ))}
                </ul>
              )}
            </section>
            {preview.kept.length > 0 ? (
              <section aria-label="Earlier decisions">
                <h3 className="mb-1 font-medium">Earlier decisions that stay active</h3>
                <ul className="space-y-0.5 text-muted-foreground">
                  {preview.kept.map((entry) => (
                    <li key={entry.number}>
                      {entry.number} {entry.title}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            <section aria-label="Tasks">
              <h3 className="mb-1 font-medium">Tasks ({preview.tasks.length})</h3>
              <ul className="space-y-0.5">
                {preview.tasks.map((task) => (
                  <li key={task.title} className="flex gap-2">
                    <span className="w-16 shrink-0 text-muted-foreground">
                      {TASK_ACTION[task.action]}
                    </span>
                    <span className="min-w-0">
                      {task.title}
                      <span className="text-muted-foreground">
                        {task.owner ? ` · ${task.owner}` : ""}
                        {task.paths.length > 0 ? ` · ${task.paths.join(", ")}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </DialogPanel>
        <DialogFooter>
          {preview.saved ? (
            <Button onClick={props.onClose}>Done</Button>
          ) : (
            <>
              <Button variant="outline" onClick={props.onClose}>
                Cancel
              </Button>
              <Button disabled={props.saving || !writes} onClick={props.onSave}>
                {props.saving ? "Saving…" : "Save the plan"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogPopup>
    </Dialog>
  );
}
