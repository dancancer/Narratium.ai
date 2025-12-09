/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         变量操作 Handlers                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import type { ApiCallContext, ApiHandlerMap } from "./types";

// ============================================================================
//                              Handler 实现
// ============================================================================

function setVariable(args: unknown[], ctx: ApiCallContext): boolean {
  const [key, value, scope = "global"] = args as [string, unknown, "global" | "character"];
  const finalScope = scope === "character" && ctx.characterId ? "character" : "global";
  ctx.setScriptVariable(key, value, finalScope, ctx.characterId);
  return true;
}

function deleteVariable(args: unknown[], ctx: ApiCallContext): boolean {
  const [key, scope = "global"] = args as [string, "global" | "character"];
  const finalScope = scope === "character" && ctx.characterId ? "character" : "global";
  ctx.deleteScriptVariable(key, finalScope, ctx.characterId);
  return true;
}

function getVariables(_args: unknown[], ctx: ApiCallContext) {
  const snapshot = ctx.getVariablesSnapshot();
  return {
    global: snapshot.global,
    character: snapshot.character,
  };
}

// ============================================================================
//                              导出 Handler Map
// ============================================================================

export const variableHandlers: ApiHandlerMap = {
  "setVariable": setVariable,
  "deleteVariable": deleteVariable,
  "getVariables": getVariables,
};
