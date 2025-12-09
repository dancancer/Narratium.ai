/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         useScriptBridge Hook                               ║
 * ║                                                                            ║
 * ║  处理脚本事件桥接：变量管理、世界书访问、消息广播                            ║
 * ║  单一职责：脚本系统与 React 组件之间的通信层                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { useScriptVariables } from "@/lib/store/script-variables";
import { handleApiCall } from "./script-bridge";
import type { DialogueMessage } from "@/types/character-dialogue";
import type { ScriptMessageData } from "@/types/script-message";

// ============================================================================
//                              类型定义
// ============================================================================

export interface ScriptStatus {
  scriptName?: string;
  status: "running" | "completed" | "error";
  message?: string;
  timestamp: number;
}

interface UseScriptBridgeOptions {
  characterId?: string;
  characterName?: string;
  messages?: DialogueMessage[];
  maxStatusHistory?: number;
}

interface UseScriptBridgeReturn {
  scriptVariables: Record<string, unknown>;
  scriptStatuses: ScriptStatus[];
  handleScriptMessage: (data: ScriptMessageData) => Promise<unknown>;
  broadcastCharacterChange: () => void;
  broadcastMessage: (message: DialogueMessage) => void;
}

// ============================================================================
//                              主 Hook
// ============================================================================

export function useScriptBridge(options: UseScriptBridgeOptions): UseScriptBridgeReturn {
  const { characterId, characterName, messages = [], maxStatusHistory = 50 } = options;
  const [scriptStatuses, setScriptStatuses] = useState<ScriptStatus[]>([]);

  const {
    variables: scriptVariablesStore,
    setVariable: setScriptVariable,
    deleteVariable: deleteScriptVariable,
  } = useScriptVariables();

  // 合并全局和角色变量
  const scriptVariables: Record<string, unknown> = {
    ...scriptVariablesStore.global,
    ...(characterId ? scriptVariablesStore.character[characterId] : {}),
  };

  // ─── 处理脚本消息 ───
  const handleScriptMessage = useCallback(
    async (data: ScriptMessageData): Promise<unknown> => {
      const { type, payload = {} } = data;
      const getVariablesSnapshot = () => useScriptVariables.getState().variables;

      // 控制台日志
      if (type === "CONSOLE_LOG") {
        console.log("[Script]", ...((payload.args as unknown[]) || []));
        return undefined;
      }

      // API 调用 - 委托给 handler registry
      if (type === "API_CALL") {
        const { method = "", args = [] } = payload;
        return handleApiCall(method, args, {
          characterId,
          messages,
          setScriptVariable,
          deleteScriptVariable,
          getVariablesSnapshot,
        });
      }

      // 事件透传
      if (type === "EVENT_EMIT") {
        const eventName = (payload as Record<string, unknown>).eventName as string;
        const eventData = (payload as Record<string, unknown>).data;
        window.dispatchEvent(
          new CustomEvent(`narratium:${eventName}`, { detail: eventData })
        );
        return eventName;
      }

      // 脚本状态更新
      if (type === "SCRIPT_STATUS") {
        setScriptStatuses((prev) => {
          const newStatus: ScriptStatus = {
            ...payload,
            timestamp: Date.now(),
          } as ScriptStatus;
          return [newStatus, ...prev].slice(0, maxStatusHistory);
        });
        return undefined;
      }

      return undefined;
    },
    [characterId, messages, setScriptVariable, deleteScriptVariable, maxStatusHistory]
  );

  // ─── 广播角色变更 ───
  const broadcastCharacterChange = useCallback(() => {
    if (!characterId) return;
    window.dispatchEvent(
      new CustomEvent("narratium:broadcast", {
        detail: {
          eventName: "character:changed",
          data: { id: characterId, name: characterName },
        },
      })
    );
  }, [characterId, characterName]);

  // ─── 广播消息 ───
  const broadcastMessage = useCallback((message: DialogueMessage) => {
    const eventName = message.role === "user" ? "message:sent" : "message:received";
    window.dispatchEvent(
      new CustomEvent("narratium:broadcast", {
        detail: { eventName, data: message },
      })
    );
  }, []);

  // ─── 角色变更时广播 ───
  useEffect(() => {
    if (!characterId) return;
    window.dispatchEvent(
      new CustomEvent("narratium:broadcast", {
        detail: {
          eventName: "character:changed",
          data: { id: characterId, name: characterName },
        },
      })
    );
  }, [characterId, characterName]);

  return {
    scriptVariables,
    scriptStatuses,
    handleScriptMessage,
    broadcastCharacterChange,
    broadcastMessage,
  };
}
