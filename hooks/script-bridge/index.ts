/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Script Bridge Handler Registry                     ║
 * ║                                                                            ║
 * ║  统一的 API Handler 注册表                                                  ║
 * ║  好品味：用数据结构消灭分支，新增 API 只需在对应文件添加 handler              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import type { ApiCallContext, ApiHandler, ApiHandlerMap } from "./types";
import { variableHandlers } from "./variable-handlers";
import { worldbookHandlers } from "./worldbook-handlers";
import { lorebookHandlers } from "./lorebook-handlers";
import { presetHandlers } from "./preset-handlers";
import { generationHandlers } from "./generation-handlers";
import { messageHandlers } from "./message-handlers";
import { mvuHandlers } from "./mvu-handlers";

// ============================================================================
//                              Handler 注册表
// ============================================================================

const API_HANDLERS: ApiHandlerMap = {
  ...variableHandlers,
  ...worldbookHandlers,
  ...lorebookHandlers,
  ...presetHandlers,
  ...generationHandlers,
  ...messageHandlers,
  ...mvuHandlers,
};

// ============================================================================
//                              统一调用入口
// ============================================================================

export async function handleApiCall(
  method: string,
  args: unknown[],
  context: ApiCallContext
): Promise<unknown> {
  const handler: ApiHandler | undefined = API_HANDLERS[method];
  if (!handler) return undefined;
  return handler(args, context);
}

// ============================================================================
//                              类型导出
// ============================================================================

export type { ApiCallContext, ApiHandler, ApiHandlerMap } from "./types";
