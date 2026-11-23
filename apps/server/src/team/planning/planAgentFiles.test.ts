import { assert, describe, it } from "@effect/vitest";

import {
  mergeAgentsFile,
  mergeClaudeFile,
  ownInstructionLines,
  planAgentsSection,
  ruleConflict,
} from "./planAgentFiles.ts";

const rules = ["Use Django for the server. (plan decision 0001)"];

describe("AGENTS.md section", () => {
  it("is short, points at the plan and lists the code rules", () => {
    const section = planAgentsSection(
      Array.from({ length: 12 }, (_, index) => `Rule ${index + 1}.`),
    );
    assert.isAtMost(section.split("\n").length, 16);
    assert.include(section, "`.team/plan.md`");
    assert.include(section, "don't go against an active decision without asking");
    assert.include(section, "- Rule 8.");
    assert.include(section, "…and 4 more in `.team/rulebook.md`.");
  });

  it("creates, appends, or replaces only Elbo's section", () => {
    const created = mergeAgentsFile(null, rules);
    assert.isTrue(created.startsWith("<!-- elbo:plan:start -->"));

    const own = "# Shop\n\nRun `npm test` before committing.\n";
    const appended = mergeAgentsFile(own, rules);
    assert.isTrue(appended.startsWith(own));
    assert.include(appended, "Use Django for the server.");

    const around = `# Shop\n\n${planAgentsSection(["Old rule."])}\n\n## Testing\n\nRun \`npm test\`.\n`;
    const replaced = mergeAgentsFile(around, rules);
    assert.notInclude(replaced, "Old rule.");
    assert.strictEqual(replaced.split("<!-- elbo:plan:start -->").length, 2);
    assert.isTrue(replaced.startsWith("# Shop\n\n"));
    assert.isTrue(replaced.endsWith("\n\n## Testing\n\nRun `npm test`.\n"));
    assert.strictEqual(mergeAgentsFile(replaced, rules), replaced);
  });
});

describe("CLAUDE.md import", () => {
  it("creates it, adds the import at the top once, and leaves an importing file alone", () => {
    assert.strictEqual(mergeClaudeFile(null), "@AGENTS.md\n");
    const own = "# Notes for Claude\n\nPrefer small commits.\n";
    const added = mergeClaudeFile(own)!;
    assert.isTrue(added.startsWith("<!-- elbo:agents:start -->\n@AGENTS.md\n"));
    assert.isTrue(added.endsWith(own));
    assert.isNull(mergeClaudeFile(added));
    assert.isNull(mergeClaudeFile("Intro.\n@./AGENTS.md\n"));
  });
});

describe("rule conflicts", () => {
  const own = ownInstructionLines([
    `# Shop\n\n- Never use React.\n- Keep commits small.\n\n${planAgentsSection(["Use React."])}`,
    "@AGENTS.md\nStore secrets only in the .env file.",
  ]);

  it("reads only the person's own lines", () => {
    assert.deepStrictEqual(own, [
      "Never use React.",
      "Keep commits small.",
      "Store secrets only in the .env file.",
    ]);
  });

  it("flags a rule that says the opposite about the same thing", () => {
    assert.strictEqual(ruleConflict("Use React for the page.", own), "Never use React.");
    assert.isNull(ruleConflict("Store passwords only as Django password hashes.", own));
    assert.isNull(ruleConflict("Never use jQuery.", own));
    // A rule with a "no" in its other half still says "use SQLite".
    const sqlite = ["Never use SQLite in this project; the school gives us PostgreSQL."];
    assert.strictEqual(
      ruleConflict("Use SQLite through the Django ORM; write no raw SQL.", sqlite),
      sqlite[0],
    );
    assert.isNull(ruleConflict("Store passwords only as Django password hashes.", sqlite));
  });
});
