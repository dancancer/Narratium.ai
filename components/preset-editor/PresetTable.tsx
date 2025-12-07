/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       PresetTable                                          ║
 * ║  预设列表 + 展开行显示提示词                                               ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React from "react";
import { PresetData, PresetPromptData } from "./index";
import { ChevronRight, FileText, Edit, Copy, Trash2 } from "lucide-react";

interface PresetTableProps {
  presets: PresetData[];
  expandedRows: Set<string>;
  selectedPreset: PresetData | null;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  onTogglePreset: (presetId: string, enable: boolean) => void;
  onToggleRow: (presetId: string) => void;
  onSelectPreset: (presetId: string) => void;
  onEditPresetName: (preset: PresetData) => void;
  onCopyPreset: (preset: PresetData) => void;
  onDeletePreset: (presetId: string) => void;
  onEditPrompt: (prompt: PresetPromptData) => void;
  onTogglePrompt: (presetId: string, promptId: string, enable: boolean) => void;
  onDeletePrompt: (presetId: string, promptId: string) => void;
}

export function PresetTable({
  presets,
  expandedRows,
  selectedPreset,
  fontClass,
  serifFontClass,
  t,
  onTogglePreset,
  onToggleRow,
  onSelectPreset,
  onEditPresetName,
  onCopyPreset,
  onDeletePreset,
  onEditPrompt,
  onTogglePrompt,
  onDeletePrompt,
}: PresetTableProps) {
  return (
    <div className="h-full overflow-y-auto fantasy-scrollbar pb-15">
      <table className="w-full table-fixed">
        <thead className="sticky top-0 bg-muted-surface border-b border-ink z-10">
          <tr>
            <th className={`w-12 sm:w-16 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("preset.toggle")}
            </th>
            <th className={`w-24 sm:w-24 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("preset.status")}
            </th>
            <th className={`w-20 sm:w-24 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("preset.name")}
            </th>
            <th className={`w-20 sm:w-24 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("preset.prompts")}
            </th>
            <th className={`w-20 sm:w-20 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("preset.updated")}
            </th>
            <th className={`w-16 sm:w-20 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("preset.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {presets.map((preset) => {
            const isExpanded = expandedRows.has(preset.id);
            const isSelected = selectedPreset?.id === preset.id;
            return (
              <React.Fragment key={preset.id}>
                <tr className="border-b border-ink hover:bg-muted-surface transition-all duration-300 group">
                  <td className="p-1.5 sm:p-3">
                    <button
                      onClick={() => onTogglePreset(preset.id, preset.enabled === false)}
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-deep backdrop-blur-sm ${
                        preset.enabled !== false
                          ? "bg-gradient-to-r from-slate-700/80 via-amber-800/60 to-slate-700/80 border border-amber-600/40 focus:ring-amber-500/50"
                          : "bg-gradient-to-r from-slate-700/60 via-stone-600/40 to-slate-700/60 border border-stone-500/30 focus:ring-stone-400/50"
                      }`}
                      title={preset.enabled !== false ? t("preset.disablePreset") : t("preset.enablePreset")}
                    >
                      <span
                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full shadow-lg transition-all duration-300 ${
                          preset.enabled !== false
                            ? "translate-x-5 sm:translate-x-6 bg-gradient-to-br from-amber-300 via-amber-200 to-amber-300 shadow-amber-400/30"
                            : "translate-x-1 bg-gradient-to-br from-stone-300 via-stone-200 to-stone-300 shadow-stone-400/30"
                        }`}
                      />
                    </button>
                  </td>

                  <td className="p-1.5 sm:p-3">
                    <div className="flex items-center space-x-1 sm:space-x-2">
                      <span
                        className={`inline-flex items-center px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-2xs sm:text-xs font-medium whitespace-nowrap transition-all duration-300 backdrop-blur-sm border ${
                          preset.enabled !== false
                            ? preset.totalPrompts > 0
                              ? "bg-gradient-to-br from-slate-800/60 via-amber-900/40 to-slate-800/60 text-amber-200/90 border-amber-600/30"
                              : "bg-gradient-to-br from-slate-800/60 via-blue-900/40 to-slate-800/60 text-blue-200/90 border-blue-600/30"
                            : "bg-gradient-to-br from-slate-800/60 via-stone-700/40 to-slate-800/60 text-stone-300/90 border-stone-500/30"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 ${
                            preset.enabled !== false
                              ? preset.totalPrompts > 0
                                ? "bg-amber-400/80 shadow-sm shadow-amber-400/50"
                                : "bg-blue-400/80 shadow-sm shadow-blue-400/50"
                              : "bg-stone-400/80 shadow-sm shadow-stone-400/50"
                          }`}
                        ></span>
                        <span className="hidden sm:inline">
                          {preset.enabled !== false ? (preset.totalPrompts > 0 ? t("preset.active_status") : t("preset.empty_status")) : t("preset.disabled")}
                        </span>
                        <span className="sm:hidden">{preset.enabled !== false ? (preset.totalPrompts > 0 ? "Active" : "Empty") : "Disabled"}</span>
                      </span>

                      <button
                        onClick={() => {
                          onToggleRow(preset.id);
                          if (!isSelected) onSelectPreset(preset.id);
                        }}
                        className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-ink-soft hover:text-cream-soft transition-colors duration-300 rounded hover:bg-stroke ml-1 sm:ml-2"
                        title={isExpanded ? t("preset.collapseDetails") : t("preset.expandDetails")}
                      >
                        <ChevronRight size={10} className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`} />
                      </button>
                    </div>
                  </td>
                  <td className="p-1.5 sm:p-3 text-xs sm:text-sm text-cream-soft max-w-xs">
                    <span className="block truncate" title={preset.name}>
                      {preset.name.length > 8 ? `${preset.name.substring(0, 8)}...` : preset.name}
                    </span>
                  </td>
                  <td className="p-1.5 sm:p-3 text-xs sm:text-sm text-amber-soft">
                    <span className="text-amber-400">{preset.enabledPrompts}</span>
                    <span className="text-ink-soft"> / {preset.totalPrompts}</span>
                  </td>
                  <td className="p-1.5 sm:p-3 text-xs sm:text-sm text-amber-soft">
                    <span className="hidden sm:inline">{new Date(preset.lastUpdated).toLocaleDateString()}</span>
                    <span className="sm:hidden">
                      {new Date(preset.lastUpdated).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </td>
                  <td className="p-1.5 sm:p-3">
                    <div className="flex items-center space-x-0.5 sm:space-x-1">
                      <ActionButton
                        title={t("preset.editPresetName")}
                        onClick={() => onEditPresetName(preset)}
                        iconType="edit"
                      />
                      <ActionButton
                        title={t("preset.copyPreset")}
                        onClick={() => onCopyPreset(preset)}
                        className="text-sky hover:text-sky/80"
                        iconType="copy"
                      />
                      <ActionButton
                        title={t("preset.deletePreset")}
                        onClick={() => onDeletePreset(preset.id)}
                        className="text-red-400 hover:text-red-300"
                        iconType="delete"
                      />
                    </div>
                  </td>
                </tr>

                {isExpanded && isSelected && (
                  <tr className="border-b border-ink bg-gradient-to-b from-deep to-coal transition-all duration-300">
                    <td colSpan={6} className="p-2 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex justify-between items-center">
                          <h4 className="text-xs sm:text-sm font-medium text-ink-soft flex items-center">
                            <FileText size={12} className="mr-1.5 sm:mr-2" />
                            {t("preset.promptsTitle")} ({selectedPreset.prompts.length})
                            {selectedPreset.enabled === false && (
                              <span className="ml-1 sm:ml-2 inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-2xs sm:text-xs font-medium bg-red-900/40 text-red-200/90 border border-red-600/30">
                                {t("preset.disabled")}
                              </span>
                            )}
                          </h4>
                        </div>

                        {selectedPreset.prompts.length === 0 ? (
                          <div className="text-center text-ink-soft py-4 sm:py-8">
                            <p className="text-xs sm:text-sm">{t("preset.noPromptsInPreset")}</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 sm:space-y-2">
                            {selectedPreset.prompts.map((prompt) => (
                              <PromptCard
                                key={prompt.identifier}
                                presetId={selectedPreset.id}
                                prompt={prompt}
                                fontClass={fontClass}
                                serifFontClass={serifFontClass}
                                t={t}
                                onToggle={onTogglePrompt}
                                onEdit={onEditPrompt}
                                onDelete={onDeletePrompt}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  className,
  iconType,
}: {
  title: string;
  onClick: () => void;
  className?: string;
  iconType: "edit" | "copy" | "delete";
}) {
  const IconComponent = iconType === "edit" ? Edit : iconType === "copy" ? Copy : Trash2;
  
  return (
    <button
      onClick={onClick}
      className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-ink-soft hover:text-cream-soft transition-colors duration-300 rounded hover:bg-stroke group ${className ?? ""}`}
      title={title}
    >
      <IconComponent size={10} className="transition-transform duration-300 group-hover:scale-110" />
    </button>
  );
}

function PromptCard({
  presetId,
  prompt,
  fontClass,
  serifFontClass,
  t,
  onToggle,
  onEdit,
  onDelete,
}: {
  presetId: string;
  prompt: PresetPromptData;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  onToggle: (presetId: string, promptId: string, enable: boolean) => void;
  onEdit: (prompt: PresetPromptData) => void;
  onDelete: (presetId: string, promptId: string) => void;
}) {
  return (
    <div className="border border-ink rounded p-2 sm:p-3 bg-muted-surface">
      <div className="flex justify-between items-start mb-1.5 sm:mb-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
          <button
            onClick={() => onToggle(presetId, prompt.identifier, prompt.enabled === false)}
            className={`inline-flex items-center px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-2xs sm:text-xs font-medium cursor-pointer transition-all duration-300 ${
              prompt.enabled !== false
                ? "bg-amber-900/40 text-amber-200/90 border border-amber-600/30 hover:bg-amber-800/50"
                : "bg-stone-700/40 text-stone-300/90 border border-stone-500/30 hover:bg-stone-600/50"
            }`}
          >
            <div
              className={`relative mr-1 sm:mr-2 w-6 sm:w-8 h-3 sm:h-4 rounded-full transition-all duration-300 ${
                prompt.enabled !== false ? "bg-amber-500/40" : "bg-stone-500/40"
              }`}
            >
              <div
                className={`absolute top-0.5 w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-300 ${
                  prompt.enabled !== false ? "left-3 sm:left-4 bg-amber-400" : "left-0.5 bg-gray-400"
                }`}
              ></div>
            </div>
            <span className="hidden sm:inline">{prompt.enabled !== false ? t("preset.enabled_prompt") : t("preset.disabled_prompt")}</span>
            <span className="sm:hidden">{prompt.enabled !== false ? "On" : "Off"}</span>
          </button>
          <span className={`text-xs sm:text-sm text-amber-soft ${serifFontClass}`}>{prompt.name}</span>
          {prompt.system_prompt && (
            <span className="text-[10px] sm:text-2xs px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-200 border border-blue-700/40">
              {t("preset.systemPrompt")}
            </span>
          )}
          {prompt.marker && (
            <span className="text-[10px] sm:text-2xs px-1.5 py-0.5 rounded bg-green-900/40 text-green-200 border border-green-700/40">
              {t("preset.marker")}
            </span>
          )}
        </div>
        <div className="flex items-center space-x-1">
          <ActionButton
            title={t("preset.editPrompt")}
            onClick={() => onEdit(prompt)}
            iconType="edit"
          />
          <ActionButton
            title={t("preset.deletePrompt")}
            onClick={() => onDelete(presetId, prompt.identifier)}
            className="text-red-400 hover:text-red-300"
            iconType="delete"
          />
        </div>
      </div>

      {prompt.content && (
        <p className={`text-2xs sm:text-xs text-cream-soft leading-relaxed ${fontClass} whitespace-pre-line`}>
          {prompt.content.slice(0, 400)}
          {prompt.content.length > 400 ? "..." : ""}
        </p>
      )}
    </div>
  );
}
