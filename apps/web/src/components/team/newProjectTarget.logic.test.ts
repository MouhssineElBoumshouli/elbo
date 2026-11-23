import { describe, expect, it } from "vite-plus/test";

import { newProjectTarget, pickedProjectsFolder } from "./newProjectTarget.logic";

describe("newProjectTarget", () => {
  it("reads a typed folder before the name, else uses the picked folder or the default", () => {
    expect(newProjectTarget("~/code/club shop", null)).toEqual({
      name: "club shop",
      parentFolder: "~/code",
    });
    expect(newProjectTarget("C:\\Users\\sara\\Shop", null)).toEqual({
      name: "Shop",
      parentFolder: "C:\\Users\\sara",
    });
    expect(newProjectTarget("Shop", "/srv/apps")).toEqual({
      name: "Shop",
      parentFolder: "/srv/apps",
    });
    expect(newProjectTarget("Shop", null)).toEqual({ name: "Shop", parentFolder: null });
    expect(pickedProjectsFolder("\\\\wsl.localhost\\Ubuntu\\home\\sara\\code")).toBe(
      "/home/sara/code",
    );
  });
});
