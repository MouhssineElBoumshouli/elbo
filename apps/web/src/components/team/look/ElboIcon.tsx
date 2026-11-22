// team-layer: Elbo's app icon (assets/team) wherever the app shows its mark: the rail, chat events,
// standalone pages. Its white tile in dark mode lives in elbo.css.
import type { HTMLAttributes } from "react";

import elboIconUrl from "../../../../../../assets/team/elbo-192.png";
import { cn } from "~/lib/utils";

export function ElboIcon({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      data-elbo-icon=""
      className={cn("inline-flex shrink-0 items-center justify-center", className)}
    >
      <img src={elboIconUrl} alt="" />
    </span>
  );
}
