"use client";

import { useEffect, useRef, memo, useState, useCallback, useMemo } from "react";
import { useLanguage } from "@/app/i18n";
import {
  extractSlashRunnerEmbeds,
  injectSlashRunnerEmbeds,
} from "./chatHtmlHelpers";
import { globalRenderQueue, VirtualRenderQueue } from "@/lib/utils/virtual-render-queue";
import { convertMarkdown } from "@/lib/utils/markdown-converter";
import { replaceTags } from "@/lib/utils/tag-replacer";
import { rewriteIframeParentAccess } from "@/lib/utils/iframe-security";
import { clearColorCache } from "@/lib/utils/html-tag-processor";
import type { MessageBridgeData } from "@/types/script-runner";

import { IframeRunner } from "./ScriptExecutor/IframeRunner";

/**
 * TavernHelper Script Button Configuration
 */
interface TavernHelperScriptButton {
  name: string;
  visible: boolean;
}

/**
 * TavernHelper Script Value (full format from character card)
 */
interface TavernHelperScriptValue {
  id: string;
  name: string;
  content: string;
  info?: string;
  buttons?: TavernHelperScriptButton[];
  data?: Record<string, any>;
  enabled?: boolean;
}

/**
 * TavernHelper Script Entry (can be in different formats)
 */
type TavernHelperScript =
  | { type: "script"; value: TavernHelperScriptValue }  // New format with nested value
  | { name: string; content: string; enabled?: boolean; id?: string }  // Legacy simple format
  | TavernHelperScriptValue;  // Direct value format

interface Props {
  html: string;
  isLoading?: boolean;
  enableStreaming?: boolean;
  onContentChange?: () => void;
  enableScript?: boolean;
  onScriptMessage?: (data: MessageBridgeData) => void;
  scriptVariables?: Record<string, any>;
}

