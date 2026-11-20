import { describe, expect, it } from "@effect/vitest";

import { isBelowHomeRepository } from "./homeRepository.ts";

describe("isBelowHomeRepository", () => {
  it.each([
    // Git prints forward slashes on Windows; the home folder has backslashes and any case.
    [
      "C:/Users/Mouhssine",
      "C:\\Users\\Mouhssine\\Desktop\\elbo-test",
      "C:\\Users\\Mouhssine",
      "win32",
      true,
    ],
    [
      "c:/users/mouhssine",
      "C:\\Users\\Mouhssine\\Desktop",
      "C:\\Users\\Mouhssine\\",
      "win32",
      true,
    ],
    ["C:/Users/Mouhssine", "C:\\Users\\Mouhssine", "C:\\Users\\Mouhssine", "win32", false],
    [
      "C:/Users/Mouhssine/code/app",
      "C:\\Users\\Mouhssine\\code\\app\\src",
      "C:\\Users\\Mouhssine",
      "win32",
      false,
    ],
    ["/home/me", "/home/me/project", "/home/me", "linux", true],
    ["/home/me", "/home/me", "/home/me", "linux", false],
    // Linux paths are case-sensitive.
    ["/home/Me", "/home/me/project", "/home/me", "linux", false],
  ] as const)("root %s, cwd %s → %s", (rootPath, cwd, homeDirectory, platform, expected) => {
    expect(isBelowHomeRepository({ rootPath, cwd, homeDirectory, platform })).toBe(expected);
  });
});
