import type { SVGProps } from "react";
import { ElboMark } from "./team/look/ElboMark"; // team-layer

// team-layer: Elbo's mark wherever upstream drew T3's wordmark (chat events, standalone pages).
export function T3Wordmark(props: SVGProps<SVGSVGElement>) {
  return <ElboMark {...props} />;
}
