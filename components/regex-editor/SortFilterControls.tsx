/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                        SortFilterControls Component                       ║
 * ║                                                                          ║
 * ║  排序筛选控件 - 从 RegexScriptEditor 提取                                  ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { SortField, SortOrder, FilterType } from "@/hooks/useRegexScripts";

/* ═══════════════════════════════════════════════════════════════════════════
   类型定义
   ═══════════════════════════════════════════════════════════════════════════ */

interface SortFilterControlsProps {
  sortBy: SortField;
  sortOrder: SortOrder;
  filterBy: FilterType;
  serifFontClass: string;
  t: (key: string) => string;
  onSortByChange: (value: SortField) => void;
  onSortOrderToggle: () => void;
  onFilterByChange: (value: FilterType) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════════════════════════ */

export function SortFilterControls({ sortBy, sortOrder, filterBy, serifFontClass, t, onSortByChange, onSortOrderToggle, onFilterByChange }: SortFilterControlsProps) {
  return (
    <div className="sticky top-0 z-20 bg-deep border-b border-ink/40 p-2 sm:p-3">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        {/* 排序字段 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/80">
              <path d="M3 6h18M7 12h10m-7 6h4" />
            </svg>
            <label className={`text-2xs sm:text-xs text-ink-soft font-medium ${serifFontClass}`}>{t("regexScriptEditor.sortBy")}</label>
          </div>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortField)}
              className={`appearance-none bg-gradient-to-br from-deep via-muted-surface to-deep text-cream-soft px-2 sm:px-3 py-1 sm:py-1.5 pr-5 sm:pr-7 rounded-md border border-ink/60 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 hover:border-ink backdrop-blur-sm shadow-inner text-2xs sm:text-xs font-medium ${serifFontClass} hover:shadow-lg hover:shadow-amber-500/5`}
            >
              <option value="priority" className="bg-deep text-cream-soft">{t("regexScriptEditor.priority")}</option>
              <option value="name" className="bg-deep text-cream-soft">{t("regexScriptEditor.name")}</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
        </div>

        {/* 排序顺序 */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className={`text-2xs sm:text-xs text-ink-soft font-medium ${serifFontClass}`}>{t("regexScriptEditor.sortOrder")}:</span>
          <button
            onClick={onSortOrderToggle}
            className={`group relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gradient-to-br from-deep via-muted-surface to-deep border border-ink/60 hover:border-amber-500/40 text-cream-soft hover:text-amber-200 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${serifFontClass}`}
            title={sortOrder === "asc" ? t("regexScriptEditor.ascending") : t("regexScriptEditor.descending")}
          >
            <div className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br ${sortOrder === "asc" ? "from-amber-500/20 to-amber-600/30 text-amber-400" : "from-blue-500/20 to-blue-600/30 text-blue-400"} transition-all duration-300 group-hover:scale-110`}>
              <span className="text-2xs sm:text-xs font-bold">{sortOrder === "asc" ? "↑" : "↓"}</span>
            </div>
            <span className="text-2xs sm:text-xs font-medium">{sortOrder === "asc" ? t("regexScriptEditor.asc") : t("regexScriptEditor.desc")}</span>
          </button>
        </div>

        {/* 筛选 */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400/80">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <label className={`text-2xs sm:text-xs text-ink-soft font-medium ${serifFontClass}`}>{t("regexScriptEditor.filterBy")}</label>
          </div>
          <div className="relative">
            <select
              value={filterBy}
              onChange={(e) => onFilterByChange(e.target.value as FilterType)}
              className={`appearance-none bg-gradient-to-br from-deep via-muted-surface to-deep text-cream-soft px-2 sm:px-3 py-1 sm:py-1.5 pr-5 sm:pr-7 rounded-md border border-ink/60 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:border-ink backdrop-blur-sm shadow-inner text-2xs sm:text-xs font-medium ${serifFontClass} hover:shadow-lg hover:shadow-blue-500/5`}
            >
              <option value="all" className="bg-deep text-cream-soft">{t("regexScriptEditor.filterAll")}</option>
              <option value="enabled" className="bg-deep text-cream-soft">{t("regexScriptEditor.filterEnabled")}</option>
              <option value="disabled" className="bg-deep text-cream-soft">{t("regexScriptEditor.filterDisabled")}</option>
              <option value="imported" className="bg-deep text-cream-soft">{t("regexScriptEditor.filterImported")}</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft"><path d="M6 9l6 6 6-6" /></svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
