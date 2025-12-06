import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { rewriteIframeParentAccess } from "@/lib/utils/iframe-security";
import { MessageBridgeData } from "@/types/script-runner";

interface IframeRunnerProps {
  html: string;
  enableScript?: boolean;
  enableStreaming?: boolean;
  scriptVariables?: Record<string, any>;
  onScriptMessage?: (data: MessageBridgeData) => Promise<any> | any;
  onContentChange?: () => void;
  onHeightChange?: (height: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const IframeRunner: React.FC<IframeRunnerProps> = ({
  html,
  enableScript = false,
  enableStreaming = false,
  scriptVariables,
  onScriptMessage,
  onContentChange,
  onHeightChange,
  className,
  style,
}) => {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [isIframeReady, setIsIframeReady] = useState(false);
  
  // Process HTML for security
  const iframeSafeHtml = useMemo(() => rewriteIframeParentAccess(html), [html]);

  // Send content to iframe
  useEffect(() => {
    if (!frameRef.current?.contentWindow || !isIframeReady) return;

    const sendContent = () => {
      // Extract CSS variables
      const styles = getComputedStyle(document.documentElement);
      const cssVars: Record<string, string> = {};
      for (let i = 0; i < styles.length; i++) {
        const prop = styles[i];
        if (prop.startsWith("--")) {
          cssVars[prop] = styles.getPropertyValue(prop);
        }
      }

      frameRef.current?.contentWindow?.postMessage({
        __updateContent: true,
        html: iframeSafeHtml,
        enableStreaming,
        enableScript,
        cssVars,
      }, "*");
    };

    sendContent();
  }, [iframeSafeHtml, enableStreaming, enableScript, isIframeReady]);

  // Sync variables
  useEffect(() => {
    if (!frameRef.current || !scriptVariables) return;

    frameRef.current.contentWindow?.postMessage({
      type: "BROADCAST_TO_EMBEDS",
      payload: {
        type: "UPDATE_VARIABLES",
        payload: scriptVariables,
      },
    }, "*");
  }, [scriptVariables]);

  // Handle messages
  useEffect(() => {
    if (!frameRef.current) return;

    const handler = async (e: MessageEvent) => {
      if (e.source !== frameRef.current?.contentWindow) return;

      // Handle READY handshake
      if (e.data?.type === "READY") {
        setIsIframeReady(true);
        return;
      }

      // Handle script messages
      if (e.data && (e.data.type === "API_CALL" || e.data.type === "EVENT_EMIT" || e.data.type === "CONSOLE_LOG")) {
        if (onScriptMessage) {
          try {
            const result = await onScriptMessage(e.data);
            
            if (e.data.id && e.data.type === "API_CALL") {
              frameRef.current?.contentWindow?.postMessage({
                type: "API_RESPONSE",
                id: e.data.id,
                payload: { result },
              }, "*");
            }
          } catch (error: any) {
            if (e.data.id && e.data.type === "API_CALL") {
              frameRef.current?.contentWindow?.postMessage({
                type: "API_RESPONSE",
                id: e.data.id,
                payload: { error: error.message || String(error) },
              }, "*");
            }
          }
        }
      }

      // Handle height updates
      if (typeof e.data === "object" && e.data.__chatBubbleHeight) {
        if (frameRef.current) {
          frameRef.current.style.height = `${e.data.__chatBubbleHeight + 30}px`;
          onHeightChange?.(e.data.__chatBubbleHeight + 30);
          onContentChange?.();
        }
      }
    };

    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [onScriptMessage, onContentChange, onHeightChange]);

  // Listen for global broadcast events
  useEffect(() => {
    if (!frameRef.current) return;

    const handleBroadcast = (e: CustomEvent) => {
      const { eventName, data } = e.detail;
      const payload = { eventName, data };
      
      // Send to main frame
      frameRef.current?.contentWindow?.postMessage({
        type: "EVENT_EMIT",
        payload,
      }, "*");
      
      // Broadcast to embeds
      frameRef.current?.contentWindow?.postMessage({
        type: "BROADCAST_TO_EMBEDS",
        payload: {
          type: "EVENT_EMIT",
          payload,
        },
      }, "*");
    };

    window.addEventListener("narratium:broadcast", handleBroadcast as EventListener);
    return () => window.removeEventListener("narratium:broadcast", handleBroadcast as EventListener);
  }, []);

  return (
    <iframe
      ref={frameRef}
      sandbox="allow-scripts allow-same-origin"
      src="/chat-bubble-frame.html"
      className={className}
      style={style}
    />
  );
};
