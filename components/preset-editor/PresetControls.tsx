/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       PresetControls                                       ║
 * ║  顶部控制区：创建/导入 + 排序/筛选                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { Plus, FileText, AlignJustify, ChevronDown, Filter } from "lucide-react";

interface PresetControlsProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  filterBy: string;
  onCreate: () => void;
  onImport: () => void;
  onSortByChange: (value: string) => void;
  onSortOrderToggle: () => void;
  onFilterChange: (value: string) => void;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
}

export function PresetControls({
  sortBy,
  sortOrder,
  filterBy,
  onCreate,
  onImport,
  onSortByChange,
  onSortOrderToggle,
  onFilterChange,
  fontClass,
  serifFontClass,
  t,
}: PresetControlsProps) {
  return (
    <>
      <div className="p-2 sm:p-3 border-b border-ink bg-deep">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
            <button
              onClick={onCreate}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-ember to-coal hover:from-muted-surface hover:to-ember text-amber-soft hover:text-amber-soft rounded-md transition-all duration-300 text-xs sm:text-sm font-medium shadow-lg hover:shadow-amber-bright/20 group flex-shrink-0 border border-ink"
            >
              <span className={`flex items-center ${serifFontClass}`}>
                <Plus size={10} className="mr-1 sm:mr-1.5 transition-transform duration-300 group-hover:scale-110" />
                <span className="hidden sm:inline">{t("preset.createPreset")}</span>
                <span className="sm:hidden">{t("preset.create")}</span>
              </span>
            </button>

            <button
              onClick={onImport}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-overlay to-coal hover:from-muted-surface hover:to-overlay text-success hover:text-success rounded-md transition-all duration-300 text-xs sm:text-sm font-medium shadow-lg hover:shadow-success/20 group flex-shrink-0 border border-ink"
            >
              <span className={`flex items-center ${serifFontClass}`}>
                <FileText size={10} className="mr-1 sm:mr-1.5 transition-transform duration-300 group-hover:scale-110" />
                {t("preset.importPreset")}
              </span>
            </button>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-deep border-b border-ink/40 p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <AlignJustify size={10} className="text-amber-400/80" />
              <label className={`text-2xs sm:text-xs text-ink-soft font-medium ${serifFontClass}`}>{t("preset.sortBy")}</label>
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onSortByChange(e.target.value)}
                className={`appearance-none bg-gradient-to-br from-deep via-muted-surface to-deep text-cream-soft px-2 sm:px-3 py-1 sm:py-1.5 pr-5 sm:pr-7 rounded-md border border-ink/60 focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300 hover:border-ink backdrop-blur-sm shadow-inner text-2xs sm:text-xs font-medium ${serifFontClass} hover:shadow-lg hover:shadow-amber-500/5`}
              >
                <option value="name" className="bg-deep text-cream-soft">
                  {t("preset.name")}
                </option>
                <option value="promptCount" className="bg-deep text-cream-soft">
                  {t("preset.promptCount")}
                </option>
                <option value="lastUpdated" className="bg-deep text-cream-soft">
                  {t("preset.lastUpdated")}
                </option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 pointer-events-none">
                <ChevronDown size={8} className="text-ink-soft" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className={`text-2xs sm:text-xs text-ink-soft font-medium ${serifFontClass}`}>{t("preset.sortOrder")}:</span>
            <button
              onClick={onSortOrderToggle}
              className={`group relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gradient-to-br from-deep via-muted-surface to-deep border border-ink/60 hover:border-amber-500/40 text-cream-soft hover:text-amber-200 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-amber-500/10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 ${serifFontClass}`}
              title={sortOrder === "asc" ? t("preset.ascending") : t("preset.descending")}
            >
              <div
                className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br ${
                  sortOrder === "asc" ? "from-amber-500/20 to-amber-600/30 text-amber-400" : "from-blue-500/20 to-blue-600/30 text-blue-400"
                } transition-all duration-300 group-hover:scale-110`}
              >
                <span className="text-3xs sm:text-xs font-bold">{sortOrder === "asc" ? "↑" : "↓"}</span>
              </div>
              <span className="text-2xs sm:text-xs font-medium">{sortOrder === "asc" ? t("preset.asc") : t("preset.desc")}</span>
            </button>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Filter size={10} className="text-blue-400/80" />
              <label className={`text-2xs sm:text-xs text-ink-soft font-medium ${serifFontClass}`}>{t("preset.filterBy")}</label>
            </div>

            <div className="relative">
              <select
                value={filterBy}
                onChange={(e) => onFilterChange(e.target.value)}
                className={`appearance-none bg-gradient-to-br from-deep via-muted-surface to-deep text-cream-soft px-2 sm:px-3 py-1 sm:py-1.5 pr-5 sm:pr-7 rounded-md border border-ink/60 focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-300 hover:border-ink backdrop-blur-sm shadow-inner text-2xs sm:text-xs font-medium ${serifFontClass} hover:shadow-lg hover:shadow-blue-500/5`}
              >
                <option value="all" className="bg-deep text-cream-soft">
                  {t("preset.all")}
                </option>
                <option value="active" className="bg-deep text-cream-soft">
                  {t("preset.active")}
                </option>
                <option value="empty" className="bg-deep text-cream-soft">
                  {t("preset.empty")}
                </option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 pointer-events-none">
                <ChevronDown size={8} className="text-ink-soft" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
