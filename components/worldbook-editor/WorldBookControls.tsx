/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       WorldBookControls                                    ║
 * ║  控制区：新增/导入 + 排序/筛选 + 批量启用/禁用                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { Plus, FileText, ChevronDown } from "lucide-react";

interface WorldBookControlsProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  filterBy: string;
  canBulk: boolean;
  onCreate: () => void;
  onImport: () => void;
  onSortByChange: (value: string) => void;
  onSortOrderToggle: () => void;
  onFilterChange: (value: string) => void;
  onBulkToggle: (enabled: boolean) => void;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
}

export function WorldBookControls({
  sortBy,
  sortOrder,
  filterBy,
  canBulk,
  onCreate,
  onImport,
  onSortByChange,
  onSortOrderToggle,
  onFilterChange,
  onBulkToggle,
  fontClass,
  serifFontClass,
  t,
}: WorldBookControlsProps) {
  return (
    <>
      <div className="p-2 sm:p-3 border-b border-border bg-deep">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap">
            <button
              onClick={onCreate}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-ember to-coal hover:from-muted-surface hover:to-ember text-primary-soft hover:text-primary-soft rounded-md transition-all duration-300 text-xs sm:text-sm font-medium  group flex-shrink-0 border border-border"
            >
              <span className={"flex items-center "}>
                <Plus className="w-2.5 h-2.5 mr-1 sm:mr-1.5 transition-transform duration-300 group-hover:scale-110" />
                {t("worldBook.addEntry")}
              </span>
            </button>

            <button
              onClick={onImport}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-overlay to-coal hover:from-muted-surface hover:to-overlay text-success hover:text-success rounded-md transition-all duration-300 text-xs sm:text-sm font-medium  hover:shadow-success/20 group flex-shrink-0 border border-border"
            >
              <span className={"flex items-center "}>
                <FileText className="w-2.5 h-2.5 mr-1 sm:mr-1.5 transition-transform duration-300 group-hover:scale-110" />
                {t("worldBook.import")}
              </span>
            </button>

            <button
              onClick={() => onBulkToggle(true)}
              disabled={!canBulk}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-border text-cream-soft text-2xs sm:text-xs transition-colors ${!canBulk ? "opacity-50 cursor-not-allowed" : "hover:border-primary-400 hover:text-primary-300"}`}
            >
              {t("worldBook.enableAll")}
            </button>
            <button
              onClick={() => onBulkToggle(false)}
              disabled={!canBulk}
              className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-md border border-border text-cream-soft text-2xs sm:text-xs transition-colors ${!canBulk ? "opacity-50 cursor-not-allowed" : "hover:border-primary-400 hover:text-primary-300"}`}
            >
              {t("worldBook.disableAll")}
            </button>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 bg-deep border-b border-border/40 p-2 sm:p-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <Selector
            label={t("worldBook.sortBy")}
            value={sortBy}
            onChange={onSortByChange}
            options={[
              { value: "position", label: t("worldBook.position") },
              { value: "priority", label: t("worldBook.priority") },
              { value: "characterCount", label: t("worldBook.characterCount") },
              { value: "keywords", label: t("worldBook.keywords") },
              { value: "comment", label: t("worldBook.comment") },
              { value: "depth", label: t("worldBook.depth") },
              { value: "lastUpdated", label: t("worldBook.lastUpdated") },
            ]}
            fontClass={fontClass}
            serifFontClass={serifFontClass}
          />

          <button
            onClick={onSortOrderToggle}
            className={"group relative flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-md bg-gradient-to-br from-deep via-muted-surface to-deep border border-border/60 hover:border-primary-500/40 text-cream-soft hover:text-primary-200 transition-all duration-300 backdrop-blur-sm hover: hover: focus:outline-none focus:ring-2 focus:ring-primary-500/20 "}
            title={sortOrder === "asc" ? t("worldBook.asc") : t("worldBook.desc")}
          >
            <div
              className={`flex items-center justify-center w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-gradient-to-br ${
                sortOrder === "asc" ? "from-primary-500/20 to-primary-600/30 text-primary-400" : "from-blue-500/20 to-blue-600/30 text-blue-400"
              } transition-all duration-300 group-hover:scale-110`}
            >
              <span className="text-3xs sm:text-xs font-bold">{sortOrder === "asc" ? "↑" : "↓"}</span>
            </div>
            <span className="text-2xs sm:text-xs font-medium">{sortOrder === "asc" ? t("worldBook.asc") : t("worldBook.desc")}</span>
          </button>

          <Selector
            label={t("worldBook.filterBy")}
            value={filterBy}
            onChange={onFilterChange}
            options={[
              { value: "all", label: t("worldBook.all") },
              { value: "enabled", label: t("worldBook.enabled") },
              { value: "disabled", label: t("worldBook.disabled") },
              { value: "constant", label: t("worldBook.constant") },
              { value: "imported", label: t("worldBook.imported") },
            ]}
            fontClass={fontClass}
            serifFontClass={serifFontClass}
          />
        </div>
      </div>
    </>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
  fontClass,
  serifFontClass,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  fontClass: string;
  serifFontClass: string;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <div className="flex items-center gap-1 sm:gap-1.5">
        <span className={"text-2xs sm:text-xs text-ink-soft font-medium "}>{label}</span>
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={"appearance-none bg-gradient-to-br from-deep via-muted-surface to-deep text-cream-soft px-2 sm:px-3 py-1 sm:py-1.5 pr-5 sm:pr-7 rounded-md border border-border/60 focus:border-primary-500/60 focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all duration-300 hover:border-border backdrop-blur-sm  text-2xs sm:text-xs font-medium  hover: hover:shadow-primary-500/5"}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-deep text-cream-soft">
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-1.5 sm:pr-2 pointer-events-none">
          <ChevronDown className="w-2 h-2 text-ink-soft" />
        </div>
      </div>
    </div>
  );
}
