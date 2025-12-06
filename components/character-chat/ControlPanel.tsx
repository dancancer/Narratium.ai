/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Control Panel Component                            ║
 * ║                                                                            ║
 * ║  可展开的控制面板：剧情推进、视角设计、场景过渡、用户名设置                    ║
 * ║  设计原则：用配置数组驱动渲染，消除重复代码                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useState, useCallback } from "react";
import { trackButtonClick } from "@/utils/google-analytics";

// ============================================================================
//                              类型定义
// ============================================================================

interface PerspectiveMode {
  active: boolean;
  mode: "novel" | "protagonist";
}

interface ActiveModes {
  "story-progress": boolean;
  perspective: PerspectiveMode;
  "scene-setting": boolean;
  [key: string]: boolean | PerspectiveMode;
}

interface ControlPanelProps {
  activeModes: ActiveModes;
  setActiveModes: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  onOpenUserNameModal: () => void;
  onOpenScriptDebug: () => void;
  t: (key: string) => string;
}

// ============================================================================
//                              图标组件
// ============================================================================

function ArrowIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
      <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

function GridIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" /><line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`mr-1 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}>
      <path d="M18 15l-6-6-6 6" />
    </svg>
  );
}

function DebugIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

// ============================================================================
//                              主组件
// ============================================================================

export default function ControlPanel({
  activeModes,
  setActiveModes,
  onOpenUserNameModal,
  onOpenScriptDebug,
  t,
}: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleStoryProgress = useCallback(() => {
    trackButtonClick("page", "切换故事进度");
    setActiveModes((prev) => ({ ...prev, "story-progress": !prev["story-progress"] }));
  }, [setActiveModes]);

  const togglePerspective = useCallback(() => {
    trackButtonClick("page", "切换视角");
    setActiveModes((prev) => {
      const perspective = prev["perspective"] as PerspectiveMode;
      if (!perspective.active) {
        return { ...prev, perspective: { active: true, mode: "novel" } };
      }
      if (perspective.mode === "novel") {
        return { ...prev, perspective: { active: true, mode: "protagonist" } };
      }
      return { ...prev, perspective: { active: false, mode: "novel" } };
    });
  }, [setActiveModes]);

  const toggleSceneSetting = useCallback(() => {
    trackButtonClick("page", "切换场景设置");
    setActiveModes((prev) => ({ ...prev, "scene-setting": !prev["scene-setting"] }));
  }, [setActiveModes]);

  const handleUserNameClick = useCallback(() => {
    trackButtonClick("page", "设置用户名称");
    onOpenUserNameModal();
  }, [onOpenUserNameModal]);

  const togglePanel = useCallback(() => {
    setIsExpanded((prev) => !prev);
    trackButtonClick("page", "切换控制面板");
  }, []);

  const perspective = activeModes["perspective"] as PerspectiveMode;

  return (
    <div className="relative">
      {/* 展开的控制按钮 */}
      <div className={`absolute bottom-full left-0 mb-2 z-50 transition-all duration-300 ease-in-out ${isExpanded ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"}`}>
        <div className="flex flex-col gap-2 bg-canvas/95 backdrop-blur-sm rounded-lg p-2 border border-ink/50 shadow-lg">
          {/* 剧情推进 */}
          <ControlButton
            active={activeModes["story-progress"]}
            onClick={toggleStoryProgress}
            activeColor="amber"
            icon={<ArrowIcon />}
            label={t("characterChat.storyProgress") || "剧情推进"}
          />

          {/* 视角设计 */}
          <ControlButton
            active={perspective.active}
            onClick={togglePerspective}
            activeColor={perspective.mode === "novel" ? "success" : "info"}
            inactiveColor="success"
            icon={<GlobeIcon />}
            label={getPerspectiveLabel(perspective, t)}
          />

          {/* 场景过渡 */}
          <ControlButton
            active={activeModes["scene-setting"]}
            onClick={toggleSceneSetting}
            activeColor="info"
            icon={<GridIcon />}
            label={t("characterChat.sceneTransition")}
          />

          {/* 用户名称 */}
          <ControlButton
            active={false}
            onClick={handleUserNameClick}
            activeColor="amber"
            inactiveColor="amber-bright"
            icon={<UserIcon />}
            label={t("characterChat.userNameSetting")}
          />
        </div>
      </div>

      {/* 主控制按钮 */}
      <button
        type="button"
        onClick={togglePanel}
        className={`px-1.5 sm:px-2 md:px-4 py-1.5 text-xs rounded-full border transition-all duration-300 ${isExpanded ? "bg-amber text-overlay border-amber shadow-[0_0_8px_rgba(209,163,92,0.5)]" : "bg-overlay text-amber border-ink hover:border-amber shadow-sm hover:shadow-md"}`}
      >
        <span className="flex items-center">
          <ChevronIcon expanded={isExpanded} />
          <span className="text-2xs sm:text-xs">{isExpanded ? "收起控制" : "展开控制"}</span>
        </span>
      </button>

      {/* 调试按钮 */}
      <button
        type="button"
        onClick={onOpenScriptDebug}
        className="ml-2 px-2 py-1.5 text-xs rounded-full border border-ink bg-overlay text-ink-soft hover:text-amber hover:border-amber transition-all"
        title="Script Debugger"
      >
        <DebugIcon />
      </button>
    </div>
  );
}

// ============================================================================
//                              辅助组件
// ============================================================================

interface ControlButtonProps {
  active: boolean;
  onClick: () => void;
  activeColor: "amber" | "success" | "info";
  inactiveColor?: string;
  icon: React.ReactNode;
  label: string;
}

function ControlButton({ active, onClick, activeColor, inactiveColor, icon, label }: ControlButtonProps) {
  const colorMap = {
    amber: {
      active: "bg-amber text-overlay border-amber shadow-[0_0_8px_rgba(209,163,92,0.5)]",
      inactive: `bg-overlay text-${inactiveColor || "amber"} border-ink hover:border-amber shadow-sm hover:shadow-md`,
    },
    success: {
      active: "bg-success text-overlay border-success shadow-[0_0_8px_color-mix(in_srgb,var(--color-success)_45%,transparent)]",
      inactive: `bg-overlay text-${inactiveColor || "success"} border-ink hover:border-success shadow-sm hover:shadow-md`,
    },
    info: {
      active: "bg-info text-overlay border-info shadow-[0_0_8px_color-mix(in_srgb,var(--color-info)_45%,transparent)]",
      inactive: `bg-overlay text-${inactiveColor || "info"} border-ink hover:border-info shadow-sm hover:shadow-md`,
    },
  };

  const className = active ? colorMap[activeColor].active : colorMap[activeColor].inactive;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-1.5 sm:px-2 md:px-4 py-1.5 text-xs rounded-full border transition-all duration-300 whitespace-nowrap min-w-fit ${className}`}
    >
      <span className="flex items-center">
        {icon}
        <span className="text-2xs sm:text-xs">{label}</span>
      </span>
    </button>
  );
}

function getPerspectiveLabel(perspective: PerspectiveMode, t: (key: string) => string): string {
  if (!perspective.active) {
    return t("characterChat.perspective") || "视角设计";
  }
  if (perspective.mode === "novel") {
    return t("characterChat.novelPerspective") || "小说视角";
  }
  return t("characterChat.protagonistPerspective") || "主角视角";
}
