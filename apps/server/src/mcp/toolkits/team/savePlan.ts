/**
 * `team_save_plan` (team/PLANNING_FEATURE_PLAN.md section 7): the agent saves a plan from Elbo's
 * planning into the calling thread's project. Without `apply` it only previews; the saving itself
 * is the team's `TeamPlanSave` service, shared with the planning runner.
 */
import * as Effect from "effect/Effect";
import type * as Path from "effect/Path";

import type { TeamPlanSave } from "../../../team/planning/planSaveService.ts";
import type { TeamContext } from "./resolve.ts";
import { TeamToolError, type TeamSavePlanResult } from "./tools.ts";

export const savePlanFor =
  (planSave: TeamPlanSave["Service"], path: Path.Path) =>
  (
    context: TeamContext,
    input: { readonly planFile: string; readonly apply?: boolean | undefined },
  ) => {
    const apply = input.apply === true;
    return (apply ? planSave.save : planSave.preview)({
      teamRoot: context.teamRoot,
      teamId: context.teamFile.teamId,
      member: context.member,
      planFile: path.resolve(context.workingFolder, input.planFile),
    }).pipe(
      Effect.map((outcome): TeamSavePlanResult => ({
        saved: apply,
        summary: apply
          ? `Saved.\n${outcome.text}`
          : `Nothing written yet. Show this to the user, then call again with apply: true to write it.\n${outcome.text}`,
      })),
      Effect.mapError((error) => new TeamToolError({ detail: error.detail })),
    );
  };
