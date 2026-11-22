import * as NodeUtil from "node:util";

import * as NodeServices from "@effect/platform-node/NodeServices";
import * as Effect from "effect/Effect";

import { summarize } from "./report.ts";

const { values } = NodeUtil.parseArgs({ options: { out: { type: "string" } } });
if (!values.out) throw new Error("Pass --out <dir> of an earlier run.");
const outDir = values.out;

await Effect.runPromise(
  summarize(outDir).pipe(
    Effect.tap((cases) => Effect.logInfo(`Summarized ${cases} cases in ${outDir}`)),
    Effect.provide(NodeServices.layer),
  ),
);
