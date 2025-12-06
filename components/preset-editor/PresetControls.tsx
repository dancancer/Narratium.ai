/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       PresetControls                                       ║
 * ║  顶部控制区：创建/导入 + 排序/筛选                                         ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

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
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 sm:mr-1.5 transition-transform duration-300 group-hover:scale-110"
                >
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                <span className="hidden sm:inline">{t("preset.createPreset")}</span>
                <span className="sm:hidden">{t("preset.create")}</span>
              </span>
            </button>

            <button
              onClick={onImport}
              className="px-2 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-overlay to-coal hover:from-muted-surface hover:to-overlay text-success hover:text-success rounded-md transition-all duration-300 text-xs sm:text-sm font-medium shadow-lg hover:shadow-success/20 group flex-shrink-0 border border-ink"
            >
              <span className={`flex items-center ${serifFontClass}`}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="10"
                  height="10"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-1 sm:mr-1.5 transition-transform duration-300 group-hover:scale-110"
                >
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400/80">
                <path d="M3 6h18M7 12h10m-7 6h4"></path>
              </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft">
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
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
              <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-400/80">
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
              </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ink-soft">
                  <path d="M6 9l6 6 6-6"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
