/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        Toast Provider                                    ║
 * ║                                                                          ║
 * ║  Sonner Toast 全局配置 - 统一样式和行为                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { Toaster } from "sonner";
import { useLanguage } from "@/app/i18n";

export function ToastProvider() {
  const { serifFontClass } = useLanguage();

  return (
    <Toaster
      position="top-center"
      expand={false}
      richColors
      closeButton
      duration={5000}
      toastOptions={{
        classNames: {
          toast: `fantasy-bg border border-ink shadow-2xl ${serifFontClass}`,
          title: "text-cream font-medium",
          description: "text-amber-soft",
          actionButton: "bg-amber-bright text-deep hover:bg-amber-soft",
          cancelButton: "bg-muted-surface text-ink-soft hover:bg-deep",
          closeButton: "bg-muted-surface text-ink-soft hover:bg-deep hover:text-amber-soft",
          success: "border-green-600/50",
          error: "border-red-600/50",
          warning: "border-yellow-600/50",
          info: "border-blue-600/50",
        },
      }}
    />
  );
}
