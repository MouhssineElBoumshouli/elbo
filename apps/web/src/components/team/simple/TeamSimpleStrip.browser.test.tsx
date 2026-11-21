import { describe, expect, it } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { render } from "../../../../test/render";
import { requestTeamMoreMenu, TeamMoreMenu } from "./TeamSimpleStrip";

describe("TeamMoreMenu", () => {
  it("keeps its rows mounted while closed, so the branch picker sets the base branch", async () => {
    await using screen = await render(
      <TeamMoreMenu items={[{ label: "Branch", rows: <span>branch picker</span> }]} />,
    );
    expect(screen.getByRole("button", { name: "More: branch" })).toBeTruthy();
    expect(document.body.textContent).toContain("branch picker");
  });

  it("opens when a send asks for a choice from it", async () => {
    await using _screen = await render(
      <TeamMoreMenu items={[{ label: "Branch", rows: <span>branch picker</span> }]} />,
    );
    requestTeamMoreMenu();
    await expect.element(page.getByText("Branch", { exact: true })).toBeVisible();
  });
});
