/**
 * One heading style for both sides of a blind pair, so the layout does not tell which plan is
 * which. Every heading becomes `## `: Markdown headings of any level, a line that is only bold
 * text, and a short plain title line (no closing punctuation, a blank line before, text after).
 */
const LIST_OR_BLOCK = /^(?:[-*+>|]|\d+[.)]\s|```)/;
const CLOSING_PUNCTUATION = /[.,;:!?]$/;
const MAX_TITLE_WORDS = 10;

function titleOf(
  line: string,
  before: string | undefined,
  after: string | undefined,
): string | null {
  const text = line.trim();
  if (text.length === 0) return null;
  const heading = text.match(/^#{1,6}\s+(.+)$/)?.[1];
  if (heading !== undefined) return heading.trim();
  const bold = text.match(/^\*\*([^*]+?):?\*\*:?$/)?.[1];
  if (bold !== undefined) return bold.trim();
  const plainTitle =
    !LIST_OR_BLOCK.test(text) &&
    !CLOSING_PUNCTUATION.test(text) &&
    text.split(/\s+/).length <= MAX_TITLE_WORDS &&
    (before === undefined || before.trim().length === 0) &&
    after !== undefined &&
    after.trim().length > 0;
  return plainTitle ? text : null;
}

export function sameLayout(markdown: string): string {
  const lines = markdown.split("\n");
  let inCode = false;
  return lines
    .map((line, index) => {
      if (line.trim().startsWith("```")) inCode = !inCode;
      if (inCode) return line;
      const title = titleOf(line, lines[index - 1], lines[index + 1]);
      return title === null ? line : `## ${title}`;
    })
    .join("\n");
}
