import { describe, it, expect } from "vitest";
import {
  extractSlashRunnerEmbeds,
  injectSlashRunnerEmbeds,
} from "../chatHtmlHelpers";

function processText(str: string): string {
  str = str.replace(/(<[^>]+>)|(["“”][^"“”]+["“”])/g, (_match, tag, quote) => {
    if (tag) return tag;
    return `<span class="dialogue">${quote}</span>`;
  });
  return str;
}

describe("ChatHtmlBubble text processing", () => {
  it("should process Chinese quotation marks correctly", () => {
    const input = "这是一段“中文引号”的测试";
    const expected = "这是一段<span class=\"dialogue\">“中文引号”</span>的测试";
    expect(processText(input)).toBe(expected);
  });

  it("should extract and replace html doc code fences with iframe embeds", () => {
    const input = `
<screen>content</screen>
\`\`\`html
<!DOCTYPE html>
<html><body><div>demo</div></body></html>
\`\`\`
<speech>done</speech>
`;
    const { cleaned, embeds } = extractSlashRunnerEmbeds(input);
    expect(embeds).toHaveLength(1);
    expect(cleaned).toContain("__SLASH_RUNNER_HTML_BLOCK_0__");
    expect(cleaned).not.toContain("<!DOCTYPE html>");

    const injected = injectSlashRunnerEmbeds(cleaned, embeds);
    expect(injected).toContain("data-embedded-html");
    expect(injected).toContain("<iframe");
  });

  it("should ignore non-html code fences", () => {
    const input = "```js\nconsole.log('hi')\n```";
    const { cleaned, embeds } = extractSlashRunnerEmbeds(input);
    expect(embeds).toHaveLength(0);
    expect(cleaned).toContain("```js");

    const injected = injectSlashRunnerEmbeds(cleaned, embeds);
    expect(injected).toContain("```js");
  });
});
