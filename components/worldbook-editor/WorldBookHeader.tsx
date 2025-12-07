/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       WorldBookHeader                                      ║
 * ║  顶部标题栏：名称/统计/关闭                                                 ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { X } from "lucide-react";
import { WorldBookEntryData } from "./index";

interface WorldBookHeaderProps {
  characterName: string;
  entries: WorldBookEntryData[];
  filteredCount: number;
  filterBy: string;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  onClose: () => void;
}

export function WorldBookHeader({
  characterName,
  entries,
  filteredCount,
  filterBy,
  fontClass,
  serifFontClass,
  t,
  onClose,
}: WorldBookHeaderProps) {
  const enabledCount = entries.filter((e) => e.isActive).length;
  const constantCount = entries.filter((e) => e.constant).length;

  return (
    <div className="p-2 sm:p-3 border-b border-ink bg-muted-surface relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-50"></div>
      <div className="relative z-10 flex justify-between items-center min-h-[2rem]">
        <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-medium text-cream-soft flex-shrink-0">
            <span className={`bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 ${serifFontClass}`}>
              {t("worldBook.title")}
            </span>
            <span
              className={`ml-1 sm:ml-2 text-xs sm:text-sm text-ink-soft ${serifFontClass} inline-block truncate max-w-[140px] sm:max-w-[200px] align-bottom`}
              title={characterName}
            >
              - {characterName}
            </span>
          </h2>
          <div className={`hidden md:flex items-center space-x-2 text-xs text-ink-soft ${serifFontClass} flex-shrink-0`}>
            <span className="whitespace-nowrap">
              {t("worldBook.total")}: {entries.length}
            </span>
            <span>•</span>
            <span className="text-amber-400 whitespace-nowrap">
              {t("worldBook.enabled")}: {enabledCount}
            </span>
            <span>•</span>
            <span className="text-blue-400 whitespace-nowrap">
              {t("worldBook.constant")}: {constantCount}
            </span>
            {filterBy !== "all" && (
              <>
                <span>•</span>
                <span className="text-green-400 whitespace-nowrap">
                  {t("worldBook.filtered")}: {filteredCount}
                </span>
              </>
            )}
          </div>
          <div className={`md:hidden flex items-center space-x-1 text-2xs sm:text-xs text-ink-soft ${serifFontClass} flex-shrink-0`}>
            <span className="bg-deep px-1.5 sm:px-2 py-1 rounded border border-ink whitespace-nowrap">
              {entries.length} / {enabledCount} / {constantCount}
              {filterBy !== "all" && ` (${filteredCount})`}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-ink-soft hover:text-cream-soft transition-colors duration-300 rounded-md hover:bg-stroke group flex-shrink-0 ml-2"
        >
          <X className="w-3 h-3 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:scale-110" />
        </button>
      </div>
    </div>
  );
}
