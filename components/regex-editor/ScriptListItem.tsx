/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                         ScriptListItem Component                         ║
 * ║                                                                          ║
 * ║  单个正则脚本卡片：展开/折叠、状态切换、编辑/删除操作                        ║
 * ║  从 RegexScriptEditor.tsx 提取，遵循 Linus 哲学：简洁、直接、无冗余          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { forwardRef } from "react";
import { RegexScript } from "@/lib/models/regex-script-model";

/* ═══════════════════════════════════════════════════════════════════════════
   类型定义
   ═══════════════════════════════════════════════════════════════════════════ */

interface ScriptListItemProps {
  scriptId: string;
  script: RegexScript;
  isExpanded: boolean;
  animationComplete: boolean;
  index: number;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  onToggleExpand: (scriptId: string) => void;
  onEdit: (script: RegexScript & { scriptKey: string }) => void;
  onToggle: (scriptId: string) => void;
  onDelete: (scriptId: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════════════════════════ */

const truncateText = (text: string, maxLength = 50): string =>
  text.length > maxLength ? text.substring(0, maxLength) + "..." : text;

/* ═══════════════════════════════════════════════════════════════════════════
   图标组件 - 内联 SVG，避免重复代码
   ═══════════════════════════════════════════════════════════════════════════ */

const Icons = {
  chevron: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  play: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polygon points="10,8 16,12 10,16 10,8" />
    </>
  ),
  pause: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="10" y1="15" x2="10" y2="9" />
      <line x1="14" y1="15" x2="14" y2="9" />
    </>
  ),
  trash: (
    <>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2-2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </>
  ),
};

/* ═══════════════════════════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════════════════════════ */

export const ScriptListItem = forwardRef<HTMLDivElement, ScriptListItemProps>(
  function ScriptListItem(
    { scriptId, script, isExpanded, animationComplete, index, fontClass, serifFontClass, t, onToggleExpand, onEdit, onToggle, onDelete },
    ref,
  ) {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

    return (
      <div
        ref={ref}
        className={`rounded-lg border transition-all duration-300 ${
          script.disabled
            ? "bg-deep border-ink opacity-60"
            : "bg-deep border-stroke-strong/30"
        } ${animationComplete ? "opacity-100 translate-y-0" : "opacity-0 translate-y-5"}`}
        style={{ transitionDelay: `${index * 50}ms` }}
      >
        {/* ─────────────────────────────────────────────────────────────────────
            头部：标题 + 操作按钮
            ───────────────────────────────────────────────────────────────────── */}
        <div className="p-2 sm:p-4 border-b border-ink/50">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
              <button
                onClick={() => onToggleExpand(scriptId)}
                className="text-ink-soft hover:text-cream transition-colors flex-shrink-0"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-3 w-3 sm:h-4 sm:w-4 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {Icons.chevron}
                </svg>
              </button>
              <h4 className={`font-medium ${serifFontClass} ${script.disabled ? "text-ink-soft" : "text-amber-soft"} text-sm sm:text-base truncate flex-1 min-w-0`}>
                {script.scriptName}
              </h4>
            </div>
            <ActionButtons
              scriptId={scriptId}
              script={script}
              fontClass={fontClass}
              serifFontClass={serifFontClass}
              t={t}
              onEdit={onEdit}
              onToggle={onToggle}
              onDelete={onDelete}
            />
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              状态标签
              ───────────────────────────────────────────────────────────────────── */}
          <StatusBadges script={script} t={t} />

          {/* ─────────────────────────────────────────────────────────────────────
              折叠状态：显示正则预览
              ───────────────────────────────────────────────────────────────────── */}
          {!isExpanded && (
            <div className={`text-xs sm:text-sm ${fontClass}`}>
              <span className="text-ink-soft">{t("regexScriptEditor.findRegex")}:</span>
              <code
                className="ml-1 sm:ml-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-deep rounded text-amber-bright font-mono text-2xs sm:text-xs cursor-pointer hover:bg-muted-surface transition-colors break-all"
                onClick={() => onToggleExpand(scriptId)}
              >
                {truncateText(script.findRegex, isMobile ? 30 : 50)}
              </code>
            </div>
          )}
        </div>

        {/* ─────────────────────────────────────────────────────────────────────
            展开状态：显示完整内容
            ───────────────────────────────────────────────────────────────────── */}
        {isExpanded && (
          <ExpandedContent script={script} fontClass={fontClass} t={t} />
        )}
      </div>
    );
  },
);

/* ═══════════════════════════════════════════════════════════════════════════
   子组件：操作按钮
   ═══════════════════════════════════════════════════════════════════════════ */

interface ActionButtonsProps {
  scriptId: string;
  script: RegexScript;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  onEdit: (script: RegexScript & { scriptKey: string }) => void;
  onToggle: (scriptId: string) => void;
  onDelete: (scriptId: string) => void;
}

