// team-layer: Codex tools (MCP servers) the user chose "Don't use in this app" for, and the
// once-per-run chat line for a tool that failed to start. TeamSetup loads the choices at startup
// and on each change; codexAppServerArgs reads them when it starts a Codex app-server, so a
// choice applies to Codex sessions started after it.
let offInApp: ReadonlyArray<string> = [];
const noticed = new Set<string>();

export function setCodexToolsOffInApp(names: ReadonlyArray<string>): void {
  offInApp = [...new Set(names)].sort();
}

export const codexToolsOffInApp = (): ReadonlyArray<string> => offInApp;

/** `mcp_servers={}` merges into the user's config; quoted keys keep dotted names whole. */
export function codexToolsOffArgs(): ReadonlyArray<string> {
  if (offInApp.length === 0) return [];
  const table = offInApp.map((name) => `${JSON.stringify(name)}={enabled=false}`).join(",");
  return ["-c", `mcp_servers={${table}}`];
}

const NEEDS_SIGN_IN = /auth|log ?in|logged|unauthori[sz]ed|401|token/iu;

/** The chat line for a tool that failed to start, or null once it was shown in this run. */
export function codexToolStartupNotice(
  name: string,
  error: string,
): { readonly title: string; readonly message: string } | null {
  if (noticed.has(name)) return null;
  noticed.add(name);
  return NEEDS_SIGN_IN.test(error)
    ? {
        title: `Codex tool “${name}” needs sign-in`,
        message: `Codex tool “${name}” needs sign-in. Sign in or stop using it in Settings → Check my setup.`,
      }
    : {
        title: `Codex tool “${name}” didn't start`,
        message: `Codex tool “${name}” didn't start: ${error}`,
      };
}
