// team-layer: the pure parts of a planning run in the app: who writes and who reviews, from the
// person's connected AIs; which step a turn is; and the finished plan as the plan page shows it.
import {
  isProviderAvailable,
  type ProviderInstanceId,
  type ServerProvider,
  type TeamPlanAgent,
  type TeamPlanStep,
  type TeamPlanView,
} from "@t3tools/contracts";

import { wordCount } from "./planLimits.ts";
import { DEFAULT_MODELS, REVIEW_DEFAULTS } from "./planProvider.ts";
import { renderPlan } from "./planRender.ts";
import type { PlanProvider } from "./planReview.ts";
import type { PlanResult } from "./planSchemas.ts";

const DRIVERS: Record<string, PlanProvider> = { codex: "codex", claudeAgent: "claude" };
const NAMES: Record<PlanProvider, string> = { codex: "Codex", claude: "Claude" };

export interface PlanSeat {
  readonly provider: PlanProvider;
  readonly instanceId: ProviderInstanceId;
  readonly model: string;
  readonly effort: string;
  readonly agent: TeamPlanAgent;
}

const ready = (provider: ServerProvider) =>
  provider.driver in DRIVERS &&
  provider.enabled &&
  provider.installed &&
  isProviderAvailable(provider) &&
  provider.auth.status === "authenticated" &&
  provider.status !== "error" &&
  provider.status !== "disabled";

function seat(
  provider: ServerProvider,
  choice: { readonly model: string; readonly effort: string },
): PlanSeat {
  const kind = DRIVERS[provider.driver]!;
  const offered = provider.models.some((model) => model.slug === choice.model);
  const model = offered ? choice.model : (provider.models[0]?.slug ?? choice.model);
  return {
    provider: kind,
    instanceId: provider.instanceId,
    model,
    effort: choice.effort,
    agent: { driver: provider.driver, name: NAMES[kind], model },
  };
}

/**
 * Codex writes and Claude reviews when both are signed in (the eval's setup); with one, it does
 * both and reviews in a fresh session. Null when neither is ready.
 */
export function pickPlanSeats(providers: ReadonlyArray<ServerProvider>): {
  readonly writer: PlanSeat;
  readonly reviewer: PlanSeat;
  readonly sameProvider: boolean;
} | null {
  const usable = providers.filter(ready);
  const of = (kind: PlanProvider) => usable.find((provider) => DRIVERS[provider.driver] === kind);
  const writer = of("codex") ?? of("claude");
  if (writer === undefined) return null;
  const writerKind = DRIVERS[writer.driver]!;
  const other = of(writerKind === "codex" ? "claude" : "codex");
  const reviewer = other ?? writer;
  const reviewerKind = DRIVERS[reviewer.driver]!;
  return {
    writer: seat(writer, { model: DEFAULT_MODELS[writerKind], effort: "medium" }),
    reviewer: seat(reviewer, REVIEW_DEFAULTS[reviewerKind]),
    sameProvider: other === undefined,
  };
}

/** "write", "review:2", "fix:1", "shorten" as a step of the progress line. */
export function stepOf(step: string): { readonly step: TeamPlanStep; readonly round: number } {
  const [kind, round] = step.split(":");
  const number = Number(round ?? 0) || 0;
  if (kind === "review") return { step: "reviewing", round: number };
  if (kind === "fix") return { step: "fixing", round: number };
  if (kind === "shorten") return { step: "shortening", round: 0 };
  return { step: "writing", round: 0 };
}

export function planView(result: PlanResult): TeamPlanView {
  const markdown = renderPlan(result.plan, result.decisions);
  return {
    title: result.plan.title,
    size: result.size,
    markdown,
    words: wordCount(markdown),
    scores: result.rounds.map((round) => round.score),
    changes: result.log.map((entry) => ({
      round: entry.round,
      severity: entry.severity,
      from: entry.from,
      point: entry.point,
      outcome: entry.outcome,
      reason: entry.reason,
    })),
    nits: result.rounds.flatMap((round) => round.problems).filter((p) => p.severity === "nit")
      .length,
  };
}
