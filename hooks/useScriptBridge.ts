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
import { WorldBookOperations } from "@/lib/data/roleplay/world-book-operation";
import type { WorldBookEntry } from "@/lib/models/world-book-model";
import type { DialogueMessage } from "@/types/character-dialogue";

// ============================================================================
//                              类型定义
// ============================================================================

export interface ScriptStatus {
  scriptName?: string;
  status: "running" | "completed" | "error";
  message?: string;
  timestamp: number;
}

interface ScriptMessageData {
  type: string;
  payload: {
    method?: string;
    args?: unknown[];
    [key: string]: unknown;
  };
}

interface UseScriptBridgeOptions {
  characterId?: string;
  characterName?: string;
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
  const { characterId, characterName, maxStatusHistory = 50 } = options;
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

  // 处理脚本消息
  const handleScriptMessage = useCallback(async (data: ScriptMessageData): Promise<unknown> => {
    const { type, payload } = data;

    // 控制台日志
    if (type === "CONSOLE_LOG") {
      console.log("[Script]", ...(payload.args as unknown[] || []));
      return undefined;
    }

    // API 调用
    if (type === "API_CALL") {
      const { method, args = [] } = payload;
      return handleApiCall(method || "", args, {
        characterId,
        setScriptVariable,
        deleteScriptVariable,
      });
    }

    // 脚本状态更新
    if (type === "SCRIPT_STATUS") {
      setScriptStatuses((prev) => {
        const newStatus: ScriptStatus = { ...payload, timestamp: Date.now() } as ScriptStatus;
        return [newStatus, ...prev].slice(0, maxStatusHistory);
      });
      return undefined;
    }

    return undefined;
  }, [characterId, setScriptVariable, deleteScriptVariable, maxStatusHistory]);

  // 广播角色变更
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

  // 广播消息
  const broadcastMessage = useCallback((message: DialogueMessage) => {
    const eventName = message.role === "user" ? "message:sent" : "message:received";
    window.dispatchEvent(
      new CustomEvent("narratium:broadcast", {
        detail: { eventName, data: message },
      })
    );
  }, []);

  // 角色变更时广播
  useEffect(() => {
    broadcastCharacterChange();
  }, [broadcastCharacterChange]);

  return {
    scriptVariables,
    scriptStatuses,
    handleScriptMessage,
    broadcastCharacterChange,
    broadcastMessage,
  };
}

// ============================================================================
//                              API 调用处理
// ============================================================================

interface ApiCallContext {
  characterId?: string;
  setScriptVariable: (key: string, value: unknown, scope: "global" | "character") => void;
  deleteScriptVariable: (key: string) => void;
}

async function handleApiCall(
  method: string,
  args: unknown[],
  context: ApiCallContext
): Promise<unknown> {
  const { characterId, setScriptVariable, deleteScriptVariable } = context;

  // 变量操作
  if (method === "setVariable") {
    const [key, value] = args as [string, unknown];
    setScriptVariable(key, value, "global");
    return true;
  }

  if (method === "deleteVariable") {
    const [key] = args as [string];
    deleteScriptVariable(key);
    return true;
  }

  // 世界书操作
  if (method === "worldbook.get") {
    const [id] = args as [string];
    const normalizedId = String(id);
    if (!characterId) return null;
    const wb = await WorldBookOperations.getWorldBook(characterId);
    if (!wb) return null;
    return Object.values(wb).find(
      (e: WorldBookEntry) =>
        (e.id !== undefined && String(e.id) === normalizedId) ||
        (e.entry_id !== undefined && String(e.entry_id) === normalizedId)
    ) || wb[id as keyof typeof wb] || null;
  }

  if (method === "worldbook.search") {
    const [query] = args as [string];
    if (!characterId || !query) return [];
    const wb = await WorldBookOperations.getWorldBook(characterId);
    if (!wb) return [];
    const lowerQuery = query.toLowerCase();
    return Object.values(wb).filter((e: WorldBookEntry) =>
      e.keys.some((k: string) => k.toLowerCase().includes(lowerQuery)) ||
      e.content.toLowerCase().includes(lowerQuery)
    );
  }

  return undefined;
}
