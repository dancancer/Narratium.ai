export const SLASH_RUNNER_PLACEHOLDER_PREFIX = "__SLASH_RUNNER_HTML_BLOCK_";
export const SLASH_RUNNER_STYLES =
  ".slash-runner-embed{margin:12px 0;border:1px solid rgba(136,17,68,0.3);border-radius:8px;overflow:hidden;background:rgba(0,0,0,0.35);} .slash-runner-embed iframe{display:block;width:100%;border:0;min-height:240px;background:#0b0b0b;}";
export const SLASH_RUNNER_SCRIPT = `
const slashRunnerEmbeds = new Set();
function resizeSlashRunnerEmbeds() {
  document.querySelectorAll('iframe[data-embedded-html]').forEach((frame) => {
    try {
      const doc = frame.contentDocument;
      if (!doc) return;
      const h = doc.documentElement.scrollHeight || doc.body.scrollHeight || 0;
      if (h > 0) {
        frame.style.height = Math.max(240, Math.min(h + 10, 1600)) + 'px';
      }
    } catch (_) {}
  });
}
function bindSlashRunnerEmbeds() {
  document.querySelectorAll('iframe[data-embedded-html]').forEach((frame) => {
    if (slashRunnerEmbeds.has(frame)) return;
    slashRunnerEmbeds.add(frame);
    frame.addEventListener('load', () => {
      resizeSlashRunnerEmbeds();
      debounceCalculation(checkSizeChanges);
    });
  });
  resizeSlashRunnerEmbeds();
}
bindSlashRunnerEmbeds();
const slashRunnerObserver = new MutationObserver(() => bindSlashRunnerEmbeds());
slashRunnerObserver.observe(document.body, { childList: true, subtree: true });
`;

export function isCompleteHtmlDocument(str: string): boolean {
  const trimmed = str.trim().toLowerCase();
  return (
    trimmed.includes("<!doctype html") ||
    (trimmed.startsWith("<html") && trimmed.includes("</html>"))
  );
}

export function extractSlashRunnerEmbeds(input: string): {
  cleaned: string;
  embeds: string[];
} {
  const embeds: string[] = [];
  const cleaned = input.replace(
    /```(?:html)?\s*([\s\S]*?)```/g,
    (match, content) => {
      const trimmed = content.trim();
      if (!isCompleteHtmlDocument(trimmed)) {
        return match;
      }
      const idx = embeds.length;
      embeds.push(trimmed);
      return `${SLASH_RUNNER_PLACEHOLDER_PREFIX}${idx}__`;
    },
  );
  return { cleaned, embeds };
}

export function escapeForSrcdoc(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function injectSlashRunnerEmbeds(
  html: string,
  embeds: string[],
): string {
  let output = html;
  embeds.forEach((embed, index) => {
    const placeholder = `${SLASH_RUNNER_PLACEHOLDER_PREFIX}${index}__`;
    const encoded = escapeForSrcdoc(embed);
    const iframe = `<div class="slash-runner-embed"><iframe data-embedded-html="true" loading="lazy" sandbox="allow-scripts allow-same-origin" srcdoc="${encoded}"></iframe></div>`;
    output = output.replace(placeholder, iframe);
  });
  return output;
}