function ActionButtons({ scriptId, script, fontClass, serifFontClass, t, onEdit, onToggle, onDelete }: ActionButtonsProps) {
  return (
    <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
      <span className={`text-2xs sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded bg-muted-surface text-ink-soft ${fontClass}`}>
        {t("regexScriptEditor.priority")}: {script.placement?.[0] || 999}
      </span>

      {/* 编辑按钮 */}
      <button
        onClick={() => onEdit({ ...script, scriptKey: scriptId })}
        className={`text-2xs sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-overlay to-coal hover:from-muted-surface hover:to-overlay
          text-success hover:text-success rounded-md transition-all duration-300 font-medium
          shadow-lg hover:shadow-success/20 group flex-shrink-0 border border-ink`}
      >
        <span className={`flex items-center ${serifFontClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5 sm:mr-1 transition-transform duration-300 group-hover:scale-110">
            {Icons.edit}
          </svg>
          {t("regexScriptEditor.edit")}
        </span>
      </button>

      {/* 启用/禁用按钮 */}
      <button
        onClick={() => onToggle(scriptId)}
        className={`text-2xs sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-md transition-all duration-300 font-medium shadow-lg group flex-shrink-0 ${
          script.disabled
            ? "bg-gradient-to-r from-overlay to-coal hover:from-muted-surface hover:to-overlay text-success hover:text-success border border-ink hover:shadow-success/20"
            : "bg-gradient-to-r from-ember to-coal hover:from-muted-surface hover:to-ember text-amber-soft hover:text-amber-soft border border-ink hover:shadow-amber-bright/20"
        }`}
      >
        <span className={`flex items-center ${serifFontClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5 sm:mr-1 transition-transform duration-300 group-hover:scale-110">
            {script.disabled ? Icons.play : Icons.pause}
          </svg>
          {script.disabled ? t("regexScriptEditor.enable") : t("regexScriptEditor.disable")}
        </span>
      </button>

      {/* 删除按钮 */}
      <button
        onClick={() => onDelete(scriptId)}
        className={`text-2xs sm:text-xs px-1.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-ember to-coal hover:from-layer hover:to-deep
          text-rose-300 hover:text-rose-200 rounded-md transition-all duration-300 font-medium
          shadow-lg hover:shadow-rose-400/20 group flex-shrink-0 border border-ink`}
      >
        <span className={`flex items-center ${serifFontClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-0.5 sm:mr-1 transition-transform duration-300 group-hover:scale-110">
            {Icons.trash}
          </svg>
          {t("regexScriptEditor.delete")}
        </span>
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   子组件：状态标签
   ═══════════════════════════════════════════════════════════════════════════ */

interface StatusBadgesProps {
  script: RegexScript;
  t: (key: string) => string;
}

function StatusBadges({ script, t }: StatusBadgesProps) {
  return (
    <div className="flex items-center space-x-1.5 sm:space-x-2 mb-1.5 sm:mb-2 flex-wrap">
      <span className={`inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-2xs sm:text-xs font-medium transition-all duration-300 backdrop-blur-sm border ${
        !script.disabled
          ? "bg-gradient-to-br from-slate-800/60 via-amber-900/40 to-slate-800/60 text-amber-200/90 border-amber-600/30"
          : "bg-gradient-to-br from-slate-800/60 via-stone-700/40 to-slate-800/60 text-stone-300/90 border-stone-500/30"
      }`}>
        <span className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full mr-1 sm:mr-2 ${
          !script.disabled ? "bg-amber-400/80" : "bg-stone-400/80"
        }`} />
        {script.disabled ? t("regexScriptEditor.disabled") : t("regexScriptEditor.enabled")}
      </span>

      {script.extensions?.imported && (
        <span className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg text-2xs sm:text-xs font-medium transition-all duration-300 backdrop-blur-sm border bg-gradient-to-br from-slate-800/60 via-blue-700/40 to-slate-800/60 text-blue-300/90 border-blue-500/30 hover:from-slate-700/70 hover:via-blue-600/50 hover:to-slate-700/70 hover:border-blue-400/40 hover:text-blue-200 hover:shadow-lg hover:shadow-blue-500/10">
          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-400/80 rounded-full mr-1 sm:mr-2 shadow-sm shadow-blue-400/50" />
          {t("worldBook.imported")}
        </span>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   子组件：展开内容
   ═══════════════════════════════════════════════════════════════════════════ */

interface ExpandedContentProps {
  script: RegexScript;
  fontClass: string;
  t: (key: string) => string;
}

function ExpandedContent({ script, fontClass, t }: ExpandedContentProps) {
  return (
    <div className="p-2 sm:p-4 space-y-2 sm:space-y-3 bg-deep/50">
      <div className={`text-xs sm:text-sm ${fontClass}`}>
        <span className="text-ink-soft block mb-1">{t("regexScriptEditor.findRegex")}:</span>
        <code className="block px-2 sm:px-3 py-1.5 sm:py-2 bg-deep rounded text-amber-bright font-mono text-2xs sm:text-xs border border-ink/30 break-all">
          {script.findRegex}
        </code>
      </div>

      <div className={`text-xs sm:text-sm ${fontClass}`}>
        <span className="text-ink-soft block mb-1">{t("regexScriptEditor.replaceString")}:</span>
        <code className="block px-2 sm:px-3 py-1.5 sm:py-2 bg-deep rounded text-sky font-mono text-2xs sm:text-xs border border-ink/30 break-all whitespace-pre-wrap">
          {script.replaceString}
        </code>
      </div>

      {script.trimStrings && script.trimStrings.length > 0 && (
        <div className={`text-xs sm:text-sm ${fontClass}`}>
          <span className="text-ink-soft block mb-1">{t("regexScriptEditor.trimStrings")}:</span>
          <div className="flex flex-wrap gap-1">
            {script.trimStrings.map((trimStr, idx) => (
              <code key={idx} className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-deep rounded text-info font-mono text-2xs sm:text-xs border border-ink/30 break-all">
                {trimStr}
              </code>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
