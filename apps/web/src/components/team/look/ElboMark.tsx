// team-layer: Elbo's "e" (assets/team, team/scripts/make-icons.mjs) as a one-color glyph, drawn in
// the text color wherever upstream drew T3's wordmark.
import type { SVGProps } from "react";

export function ElboMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="200 200 624 624" xmlns="http://www.w3.org/2000/svg">
      <g fill="none" stroke="currentColor" strokeWidth="148">
        <path d="M 742 512 A 230 230 0 1 0 700.4 644" />
        <path d="M 282 512 H 806" />
      </g>
    </svg>
  );
}
