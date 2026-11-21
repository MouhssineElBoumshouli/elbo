// @effect-diagnostics nodeBuiltinImport:off - Reads the preload sources synchronously while walking their imports.
import * as NodeFS from "node:fs";
import * as NodePath from "node:path";

import { describe, expect, it } from "vite-plus/test";

import { bundleIntoSandboxedPreload } from "./sandboxedPreload.ts";

const desktopSrc = NodePath.resolve(import.meta.dirname, "..");
const packagesDir = NodePath.resolve(desktopSrc, "../../../packages");

const RUNTIME_IMPORT = /^\s*(?:import|export)\s+(?!type\s)(?:[^;"']*?\sfrom\s+)?["']([^"']+)["']/gm;

function resolveWorkspaceImport(specifier: string): string {
  const [scope, name, ...rest] = specifier.split("/");
  const packageDir = NodePath.join(packagesDir, name!);
  const manifest = JSON.parse(
    NodeFS.readFileSync(NodePath.join(packageDir, "package.json"), "utf8"),
  );
  const entry = manifest.exports[["."].concat(rest).join("/")];
  if (entry === undefined) throw new Error(`${scope}/${name} has no export for ${specifier}`);
  return NodePath.join(packageDir, typeof entry === "string" ? entry : entry.import);
}

/** Bare specifiers the built preload would still `require` at runtime. */
function unbundledRequires(entry: string): string[] {
  const seen = new Set<string>();
  const left = new Set<string>();
  const visit = (file: string) => {
    if (seen.has(file)) return;
    seen.add(file);
    for (const [, specifier] of NodeFS.readFileSync(file, "utf8").matchAll(RUNTIME_IMPORT)) {
      if (specifier!.startsWith(".")) visit(NodePath.resolve(NodePath.dirname(file), specifier!));
      else if (!bundleIntoSandboxedPreload(specifier!)) left.add(specifier!);
      else if (specifier!.startsWith("@t3tools/")) visit(resolveWorkspaceImport(specifier!));
    }
  };
  visit(entry);
  return [...left].toSorted();
}

describe("main window preload", () => {
  it("requires nothing but electron at runtime", () => {
    expect(unbundledRequires(NodePath.join(desktopSrc, "preload.ts"))).toEqual(["electron"]);
  });
});
