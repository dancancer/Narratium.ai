/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         useErrorToast Hook                                 ║
 * ║                                                                            ║
 * ║  错误提示状态管理：显示/隐藏、自动消失                                       ║
 * ║  从 PresetEditor 和 WorldBookEditor 提取的共用逻辑                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ============================================================================
//                              类型定义
// ============================================================================

interface ToastState {
  isVisible: boolean;
  message: string;
}

interface UseErrorToastOptions {
  autoHideDuration?: number; // 自动隐藏延迟（毫秒），默认 5000
}

interface UseErrorToastReturn {
  toast: ToastState;
  showToast: (message: string) => void;
  hideToast: () => void;
}

// ============================================================================
//                              主 Hook
// ============================================================================

export function useErrorToast(options?: UseErrorToastOptions): UseErrorToastReturn {
  const { autoHideDuration = 5000 } = options ?? {};
  const [toast, setToast] = useState<ToastState>({
    isVisible: false,
    message: "",
  });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const hideToast = useCallback(() => {
    clearTimer();
    setToast({ isVisible: false, message: "" });
  }, [clearTimer]);

  const showToast = useCallback((message: string) => {
    clearTimer();
    setToast({ isVisible: true, message });

    if (autoHideDuration > 0) {
      timerRef.current = setTimeout(hideToast, autoHideDuration);
    }
  }, [autoHideDuration, clearTimer, hideToast]);

  // 清理定时器
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  return {
    toast,
    showToast,
    hideToast,
  };
}
