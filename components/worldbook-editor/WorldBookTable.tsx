/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       WorldBookTable                                       ║
 * ║  世界书条目表格 + 展开详情                                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React from "react";
import { WorldBookEntryData } from "./index";

interface WorldBookTableProps {
  entries: WorldBookEntryData[];
  expandedRows: Set<string>;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  onToggleRow: (entryId: string) => void;
  onToggleEntry: (entryId: string, enabled: boolean) => void;
  onEdit: (entry: WorldBookEntryData) => void;
  onDelete: (entryId: string) => void;
}

export function WorldBookTable({
  entries,
  expandedRows,
  fontClass,
  serifFontClass,
  t,
  onToggleRow,
  onToggleEntry,
  onEdit,
  onDelete,
}: WorldBookTableProps) {
  return (
    <div className="h-full overflow-y-auto fantasy-scrollbar pb-15">
      <table className="w-full table-fixed">
        <thead className="sticky top-0 bg-muted-surface border-b border-ink z-10">
          <tr>
            <th className={`w-12 sm:w-16 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("worldBook.status")}
            </th>
            <th className={`w-28 sm:w-32 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("worldBook.keyword")}
            </th>
            <th className={`w-20 sm:w-24 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("worldBook.position")}
            </th>
            <th className={`w-20 sm:w-20 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("worldBook.depth")}
            </th>
            <th className={`w-20 sm:w-24 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("worldBook.length")}
            </th>
            <th className={`w-16 sm:w-20 p-1.5 sm:p-3 text-left text-2xs sm:text-xs font-medium text-ink-soft uppercase tracking-wider whitespace-nowrap ${fontClass}`}>
              {t("worldBook.actions")}
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => {
            const isExpanded = expandedRows.has(entry.entry_id);
            return (
              <React.Fragment key={entry.entry_id}>
                <tr className="border-b border-ink hover:bg-muted-surface transition-all duration-300 group">
                  <td className="p-1.5 sm:p-3">
                    <button
                      onClick={() => onToggleEntry(entry.entry_id, !entry.isActive)}
                      className={`relative inline-flex h-5 w-9 sm:h-6 sm:w-11 items-center rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-deep backdrop-blur-sm ${
                        entry.isActive
                          ? "bg-gradient-to-r from-slate-700/80 via-amber-800/60 to-slate-700/80 border border-amber-600/40 focus:ring-amber-500/50"
                          : "bg-gradient-to-r from-slate-700/60 via-stone-600/40 to-slate-700/60 border border-stone-500/30 focus:ring-stone-400/50"
                      }`}
                      title={entry.isActive ? t("worldBook.disable") : t("worldBook.enable")}
                    >
                      <span
                        className={`inline-block h-3 w-3 sm:h-4 sm:w-4 transform rounded-full shadow-lg transition-all duration-300 ${
                          entry.isActive
                            ? "translate-x-5 sm:translate-x-6 bg-gradient-to-br from-amber-300 via-amber-200 to-amber-300 shadow-amber-400/30"
                            : "translate-x-1 bg-gradient-to-br from-stone-300 via-stone-200 to-stone-300 shadow-stone-400/30"
                        }`}
                      />
                    </button>
                  </td>
                  <td className="p-1.5 sm:p-3 text-xs sm:text-sm text-cream-soft max-w-xs">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded bg-coal text-amber-200 text-2xs sm:text-xs border border-ink">
                        {entry.primaryKey || t("worldBook.noKeyword")}
                      </span>
                      {entry.constant && (
                        <span className="text-[10px] sm:text-2xs px-1.5 py-0.5 rounded bg-blue-900/40 text-blue-200 border border-blue-700/40">
                          {t("worldBook.constant")}
                        </span>
                      )}
                      {entry.selective && (
                        <span className="text-[10px] sm:text-2xs px-1.5 py-0.5 rounded bg-green-900/40 text-green-200 border border-green-700/40">
                          {t("worldBook.selective")}
                        </span>
                      )}
                      {entry.use_regex && (
                        <span className="text-[10px] sm:text-2xs px-1.5 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-700/40">
                          regex
                        </span>
                      )}
                      <button
                        onClick={() => onToggleRow(entry.entry_id)}
                        className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-ink-soft hover:text-cream-soft transition-colors duration-300 rounded hover:bg-stroke ml-1 sm:ml-2"
                        title={isExpanded ? t("worldBook.collapse") : t("worldBook.expand")}
                      >
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
                          className={`transition-transform duration-300 ${isExpanded ? "rotate-90" : ""}`}
                        >
                          <path d="M9 18l6-6-6-6"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                  <td className="p-1.5 sm:p-3 text-xs sm:text-sm text-amber-soft">{getPositionText(entry.position, t)}</td>
                  <td className="p-1.5 sm:p-3 text-xs sm:text-sm text-amber-soft">{entry.depth}</td>
                  <td className="p-1.5 sm:p-3 text-xs sm:text-sm text-amber-soft">{entry.contentLength}</td>
                  <td className="p-1.5 sm:p-3">
                    <div className="flex items-center space-x-0.5 sm:space-x-1">
                      <ActionButton
                        title={t("worldBook.edit")}
                        onClick={() => onEdit(entry)}
                        icon={
                          <>
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </>
                        }
                      />
                      <ActionButton
                        title={t("worldBook.delete")}
                        onClick={() => onDelete(entry.entry_id)}
                        className="text-red-400 hover:text-red-300"
                        icon={
                          <>
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2 2h4a2 2 0 0 1 2 2v2"></path>
                          </>
                        }
                      />
                    </div>
                  </td>
                </tr>

                {isExpanded && (
                  <tr className="border-b border-ink bg-gradient-to-b from-deep to-coal transition-all duration-300">
                    <td colSpan={6} className="p-2 sm:p-4">
                      <div className="space-y-2 sm:space-y-3">
                        <div className="flex flex-wrap items-center gap-2 text-2xs sm:text-xs text-ink-soft">
                          <span>
                            {t("worldBook.secondaryKeys")}: {entry.secondaryKeyCount}
                          </span>
                          <span>
                            {t("worldBook.keywords")}: {entry.keyCount}
                          </span>
                          <span>
                            {t("worldBook.updatedAt")}: {new Date(entry.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                        {entry.comment && (
                          <div className="text-ink-soft text-2xs sm:text-xs bg-overlay/40 border border-ink rounded p-2 sm:p-3">
                            {entry.comment}
                          </div>
                        )}
                        <p className={`text-2xs sm:text-xs text-cream-soft leading-relaxed ${fontClass} whitespace-pre-line`}>
                          {entry.content.slice(0, 800)}
                          {entry.content.length > 800 ? "..." : ""}
                        </p>
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
  icon,
}: {
  title: string;
  onClick: () => void;
  className?: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-ink-soft hover:text-cream-soft transition-colors duration-300 rounded hover:bg-stroke group ${className ?? ""}`}
      title={title}
    >
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
        className="transition-transform duration-300 group-hover:scale-110"
      >
        {icon}
      </svg>
    </button>
  );
}

function getPositionText(position: string | number, t: (key: string) => string) {
  const map: Record<string | number, string> = {
    0: t("worldBook.positionOptions.systemPromptStart"),
    1: t("worldBook.positionOptions.afterSystemPrompt"),
    2: t("worldBook.positionOptions.userMessageStart"),
    3: t("worldBook.positionOptions.afterResponseMode"),
    4: t("worldBook.positionOptions.basedOnDepth"),
  };
  return map[position] || t("worldBook.positionOptions.basedOnDepth");
}
