/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    Message Header Controls Component                       ║
 * ║                                                                            ║
 * ║  消息头部控制按钮：流式输出、快速模型切换                                    ║
 * ║  职责单一：只处理消息头部的控制按钮渲染和交互                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useCallback } from "react";
import { trackButtonClick } from "@/utils/google-analytics";

// ============================================================================
//                              类型定义
// ============================================================================

interface MessageHeaderControlsProps {
  streaming: boolean;
  fastModel: boolean;
  onToggleStreaming: () => void;
  onToggleFastModel: () => void;
  t: (key: string) => string;
}

// ============================================================================
//                              主组件
// ============================================================================

export default function MessageHeaderControls({
  streaming,
  fastModel,
  onToggleStreaming,
  onToggleFastModel,
  t,
}: MessageHeaderControlsProps) {
  const handleStreamingClick = useCallback(() => {
    onToggleStreaming();
    trackButtonClick("toggle_streaming", "流式输出切换");
  }, [onToggleStreaming]);

  const handleFastModelClick = useCallback(() => {
    onToggleFastModel();
    trackButtonClick("toggle_fastmodel", "快速模式切换");
  }, [onToggleFastModel]);

  return (
    <>
      {/* 流式输出切换 */}
      <ToggleButton
        active={streaming}
        onClick={handleStreamingClick}
        tooltip={streaming ? t("characterChat.disableStreaming") : t("characterChat.enableStreaming")}
        activeColor="amber"
        icon={<StreamIcon active={streaming} />}
      />

      {/* 快速模型切换 */}
      <ToggleButton
        active={fastModel}
        onClick={handleFastModelClick}
        tooltip={fastModel ? t("characterChat.disableFastModel") : t("characterChat.enableFastModel")}
        activeColor="blue"
        icon={<LightningIcon active={fastModel} />}
      />
    </>
  );
}

// ============================================================================
//                              子组件
// ============================================================================

interface ToggleButtonProps {
  active: boolean;
  onClick: () => void;
  tooltip: string;
  activeColor: "amber" | "blue";
  icon: React.ReactNode;
}

function ToggleButton({ active, onClick, tooltip, activeColor, icon }: ToggleButtonProps) {
  const colorStyles = {
    amber: {
      active: "text-amber-400 hover:text-amber-300 border-amber-400/60 hover:border-amber-300/70 hover:shadow-[0_0_8px_rgba(252,211,77,0.4)]",
      inactive: "text-ink-soft hover:text-amber-soft border-stroke hover:border-stroke-strong",
    },
    blue: {
      active: "text-blue-500 hover:text-blue-400 border-blue-500/60 hover:border-blue-400/70 hover:shadow-[0_0_8px_rgba(59,130,246,0.4)]",
      inactive: "text-ink-soft hover:text-amber-soft border-stroke hover:border-stroke-strong",
    },
  };

  const style = active ? colorStyles[activeColor].active : colorStyles[activeColor].inactive;

  return (
    <button
      onClick={onClick}
      className={`mx-1 w-6 h-6 flex items-center justify-center bg-surface rounded-lg border shadow-inner transition-all duration-300 group relative ${style}`}
      data-tooltip={tooltip}
    >
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-overlay text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-ink">
        {tooltip}
      </div>
      {icon}
    </button>
  );
}

function StreamIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path
        d="M3 6h18M3 12h18M3 18h18"
        stroke={active ? "var(--color-highlight)" : "currentColor"}
        strokeLinecap="round"
        strokeDasharray={active ? "4,2" : "none"}
      >
        {active && (
          <animate attributeName="stroke-dashoffset" values="0;6" dur="1s" repeatCount="indefinite" />
        )}
      </path>
    </svg>
  );
}

function LightningIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="-scale-x-100">
      <path
        d="M7 2L17 14h-7v8l-8-12h7z"
        fill={active ? "var(--color-sky-strong)" : "none"}
        stroke={active ? "var(--color-sky-strong)" : "currentColor"}
      />
    </svg>
  );
}
