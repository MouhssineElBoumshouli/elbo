// team-layer: the plan's decisions, each with Agree, Pick another option and Push back, and "How
// we got here" (team/PLANNING_FEATURE_PLAN.md section 4 step 6, slice 5).
import type { TeamPlanDecideInput, TeamPlanDecision } from "@t3tools/contracts";
import { useState } from "react";

import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Spinner } from "../../ui/spinner";
import { Textarea } from "../../ui/textarea";
import { answeringText, DECISION_BADGE, STEP_WORDS } from "./planDecisions.logic";

type Ask = TeamPlanDecideInput["ask"];

const BADGE_VARIANT = {
  open: "warning",
  agreed: "success",
  answered: "info",
  "against-advice": "outline",
} as const;

export function PlanDecisions(props: {
  readonly decisions: ReadonlyArray<TeamPlanDecision>;
  readonly writer: string;
  readonly answering: { readonly number: string; readonly kind: "push-back" | "pick" } | null;
  readonly busy: boolean;
  readonly onDecide: (number: string, ask: Ask) => Promise<boolean>;
}) {
  return (
    <section className="flex flex-col gap-3" aria-label="Decisions">
      <h2 className="text-base font-semibold">Decisions</h2>
      {props.decisions.map((decision) => (
        <DecisionCard
          key={decision.number}
          decision={decision}
          writer={props.writer}
          answering={props.answering?.number === decision.number ? props.answering.kind : null}
          locked={props.busy || props.answering !== null}
          onDecide={(ask) => props.onDecide(decision.number, ask)}
        />
      ))}
    </section>
  );
}

function DecisionCard(props: {
  readonly decision: TeamPlanDecision;
  readonly writer: string;
  readonly answering: "push-back" | "pick" | null;
  readonly locked: boolean;
  readonly onDecide: (ask: Ask) => Promise<boolean>;
}) {
  const { decision } = props;
  const [mode, setMode] = useState<"idle" | "pick" | "push-back">("idle");
  const [message, setMessage] = useState("");
  const others = decision.options.filter((option) => option !== decision.picked);

  const cancel = () => {
    setMode("idle");
    setMessage("");
  };

  const send = async (ask: Ask) => {
    if (await props.onDecide(ask)) {
      setMode("idle");
      setMessage("");
    }
  };

  return (
    <article
      className="flex flex-col gap-2 rounded-xl border border-border/70 bg-card px-5 py-4"
      aria-label={`Decision ${decision.number}: ${decision.title}`}
      data-status={decision.status}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="grow text-sm font-semibold">
          {decision.title}: {decision.picked}
        </h3>
        <Badge variant={BADGE_VARIANT[decision.status]}>{DECISION_BADGE[decision.status]}</Badge>
      </div>
      <p className="text-sm">{decision.why}</p>
      {others.length > 0 ? (
        <p className="text-xs text-muted-foreground">Also looked at: {others.join(", ")}</p>
      ) : null}
      {decision.status === "against-advice" ? (
        <p className="text-sm text-warning-foreground">
          The plan advised {decision.advice}. Risk: {decision.risk}
        </p>
      ) : null}

      {decision.history.length > 0 ? (
        <div className="flex flex-col gap-1 border-l-2 border-border ps-3">
          <h4 className="text-xs font-medium text-muted-foreground">How we got here</h4>
          {decision.history.map((step) => (
            <p key={`${step.kind}:${step.by}:${step.text}`} className="text-sm">
              <span className="font-medium">
                {step.by} {STEP_WORDS[step.kind]}:
              </span>{" "}
              {step.text}
              {step.updated.length > 0 ? (
                <span className="block text-xs text-muted-foreground">
                  Updated: {step.updated.join(", ")}
                </span>
              ) : null}
            </p>
          ))}
        </div>
      ) : null}

      {props.answering !== null ? (
        <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner className="size-4" />
          {answeringText(props.writer, props.answering)}
        </p>
      ) : mode === "pick" ? (
        <div className="flex flex-wrap items-center gap-2">
          {others.map((option) => (
            <Button
              key={option}
              size="sm"
              variant="outline"
              disabled={props.locked}
              onClick={() => void send({ kind: "pick", option })}
            >
              {option === decision.advice ? `${option} (the advice)` : option}
            </Button>
          ))}
          <Button size="sm" variant="ghost" onClick={cancel}>
            Cancel
          </Button>
        </div>
      ) : mode === "push-back" ? (
        <form
          className="flex flex-col gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (message.trim()) void send({ kind: "push-back", message: message.trim() });
          }}
        >
          <Textarea
            autoFocus
            aria-label={`Why push back on ${decision.title}`}
            placeholder="Why? For example: We don't know React, why not plain HTML?"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") cancel();
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" type="submit" disabled={props.locked || !message.trim()}>
              Send to {props.writer}
            </Button>
            <Button size="sm" variant="ghost" type="button" onClick={cancel}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          {decision.status === "open" || decision.status === "answered" ? (
            <Button size="sm" disabled={props.locked} onClick={() => void send({ kind: "agree" })}>
              Agree
            </Button>
          ) : null}
          {others.length > 0 ? (
            <Button
              size="sm"
              variant="outline"
              disabled={props.locked}
              onClick={() => setMode("pick")}
            >
              Pick another option
            </Button>
          ) : null}
          {decision.status !== "against-advice" ? (
            <Button
              size="sm"
              variant="outline"
              disabled={props.locked}
              onClick={() => setMode("push-back")}
            >
              {decision.history.some((step) => step.kind === "pushed-back")
                ? "Push back again"
                : "Push back"}
            </Button>
          ) : null}
        </div>
      )}
    </article>
  );
}
