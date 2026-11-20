import { describe, expect, it } from "@effect/vitest";
import { TEAM_IDENTITY } from "@t3tools/shared/teamIdentity";

import { makeCli } from "../binCli.ts";

describe("elbo command", () => {
  const cli = makeCli({ cloudEnabled: false });
  const listed = cli.subcommands.flatMap((group) => group.commands).filter((c) => !c.unlisted);

  it("is named elbo, so --version prints `elbo v…`", () => {
    expect(cli.name).toBe(TEAM_IDENTITY.cliName);
    expect(cli.description).not.toMatch(/T3 Code|`t3/);
  });

  it("lists no subcommand that names T3 Code or the t3 command", () => {
    const leaks = listed.flatMap((command) =>
      [command.description, command.shortDescription]
        .filter((text) => text !== undefined && /T3 Code|T3's|`t3`|\bt3 /.test(text))
        .map((text) => `${command.name}: ${text}`),
    );
    expect(leaks).toEqual([]);
  });

  it("does not offer upstream's update, install or uninstall of `t3`", () => {
    for (const name of ["update", "install", "uninstall"]) {
      const command = listed.find((c) => c.name === name);
      expect(command?.description).toContain(TEAM_IDENTITY.name);
    }
  });
});
