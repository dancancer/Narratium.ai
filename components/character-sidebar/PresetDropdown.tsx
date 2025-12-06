/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Preset Dropdown                                   ║
 * ║                                                                           ║
 * ║  系统预设下拉选择器 - 显示可用预设列表 + 选中状态                                ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React from "react";
import { getPresetDisplayName, getPresetDescription } from "@/function/preset/download";

/* ─────────────────────────────────────────────────────────────────────────────
 * 类型定义
 * ───────────────────────────────────────────────────────────────────────────── */

interface PresetItem {
  name: string;
  displayName: {
    zh: string;
    en: string;
  };
  description: {
    zh: string;
    en: string;
  };
  filename: string;
}

interface PresetDropdownProps {
  /** 预设列表 */
  presets: PresetItem[];
  /** 当前选中的预设 */
  selectedPreset: string;
  /** 语言 */
  language: "zh" | "en";
  /** 字体类名 */
  fontClass?: string;
  /** 选择预设回调 */
  onSelect: (presetName: string) => void;
  /** 查看预设信息回调 */
  onShowInfo: (presetName: string) => void;
  /** 无预设时的提示文字 */
  emptyText?: string;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * 图标组件 - 选中 / 未选中
 * ───────────────────────────────────────────────────────────────────────────── */

const CheckIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="var(--color-info)"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="transition-transform duration-300 group-hover/info:scale-110"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4" />
    <path d="M12 8h.01" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────────
 * 组件实现
 * ───────────────────────────────────────────────────────────────────────────── */

const PresetDropdown: React.FC<PresetDropdownProps> = ({
  presets,
  selectedPreset,
  language,
  fontClass = "",
  onSelect,
  onShowInfo,
  emptyText = "没有可用的预设",
}) => {
  /* ─── 空状态 ─── */
  if (presets.length === 0) {
    return (
      <div className="absolute left-0 right-0 mt-1 mx-6 bg-surface border border-stroke rounded-md shadow-lg z-10 overflow-hidden">
        <div className="p-3 text-center text-ink-soft">
          <span className={`text-2xs md:text-xs ${fontClass}`}>{emptyText}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute left-0 right-0 mt-1 mx-6 bg-surface border border-stroke rounded-md shadow-lg z-10 overflow-hidden max-h-[240px]">
      <div className="overflow-y-auto max-h-[240px] scrollbar-thin scrollbar-track-input scrollbar-thumb-stroke hover:scrollbar-thumb-stroke-strong">
        {presets.map((preset, index) => {
          const isSelected = selectedPreset === preset.name;
          const isLast = index === presets.length - 1;

          return (
            <div
              key={preset.name}
              className={`p-3 hover:bg-muted-surface transition-colors duration-200 group ${
                isLast ? "" : "border-b border-stroke"
              }`}
            >
              <div className="flex items-center justify-between">
                {/* 预设信息区域 (点击选择) */}
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelect(preset.name)}
                >
                  <div className="flex items-center">
                    <span className={`text-xs md:text-sm text-cream ${fontClass} block truncate`}>
                      {getPresetDisplayName(preset.name, language)}
                    </span>
                    {/* 信息按钮 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onShowInfo(preset.name);
                      }}
                      className="ml-2 w-4 h-4 flex items-center justify-center text-ink-soft hover:text-amber-bright transition-all duration-300 rounded-full hover:bg-stroke/50 group/info"
                    >
                      <InfoIcon />
                    </button>
                  </div>
                  <p className={`text-2xs md:text-xs text-ink-soft mt-1 ${fontClass} line-clamp-2`}>
                    {getPresetDescription(preset.name, language)}
                  </p>
                </div>

                {/* 选中状态指示 */}
                <div className="ml-2 flex-shrink-0">
                  {isSelected ? (
                    <div className="w-4 h-4 flex items-center justify-center">
                      <CheckIcon />
                    </div>
                  ) : (
                    <div className="w-4 h-4 border border-stroke rounded" />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PresetDropdown;
