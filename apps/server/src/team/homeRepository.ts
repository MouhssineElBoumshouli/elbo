// team-layer: a Git repository at the user's home folder (often a stray `git init` there) would
// make every plain folder below it one huge repository: status, the diff preview and checkpoints
// would scan the whole profile. Folders below it count as outside any repository; the home folder
// itself and folders with their own repository are unaffected.
const normalize = (value: string, windows: boolean) => {
  const slashes = value.replaceAll("\\", "/").replace(/\/+$/u, "");
  return windows ? slashes.toLowerCase() : slashes;
};

export function isBelowHomeRepository(input: {
  readonly rootPath: string;
  readonly cwd: string;
  readonly homeDirectory: string;
  readonly platform: NodeJS.Platform;
}): boolean {
  if (input.homeDirectory.trim() === "") return false;
  const windows = input.platform === "win32";
  const home = normalize(input.homeDirectory, windows);
  return normalize(input.rootPath, windows) === home && normalize(input.cwd, windows) !== home;
}
