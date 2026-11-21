// team-layer: Elbo's own app identity, the one place for it. Desktop, web, shared link parsers and
// scripts/build-desktop-artifact.ts read it, so Elbo installs next to T3 Code without sharing data.
export const TEAM_IDENTITY = {
  name: "Elbo",
  basedOn: { name: "T3 Code", version: "0.1.10" },
  // The next Stable. Betas build as `<nextVersion>-nightly.<date>.<run>`; bump it after each Stable.
  nextVersion: "1.0.0",
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
  author: "Mouhssine El Boumshouli",
  cloudEnabled: false,
  // Off means nothing about usage leaves the app: no analytics key, host, device id or owner lookup.
  usageData: false,
} as const;

/** Stable is plain "Elbo"; upstream's nightly channel is our Beta. Takes desktop and web stage labels. */
export function teamDisplayName(stageLabel: string): string {
  const stage = stageLabel.trim().toLowerCase();
  if (stage === "dev") return `${TEAM_IDENTITY.name} (Dev)`;
  if (stage === "nightly") return `${TEAM_IDENTITY.name} (Beta)`;
  return TEAM_IDENTITY.name;
}

/** Matches Elbo's link schemes (elbo:, elbo-dev:) and, for links T3 Code tools still write, T3 Code's. */
export const TEAM_APP_LINK_PROTOCOL = new RegExp(
  `^(?:t3code|${TEAM_IDENTITY.protocol})(?:-[a-z]+)?:$`,
);

export const TEAM_PRIVACY_LINE = `${TEAM_IDENTITY.name} collects no usage data. It sends nothing about how you use it to us, to T3 Code or to anyone else. The AI tools you connect, such as Claude and Codex, have their own privacy policies.`;

export const TEAM_ABOUT_LINE = `${TEAM_IDENTITY.name}, based on ${TEAM_IDENTITY.basedOn.name} v${TEAM_IDENTITY.basedOn.version}`;

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
