import type { TeamPlanDecision, TeamPlanRunState } from "@t3tools/contracts";
import { describe, expect, it } from "vite-plus/test";

import { newestState, saveBlocked } from "./planDecisions.logic";

const decision = (title: string, status: TeamPlanDecision["status"]) =>
  ({ title, status }) as TeamPlanDecision;

describe("plan decisions", () => {
  it("blocks saving until no decision is open, naming the open ones", () => {
    expect(saveBlocked([decision("Database", "open"), decision("Hosting", "agreed")])).toBe(
      "1 decision still needs you: Database.",
    );
    expect(
      saveBlocked([decision("Database", "answered"), decision("Server", "against-advice")]),
    ).toBeNull();
  });

  it("keeps the newest copy of a run", () => {
    const state = (version: number) => ({ runId: "r", version }) as TeamPlanRunState;
    expect(newestState(state(3), state(4))?.version).toBe(4);
    expect(newestState(state(5), state(4))?.version).toBe(5);
    expect(newestState(null, state(1))?.version).toBe(1);
  });
});
