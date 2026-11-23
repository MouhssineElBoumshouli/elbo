// team-layer: the size check, the writing-and-review line, and the finished plan (slice 4).
import type {
  ServerProvider,
  TeamPlanBrief,
  TeamPlanRunState,
  TeamPlanSize,
} from "@t3tools/contracts";
import { CircleAlertIcon, CircleCheckIcon } from "lucide-react";

import ChatMarkdown from "../../ChatMarkdown";
import { Alert, AlertDescription, AlertTitle } from "../../ui/alert";
import { Button } from "../../ui/button";
import { Spinner } from "../../ui/spinner";
import { Toggle } from "../../ui/toggle";
import {
  planErrorWords,
  progressText,
  SIZE_HINTS,
  sameProviderNote,
  sizeSentence,
} from "./planAnswers.logic";

const SIZES: ReadonlyArray<TeamPlanSize> = ["small", "medium", "large"];

export function PlanSizeCheck(props: {
  readonly brief: TeamPlanBrief;
  readonly suggested: TeamPlanSize;
  readonly size: TeamPlanSize;
  readonly onSize: (size: TeamPlanSize) => void;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card p-5">
      <p className="text-base font-medium">{sizeSentence(props.brief, props.suggested)}</p>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Plan size">
        {SIZES.map((size) => (
          <Toggle
            key={size}
            variant="outline"
            size="sm"
            pressed={props.size === size}
            onPressedChange={(on) => on && props.onSize(size)}
          >
            {size[0]?.toUpperCase()}
            {size.slice(1)}
          </Toggle>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{SIZE_HINTS[props.size]}</p>
    </div>
  );
}

export function PlanProgress(props: {
  readonly state: TeamPlanRunState;
  readonly stopping: boolean;
  readonly onStop: () => void;
}) {
  const note = sameProviderNote(props.state);
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card p-5">
      <div className="flex items-center gap-3" role="status" aria-live="polite">
        <Spinner className="size-4" />
        <span className="grow text-sm font-medium">{progressText(props.state)}</span>
        <Button size="sm" variant="outline" disabled={props.stopping} onClick={props.onStop}>
          {props.stopping ? "Stopping…" : "Stop"}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        {props.state.writer.name} writes, {props.state.reviewer.name} reviews. This takes a few
        minutes.
      </p>
      {note ? <p className="text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
}

export function PlanError(props: {
  readonly state: TeamPlanRunState;
  readonly provider: ServerProvider | undefined;
}) {
  const words = planErrorWords(props.state, props.provider);
  return (
    <Alert variant="warning">
      <CircleAlertIcon />
      <AlertTitle>{words.title}</AlertTitle>
      <AlertDescription>{words.description}</AlertDescription>
    </Alert>
  );
}

/** The plan in its plain layout, then the review's scores and what it changed. */
export function PlanResult(props: { readonly state: TeamPlanRunState }) {
  const view = props.state.view;
  if (view === null) return null;
  const fixed = view.changes.filter((change) => change.outcome === "fixed");
  const declined = view.changes.filter((change) => change.outcome !== "fixed");
  return (
    <div className="flex flex-col gap-4">
      <article className="rounded-xl border border-border/70 bg-card px-5 py-4">
        <ChatMarkdown text={view.markdown} cwd={undefined} />
      </article>
      <section
        className="flex flex-col gap-2 rounded-xl border border-border/70 p-4"
        aria-label="Review"
      >
        <h2 className="flex items-center gap-2 text-sm font-medium">
          <CircleCheckIcon className="size-4 text-success" />
          {props.state.reviewer.name} reviewed it:{" "}
          {view.scores.map((score) => `${score}/10`).join(" → ")}
        </h2>
        {fixed.length > 0 ? (
          <ul className="list-disc space-y-1 ps-5 text-sm">
            {fixed.map((change) => (
              <li key={`${change.round}:${change.point}`}>
                {change.from === "check" ? "Too long: " : ""}
                {change.point} <span className="text-muted-foreground">Fixed: {change.reason}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing needed fixing.</p>
        )}
        {declined.length > 0 ? (
          <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
            {declined.map((change) => (
              <li key={`${change.round}:${change.point}`}>
                {change.point} Not changed: {change.reason}
              </li>
            ))}
          </ul>
        ) : null}
        {view.nits > 0 ? (
          <p className="text-xs text-muted-foreground">
            {view.nits === 1 ? "1 small remark" : `${view.nits} small remarks`} left as they are.
          </p>
        ) : null}
      </section>
    </div>
  );
}
