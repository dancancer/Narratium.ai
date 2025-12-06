import { inlineCssVariables } from "@/lib/utils/css-variable-inliner";

export const SLASH_RUNNER_PLACEHOLDER_PREFIX = "__SLASH_RUNNER_HTML_BLOCK_";

export const SLASH_RUNNER_STYLES = inlineCssVariables(
  ".slash-runner-embed{margin:12px 0;border:1px solid color-mix(in srgb, var(--color-danger) 30%, transparent);border-radius:8px;overflow:hidden;background:color-mix(in srgb, var(--color-canvas) 35%, transparent);} .slash-runner-embed iframe{display:block;width:100%;border:0;min-height:240px;background:var(--color-canvas);}",
);

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
  const replacements: Array<[RegExp, string]> = [
    [/&/g, "&amp;"],
    [/</g, "&lt;"],
    [/>/g, "&gt;"],
    [/"/g, "&quot;"],
    [/'/g, "&#39;"],
  ];
  
  let result = html;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

/**
 * Injects transparent background styles into HTML content
 */
function injectTransparentBackground(html: string): string {
  // Remove or modify color-scheme meta tag that might cause default backgrounds
  let processedHtml = html.replace(
    /<meta\s+name=["']color-scheme["']\s+content=["'][^"']*["']\s*\/?>/gi,
    "<meta name=\"color-scheme\" content=\"dark\">",
  );
  
  // If no color-scheme meta was found, we still use the original html
  if (processedHtml === html) {
    // No replacement happened, but we'll add our own meta tag
    const headMatch = /<head[^>]*>/i.exec(html);
    if (headMatch) {
      processedHtml = html.replace(
        /<head[^>]*>/i,
        "$&<meta name=\"color-scheme\" content=\"dark\">",
      );
    }
  }
  
  // Check if there's already a <style> tag in the <head>
  const headStyleRegex = /(<head[^>]*>)/i;
  const transparentStyles = `
    <style>
      :root, html, body {
        background: transparent !important;
        background-color: transparent !important;
        color-scheme: dark;
      }
      /* Ensure no element has a default background */
      :root::before, :root::after,
      html::before, html::after,
      body::before, body::after {
        background: transparent !important;
      }
    </style>
  `;
  
  if (headStyleRegex.test(processedHtml)) {
    // Insert after <head> tag
    return processedHtml.replace(headStyleRegex, `$1${transparentStyles}`);
  } else {
    // If no <head> tag, try to insert after <html>
    const htmlTagRegex = /(<html[^>]*>)/i;
    if (htmlTagRegex.test(processedHtml)) {
      return processedHtml.replace(htmlTagRegex, `$1${transparentStyles}`);
    } else {
      // If no <html> tag either, just prepend it
      return transparentStyles + processedHtml;
    }
  }
}

export const SLASH_RUNNER_API_SHIM = `
<script>
  (function() {
    const logs = [];
    function sendMessage(type, payload) {
      window.parent.postMessage({
        type,
        payload,
        timestamp: Date.now(),
        origin: window.location.origin
      }, '*');
    }

    function log(...args) {
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      logs.push(message);
      console.log('[SlashRunner]', ...args);
      sendMessage('CONSOLE_LOG', { message, args });
    }

    const variableCache = {};

    window.Narratium = {
      version: '1.0.0',
      variables: {
        get: (key) => {
          return variableCache[key];
        },
        set: (key, value) => {
          variableCache[key] = value; // Optimistic update
          sendMessage('API_CALL', { method: 'setVariable', args: [key, value] });
        },
        delete: (key) => {
          delete variableCache[key]; // Optimistic update
          sendMessage('API_CALL', { method: 'deleteVariable', args: [key] });
        },
        list: () => Object.keys(variableCache)
      },
      events: {
        on: (event, handler) => {
          window.addEventListener('narratium:' + event, (e) => handler(e.detail));
        },
        once: (event, handler) => {
          const wrapper = (e) => {
            handler(e.detail);
            window.removeEventListener('narratium:' + event, wrapper);
          };
          window.addEventListener('narratium:' + event, wrapper);
        },
        off: (event, handler) => {
          // Simplified off - requires keeping track of wrappers if we want full support
        },
        emit: (event, data) => {
          window.dispatchEvent(new CustomEvent('narratium:' + event, { detail: data }));
          sendMessage('EVENT_EMIT', { eventName: event, data });
        }
      },
      utils: {
        log: log,
        waitFor: (ms) => new Promise(r => setTimeout(r, ms))
      }
    };
    
    // Listen for events from parent
    window.addEventListener('message', (e) => {
      if (!e.data) return;
      
      if (e.data.type === 'EVENT_EMIT') {
        const { eventName, data } = e.data.payload;
        window.dispatchEvent(new CustomEvent('narratium:' + eventName, { detail: data }));
      } else if (e.data.type === 'UPDATE_VARIABLES') {
        Object.assign(variableCache, e.data.payload);
      }
    });
  })();
</script>
`;

export function injectSlashRunnerEmbeds(
  html: string,
  embeds: string[],
): string {
  let output = html;
  embeds.forEach((embed, index) => {
    const placeholder = `${SLASH_RUNNER_PLACEHOLDER_PREFIX}${index}__`;
    // Inject transparent background into the embed content
    const embedWithTransparentBg = injectTransparentBackground(embed);
    // Inject API shim
    const embedWithShim = SLASH_RUNNER_API_SHIM + embedWithTransparentBg;
    
    const encoded = escapeForSrcdoc(embedWithShim);
    const iframe = `<div class="slash-runner-embed"><iframe data-embedded-html="true" loading="lazy" sandbox="allow-scripts allow-same-origin" style="background: transparent;" srcdoc="${encoded}"></iframe></div>`;
    output = output.replace(placeholder, iframe);
  });
  return output;
}
