// team-layer: the plan, warning and question cards in a chat's timeline (team/V2_PORT_PLAN.md D1).
import type { TeamCard } from "@t3tools/client-runtime/work-log/team-cards";
import { use } from "react";

import { TimelineRowCtx } from "../chat/timelineRowContext";
import { TeamChoiceCard } from "./TeamChoiceCard";
import { TeamPlanCard } from "./TeamPlanCard";
import { TeamQuestionCard } from "./TeamQuestionCard";

export function TeamCardTimelineRow({ card }: { card: TeamCard }) {
  const ctx = use(TimelineRowCtx);
  return (
    <div className="min-w-0 px-1 py-0.5">
      {card.kind === "plan" ? (
        <TeamPlanCard plan={card.plan} resolvedTheme={ctx.resolvedTheme} />
      ) : card.kind === "question" ? (
        <TeamQuestionCard card={card.card} environmentId={ctx.activeThreadEnvironmentId} />
      ) : (
        <TeamChoiceCard
          card={card.card}
          environmentId={ctx.activeThreadEnvironmentId}
          resolvedTheme={ctx.resolvedTheme}
        />
      )}
    </div>
  );
}
