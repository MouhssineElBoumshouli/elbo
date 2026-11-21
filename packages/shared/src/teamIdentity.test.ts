import { describe, expect, it } from "vite-plus/test";

import { T3_CODE_IDENTITY, TEAM_IDENTITY, teamVersionLabel } from "./teamIdentity.ts";

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

describe("teamVersionLabel", () => {
  it("shows Elbo's next version for a build on upstream's 0.x package version", () => {
    expect(teamVersionLabel("0.1.9")).toBe(`${TEAM_IDENTITY.nextVersion} (dev build)`);
    expect(teamVersionLabel("1.0.0-nightly.20261121.3")).toBe("1.0.0-nightly.20261121.3");
    expect(teamVersionLabel("1.0.0")).toBe("1.0.0");
  });
});
