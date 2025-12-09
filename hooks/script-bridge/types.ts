/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Script Bridge 类型定义                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import type { DialogueMessage } from "@/types/character-dialogue";

// ============================================================================
//                              API Handler 上下文
// ============================================================================

export interface ApiCallContext {
  characterId?: string;
  messages: DialogueMessage[];
  setScriptVariable: (
    key: string,
    value: unknown,
    scope: "global" | "character",
    id?: string
  ) => void;
  deleteScriptVariable: (
    key: string,
    scope?: "global" | "character",
    id?: string
  ) => void;
  getVariablesSnapshot: () => {
    global: Record<string, unknown>;
    character: Record<string, Record<string, unknown>>;
  };
}

// ============================================================================
//                              Handler 类型
// ============================================================================

export type ApiHandler = (
  args: unknown[],
  context: ApiCallContext
) => Promise<unknown> | unknown;

export type ApiHandlerMap = Record<string, ApiHandler>;
