/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         消息与事件 Handlers                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import type { ApiCallContext, ApiHandlerMap } from "./types";

// ============================================================================
//                              消息查询
// ============================================================================

function getChatMessages(_args: unknown[], ctx: ApiCallContext) {
  return ctx.messages;
}

function getCurrentMessageId(_args: unknown[], ctx: ApiCallContext) {
  if (ctx.messages.length === 0) return null;
  return ctx.messages[ctx.messages.length - 1]?.id ?? null;
}

// ============================================================================
//                              消息更新
// ============================================================================

function setChatMessages(args: unknown[], ctx: ApiCallContext): boolean {
  const [chatMessages, options] = args as [
    Array<{ message_id: number; message?: string; data?: Record<string, unknown> }>,
    { refresh?: "none" | "affected" | "all" }?
  ];
  if (!Array.isArray(chatMessages)) return false;

  // 通过事件通知父组件更新消息
  window.dispatchEvent(
    new CustomEvent("narratium:setChatMessages", {
      detail: { messages: chatMessages, options: options || {}, characterId: ctx.characterId },
    })
  );
  return true;
}

// ============================================================================
//                              事件发射
// ============================================================================

function eventEmit(args: unknown[]): string {
  const [eventName, ...eventData] = args as [string, ...unknown[]];
  window.dispatchEvent(
    new CustomEvent(`narratium:${eventName}`, {
      detail: eventData.length === 1 ? eventData[0] : eventData,
    })
  );
  return eventName;
}

// ============================================================================
//                              导出 Handler Map
// ============================================================================

export const messageHandlers: ApiHandlerMap = {
  "getChatMessages": getChatMessages,
  "getCurrentMessageId": getCurrentMessageId,
  "setChatMessages": setChatMessages,
  "eventEmit": eventEmit,
  "events.emit": eventEmit,
};
