/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         useActiveView Hook                                 ║
 * ║                                                                            ║
 * ║  视图切换状态管理：chat / worldbook / regex / preset                        ║
 * ║  从 character/page.tsx 提取的共用逻辑                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useState, useCallback } from "react";

// ============================================================================
//                              类型定义
// ============================================================================

export type ViewType = "chat" | "worldbook" | "regex" | "preset";

interface UseActiveViewOptions {
  defaultView?: ViewType;
}

interface UseActiveViewReturn {
  activeView: ViewType;
  switchToView: (view: ViewType) => void;
  toggleWorldBook: () => void;
  toggleRegexEditor: () => void;
  backToChat: () => void;
}

// ============================================================================
//                              主 Hook
// ============================================================================

export function useActiveView(
  options?: UseActiveViewOptions
): UseActiveViewReturn {
  const { defaultView = "chat" } = options ?? {};
  const [activeView, setActiveView] = useState<ViewType>(defaultView);

  const switchToView = useCallback((view: ViewType) => {
    setActiveView(view);
  }, []);

  const toggleWorldBook = useCallback(() => {
    setActiveView((prev) => (prev === "chat" ? "worldbook" : "chat"));
  }, []);

  const toggleRegexEditor = useCallback(() => {
    setActiveView((prev) => (prev === "regex" ? "chat" : "regex"));
  }, []);

  const backToChat = useCallback(() => {
    setActiveView("chat");
  }, []);

  return {
    activeView,
    switchToView,
    toggleWorldBook,
    toggleRegexEditor,
    backToChat,
  };
}
