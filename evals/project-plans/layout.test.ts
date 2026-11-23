import { describe, expect, it } from "vite-plus/test";

import { sameLayout } from "./layout.ts";

describe("sameLayout", () => {
  it("turns every heading style into ##", () => {
    // Shapes from round 2's plain chats and round 3's writer.
    const plan = [
      "# 24-hour project plan",
      "",
      "**Release scope**",
      "- Recipes with photos.",
      "",
      "Day 1 — Working essentials (6 hours)",
      "1. Build the page. (1 hour)",
      "",
      "### Done checks",
      "- Add works.",
    ].join("\n");
    expect(sameLayout(plan)).toBe(
      [
        "## 24-hour project plan",
        "",
        "## Release scope",
        "- Recipes with photos.",
        "",
        "## Day 1 — Working essentials (6 hours)",
        "1. Build the page. (1 hour)",
        "",
        "## Done checks",
        "- Add works.",
      ].join("\n"),
    );
  });

  it("leaves sentences, list items, tables, a closing line and code alone", () => {
    const plan = [
      "Build a calm to-do page.",
      "",
      "Use three files",
      "",
      "| Week | Tasks |",
      "- Done means it works",
      "",
      "```",
      "Not a title",
      "here",
      "```",
      "",
      "Last short line",
    ].join("\n");
    expect(sameLayout(plan)).toBe(plan);
  });
});