export default memo(function ChatHtmlBubble({
  html: rawHtml,
  isLoading = false,
  enableStreaming = false,
  onContentChange,
  enableScript = false,
  onScriptMessage,
  scriptVariables,
  scripts = [],
}: Props & { scripts?: TavernHelperScript[] }) {
  const [showLoader, setShowLoader] = useState(isLoading || rawHtml.trim() === "");
  const { serifFontClass } = useLanguage();

  // 虚拟队列集成用于渲染优化
  const renderQueueRef = useRef<VirtualRenderQueue>(globalRenderQueue);
  const lastProcessedHtmlRef = useRef<string>("");

  /**
   * Normalize TavernHelper script to a standard format
   * Handles both new format (with nested value) and legacy format
   */
  const normalizeScript = (script: TavernHelperScript): TavernHelperScriptValue | null => {
    // New format: { type: "script", value: {...} }
    if ("type" in script && script.type === "script" && "value" in script) {
      const value = script.value;
      // Check if enabled (default to true if not specified)
      if (value.enabled === false) return null;
      return value;
    }

    // Legacy or direct format: { name, content, ... }
    if ("name" in script && "content" in script) {
      // Check if enabled (default to true if not specified)
      if ("enabled" in script && script.enabled === false) return null;
      return {
        id: ("id" in script && script.id) ? script.id : `script-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: script.name,
        content: script.content,
        enabled: true,
      };
    }

    return null;
  };

  /**
   * Parse script content and generate appropriate script tags
   * Handles:
   * - import 'url' or import "url" - dynamic script loading
   * - Regular JavaScript code
   */
  const generateScriptTag = (script: TavernHelperScriptValue): string => {
    const { id, name, content, data } = script;
    const escapedName = name.replace(/'/g, "\\'").replace(/\n/g, "\\n");
    const escapedId = id.replace(/'/g, "\\'");

    // Check if content is an import statement: import 'url' or import "url"
    const importMatch = content.match(/^\s*import\s+['"](.+?)['"]\s*;?\s*$/);

    if (importMatch) {
      // Dynamic script loading via import URL
      const scriptUrl = importMatch[1];
      return `
        <script data-script-id="${escapedId}" data-script-name="${escapedName}">
          (function() {
            var scriptId = '${escapedId}';
            var scriptName = '${escapedName}';
            var scriptData = ${JSON.stringify(data || {})};

            // Report loading status
            if (window.reportScriptStatus) {
              window.reportScriptStatus(scriptName, 'loading');
            }

            // Create and load external script
            var script = document.createElement('script');
            script.src = '${scriptUrl}';
            script.async = true;
            script.dataset.scriptId = scriptId;
            script.dataset.scriptName = scriptName;

            // Expose script data for the loaded script to access
            window.__tavernHelperScriptData = window.__tavernHelperScriptData || {};
            window.__tavernHelperScriptData[scriptId] = {
              id: scriptId,
              name: scriptName,
              data: scriptData
            };

            script.onload = function() {
              console.log('[TavernHelper] Script loaded: ' + scriptName);
              if (window.reportScriptStatus) {
                window.reportScriptStatus(scriptName, 'success');
              }
            };

            script.onerror = function(e) {
              console.error('[TavernHelper] Failed to load script: ' + scriptName, e);
              if (window.reportScriptStatus) {
                window.reportScriptStatus(scriptName, 'error', 'Failed to load: ' + '${scriptUrl}');
              }
            };

            document.head.appendChild(script);
          })();
        </script>
      `;
    } else {
      // Regular inline JavaScript code
      return `
        <script data-script-id="${escapedId}" data-script-name="${escapedName}">
          (function() {
            var scriptId = '${escapedId}';
            var scriptName = '${escapedName}';
            var scriptData = ${JSON.stringify(data || {})};

            // Expose script data
            window.__tavernHelperScriptData = window.__tavernHelperScriptData || {};
            window.__tavernHelperScriptData[scriptId] = {
              id: scriptId,
              name: scriptName,
              data: scriptData
            };

            try {
              console.log('[TavernHelper] Executing script: ' + scriptName);
              ${content}
              if (window.reportScriptStatus) {
                window.reportScriptStatus(scriptName, 'success');
              }
            } catch (e) {
              console.error('[TavernHelper] Error in script ' + scriptName + ':', e);
              if (window.reportScriptStatus) {
                window.reportScriptStatus(scriptName, 'error', e.toString());
              }
            }
          })();
        </script>
      `;
    }
  };

  // 使用useMemo处理HTML，避免不必要的重新计算
  const processedHtml = useMemo(() => {
    const { cleaned, embeds } = extractSlashRunnerEmbeds(rawHtml);
    const md = convertMarkdown(cleaned);
    const tagged = replaceTags(md);
    const injected = injectSlashRunnerEmbeds(tagged, embeds);
    let result = injected.replace(/^[\s\r\n]+|[\s\r\n]+$/g, "");

    // Process TavernHelper scripts
    if (scripts && scripts.length > 0) {
      // Status reporter initialization
      const debugReporter = `
        <script>
          window.reportScriptStatus = function(name, status, error) {
            window.parent.postMessage({
              type: 'SCRIPT_STATUS',
              payload: { name: name, status: status, error: error }
            }, '*');
          };
          window.__tavernHelperScriptData = window.__tavernHelperScriptData || {};
        </script>
      `;

      // Normalize and filter enabled scripts
      const normalizedScripts = scripts
        .map(normalizeScript)
        .filter((s): s is TavernHelperScriptValue => s !== null);

      // Generate script tags
      const scriptTags = normalizedScripts
        .map(generateScriptTag)
        .join("\n");

      if (normalizedScripts.length > 0) {
        result = debugReporter + scriptTags + result;
      }
    }

    lastProcessedHtmlRef.current = result;
    return result;
  }, [rawHtml, scripts]);

  useEffect(() => {
    setShowLoader(isLoading || rawHtml.trim() === "");
    if (rawHtml.trim() !== "") {
      const t = setTimeout(() => setShowLoader(false), 250);
      return () => clearTimeout(t);
    }
  }, [rawHtml, isLoading]);

  // 清理
  useEffect(() => {
    clearColorCache();
    const queue = renderQueueRef.current;
    return () => {
      queue.clear();
    };
  }, []);

  if (showLoader) {
    return (
      <div className="flex flex-col items-center justify-center py-6 px-4">
        <div className={"text-sm-plus text-gray-400 font-medium leading-relaxed text-center "}>
          No response received. Please check your network connection or API configuration.
        </div>
      </div>
    );
  }

  return (
    <div className="chat-bubble-container max-w-[calc(100%-10px)] mx-auto">
      <style jsx>{`
        .chat-bubble-container {
          width: 100%;
          position: relative;
          max-width: 780px;
        }
        @media (max-width: 880px) {
          .chat-bubble-container {
            max-width: 100%;
          }
        }
        .iframe-wrapper {
          padding-bottom: 20px;
          margin-bottom: 10px;
        }
        /* 确保 iframe 背景透明 */
        .transparent-iframe {
          background-color: transparent !important;
          border: none;
        }
      `}</style>
      <div className="iframe-wrapper">
        <IframeRunner
          html={processedHtml}
          enableScript={enableScript}
          enableStreaming={enableStreaming}
          scriptVariables={scriptVariables}
          onScriptMessage={onScriptMessage}
          onContentChange={onContentChange}
          className="w-full border-0 overflow-hidden h-[150px] transparent-iframe"
          style={{ backgroundColor: "transparent" }}
        />
      </div>
    </div>
  );
});
