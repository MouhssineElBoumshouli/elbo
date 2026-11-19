import { describe, expect, it } from "vitest";

import { T3_CODE_IDENTITY, TEAM_IDENTITY } from "./identity.ts";

describe("TEAM_IDENTITY", () => {
  it("shares no identity value with T3 Code", () => {
    const t3 = [
      ...T3_CODE_IDENTITY.appIds,
      T3_CODE_IDENTITY.packageName,
      T3_CODE_IDENTITY.homeDirName,
      ...T3_CODE_IDENTITY.profileFolders,
      ...T3_CODE_IDENTITY.protocols,
      T3_CODE_IDENTITY.cliName,
      T3_CODE_IDENTITY.installerArtifactName,
    ].map((value) => value.toLowerCase());
    const ours = [
      TEAM_IDENTITY.appId,
      TEAM_IDENTITY.devAppId,
      TEAM_IDENTITY.packageName,
      TEAM_IDENTITY.homeDirName,
      TEAM_IDENTITY.profileFolder,
      TEAM_IDENTITY.devProfileFolder,
      TEAM_IDENTITY.protocol,
      TEAM_IDENTITY.devProtocol,
      TEAM_IDENTITY.cliName,
      TEAM_IDENTITY.installerArtifactName,
    ];
    for (const value of ours) expect(t3).not.toContain(value.toLowerCase());
    expect(TEAM_IDENTITY.cloudEnabled).toBe(false);
  });
});
