/**
 * `team-plan.ts --save-to`: saves a plan.json into a project folder through the same TeamPlanSave
 * service the agent's `team_save_plan` tool uses. The team state comes from a dev home (default
 * ~/.t3-dev), never the real install.
 */
import * as NodeOS from "node:os";

import * as NodeCrypto from "@effect/platform-node/NodeCrypto";
import { EnvironmentId, ThreadId } from "@t3tools/contracts";
import * as NetService from "@t3tools/shared/Net";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Option from "effect/Option";
import * as Path from "effect/Path";

import { resolveCliAuthConfig } from "../src/cli/config.ts";
import { teamStateLayer } from "../src/cli/team.ts";
import * as ServerConfig from "../src/config.ts";
import * as ServerEnvironment from "../src/environment/ServerEnvironment.ts";
import { openProjectTeam } from "../src/mcp/toolkits/team/resolve.ts";
import { readPlanFile } from "../src/team/planning/planFiles.ts";
import * as TeamPlanSave from "../src/team/planning/planSaveService.ts";
import * as GitTeamService from "../src/team/state/GitTeamService.ts";
import { TeamService } from "../src/team/TeamService.ts";

export const DEV_HOME = NodeOS.homedir() + "/.t3-dev";

/** The dev home's team state, built the way `elbo team` builds it. */
const saveLayer = (config: ServerConfig.ServerConfig["Service"]) =>
  TeamPlanSave.layer.pipe(
    Layer.provideMerge(
      Layer.effect(
        TeamService,
        Effect.gen(function* () {
          const identity = yield* ServerEnvironment.ServerEnvironmentIdentity;
          return yield* GitTeamService.make({
            environmentId: yield* identity.getEnvironmentId,
            stateDirectory: `${config.stateDir}/team`,
          });
        }),
      ),
    ),
    Layer.provideMerge(teamStateLayer(config)),
    Layer.provideMerge(Layer.mergeAll(NodeCrypto.layer, NetService.layer)),
  );

export const saveToProject = Effect.fn("teamPlan.saveToProject")(function* (input: {
  readonly planFile: string;
  readonly projectFolder: string;
  readonly homeDir: string;
  readonly dryRun: boolean;
}) {
  const path = yield* Path.Path;
  const config = yield* resolveCliAuthConfig(
    { baseDir: Option.some(input.homeDir) },
    Option.none(),
  ).pipe(Effect.provide(NetService.layer));
  return yield* Effect.gen(function* () {
    const folder = path.resolve(input.projectFolder);
    const opened = yield* openProjectTeam({
      workingFolder: folder,
      projectRoot: folder,
      projectName: path.basename(folder),
      // No chat is saving: claims are not touched, so any thread names the caller.
      thread: {
        environmentId: EnvironmentId.make("plan-runner"),
        threadId: ThreadId.make("plan-runner"),
      },
    });
    if (opened._tag === "NotInTeam") return opened.result.message;
    const planSave = yield* TeamPlanSave.TeamPlanSave;
    const target = {
      teamRoot: opened.context.teamRoot,
      teamId: opened.context.teamFile.teamId,
      member: opened.context.member,
      plan: yield* readPlanFile(input.planFile),
      tellAgents: true,
    };
    const outcome = yield* input.dryRun ? planSave.preview(target) : planSave.save(target);
    return `${input.dryRun ? "Preview (nothing written)" : "Saved"} in ${folder}${opened.context.solo ? " (solo team)" : ""}:\n${outcome.text}`;
  }).pipe(Effect.provide(saveLayer(config)));
});
