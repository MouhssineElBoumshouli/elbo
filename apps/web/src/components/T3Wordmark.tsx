import type { HTMLAttributes } from "react";
import { ElboIcon } from "./team/look/ElboIcon"; // team-layer

// team-layer: Elbo's icon wherever upstream drew T3's wordmark (chat events, standalone pages).
export function T3Wordmark(props: HTMLAttributes<HTMLSpanElement>) {
  return <ElboIcon {...props} />;
}
