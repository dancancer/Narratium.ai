/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                       Import Modal Footer                                 ║
 * ║                                                                          ║
 * ║  通用导入弹窗底部按钮区                                                     ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React from "react";

interface ImportModalFooterProps {
  activeTab: "file" | "global";
  isImporting: boolean;
  canImport: boolean;
  cancelLabel: string;
  importingLabel: string;
  importLabel: string;
  serifFontClass: string;
  onClose: () => void;
  onImport: () => void;
}

export function ImportModalFooter({
  activeTab,
  isImporting,
  canImport,
  cancelLabel,
  importingLabel,
  importLabel,
  serifFontClass,
  onClose,
  onImport,
}: ImportModalFooterProps) {
  return (
    <div className="relative p-3 border-t border-ink/40 bg-gradient-to-r from-muted-surface/80 via-deep/60 to-muted-surface/80 backdrop-blur-sm flex justify-end space-x-2">
      <button
        onClick={onClose}
        className={`px-3 py-1.5 text-xs text-ink-soft hover:text-cream-soft transition-all duration-300 rounded-md hover:bg-stroke/30 ${serifFontClass}`}
      >
        {cancelLabel}
      </button>
      {activeTab === "global" && (
        <button
          onClick={onImport}
          disabled={isImporting || !canImport}
          className={`relative px-3 py-1.5 bg-gradient-to-r from-blue-600/90 to-blue-700/90 hover:from-blue-500/90 hover:to-blue-600/90 text-white rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5 text-xs font-medium shadow-lg shadow-blue-500/20 ${serifFontClass}`}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-blue-600/20 rounded-md opacity-0 hover:opacity-100 transition-opacity duration-300" />
          {isImporting && (
            <div className="relative w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          )}
          <span className="relative">{isImporting ? importingLabel : importLabel}</span>
        </button>
      )}
    </div>
  );
}
