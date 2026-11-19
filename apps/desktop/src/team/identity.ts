// team-layer: Elbo's own app identity. The desktop app and scripts/build-desktop-artifact.ts read it,
// so Elbo installs next to T3 Code without sharing data. Plain values only: the build script imports this file.
export const TEAM_IDENTITY = {
  name: "Elbo",
  basedOn: { name: "T3 Code", version: "0.1.10" },
  appId: "io.github.mouhssineelboumshouli.elbo",
  devAppId: "io.github.mouhssineelboumshouli.elbo.dev",
  // Also names the per-user install folder (%LOCALAPPDATA%\Programs\elbo) and the updater cache.
  packageName: "elbo",
  homeDirName: ".elbo",
  profileFolder: "elbo",
  devProfileFolder: "elbo-dev",
  protocol: "elbo",
  devProtocol: "elbo-dev",
  cliName: "elbo",
  installerArtifactName: "Elbo-${version}-${arch}.${ext}",
  updateRepository: "MouhssineElBoumshouli/t3code",
  cloudEnabled: false,
} as const;

// What upstream T3 Code uses today; the identity test fails if any of ours matches.
export const T3_CODE_IDENTITY = {
  appIds: ["com.t3tools.t3code", "com.t3tools.t3code.dev"],
  packageName: "t3code",
  homeDirName: ".t3",
  profileFolders: ["t3code", "t3code-v2", "t3code-dev", "T3 Code (Alpha)", "T3 Code (Dev)"],
  protocols: ["t3code", "t3code-dev"],
  cliName: "t3",
  installerArtifactName: "T3-Code-${version}-${arch}.${ext}",
} as const;
