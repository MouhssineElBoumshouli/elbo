// team-layer: plain words for an upstream text while simple mode is on; upstream's (translated)
// text otherwise, so upstream's tests, which run with simple mode off, keep finding it.
import type { ReactNode } from "react";

import { useTeamSimpleMode } from "./simpleMode";

export function TeamPlain(props: { readonly words: string; readonly children: ReactNode }) {
  return useTeamSimpleMode() ? props.words : props.children;
}
