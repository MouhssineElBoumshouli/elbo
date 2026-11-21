/** team-layer: the quiet chat line for Codex tools that need sign-in (teamToolNotices.ts). */
import { useNavigate } from "@tanstack/react-router";
import { KeyRoundIcon } from "lucide-react";

import { WorkLogRow } from "../chat/WorkLog";
import { TEAM_SETUP_PATH } from "./rail/teamRail";

export function TeamToolNoticeRow(props: { readonly label: string }) {
  const navigate = useNavigate();
  return (
    <WorkLogRow
      data-team-tool-notice
      icon={<KeyRoundIcon aria-hidden className="size-4 text-icon-muted" />}
      label={
        <span className="flex min-w-0 items-baseline gap-2 text-sm text-muted-foreground">
          <span className="min-w-0 truncate">{props.label}</span>
          <button
            type="button"
            className="shrink-0 cursor-pointer rounded-sm text-xs text-foreground/80 underline decoration-border underline-offset-3 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
            onClick={() => void navigate({ to: TEAM_SETUP_PATH })}
          >
            Fix in Setup
          </button>
        </span>
      }
    />
  );
}
