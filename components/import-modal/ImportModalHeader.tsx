/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        Import Modal Header                                ║
 * ║                                                                          ║
 * ║  通用导入弹窗头部 + 标签切换                                                ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React from "react";
import { FileText, Globe2, X } from "lucide-react";

interface TabConfig {
  id: "file" | "global";
  label: string;
  icon: "file" | "global";
  activeColor: string;
}

interface ImportModalHeaderProps {
  title: string;
  activeTab: "file" | "global";
  tabs: [TabConfig, TabConfig];
  serifFontClass: string;
  onTabChange: (tab: "file" | "global") => void;
  onClose: () => void;
}

const ICON_MAP = { file: FileText, global: Globe2 };
const COLOR_MAP: Record<string, { active: string; glow: string }> = {
  primary: { active: "from-primary-600/90 to-primary-700/90", glow: "shadow-primary-500/20" },
  blue: { active: "from-blue-600/90 to-blue-700/90", glow: "shadow-blue-500/20" },
};

export function ImportModalHeader({ title, activeTab, tabs, serifFontClass, onTabChange, onClose }: ImportModalHeaderProps) {
  return (
    <div className="relative p-3 border-b border-border/40 bg-gradient-to-r from-muted-surface/80 via-deep/60 to-muted-surface/80 backdrop-blur-sm">
      <div className="flex justify-between items-center">
        <h2 className={`text-base font-semibold text-cream-soft  `}>
          {title}
        </h2>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center text-ink-soft hover:text-cream-soft transition-all duration-300 rounded-md hover:bg-stroke/50 group"
        >
          <X className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:rotate-90" />
        </button>
      </div>

      <div className="flex mt-2 space-x-0.5 bg-deep/60 backdrop-blur-sm rounded-md p-0.5 border border-border/30">
        {tabs.map((tab) => {
          const Icon = ICON_MAP[tab.icon];
          const colors = COLOR_MAP[tab.activeColor];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all duration-300 ${
                isActive
                  ? `bg-gradient-to-r ${colors.active} text-white  ${colors.glow}`
                  : "text-ink-soft hover:text-cream-soft hover:bg-muted-surface/50"
              } `}
            >
              <span className="relative z-10 flex items-center justify-center">
                <Icon className="mr-1 h-3 w-3" />
                {tab.label}
              </span>
              {isActive && (
                <div className={`absolute inset-0 bg-gradient-to-r ${colors.active.replace("/90", "/20")} rounded-md animate-pulse`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
