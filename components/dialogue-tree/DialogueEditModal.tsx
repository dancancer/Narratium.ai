/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       DialogueEditModal                                   ║
 * ║  节点内容编辑弹窗：展示摘要 + 文本编辑 + 保存/取消                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { RefObject } from "react";
import { X, MessageSquare } from "lucide-react";
import { DialogueNode } from "@/hooks/useDialogueTreeData";

interface DialogueEditModalProps {
  node: DialogueNode;
  isSaving: boolean;
  editContent: string;
  onChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
  fontClass: string;
  serifFontClass: string;
  modalRef: RefObject<HTMLDivElement | null>;
  t: (key: string) => string;
}

export function DialogueEditModal({
  node,
  isSaving,
  editContent,
  onChange,
  onClose,
  onSave,
  fontClass,
  serifFontClass,
  modalRef,
  t,
}: DialogueEditModalProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md z-20">
      <div ref={modalRef} className="bg-deep bg-opacity-85 border border-ink rounded-lg p-6 w-[80%] max-w-2xl backdrop-filter backdrop-blur-sm shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h4 className={`text-cream text-lg ${serifFontClass}`}>{t("dialogue.editNode")}</h4>
          <button onClick={onClose} className="text-text-muted hover:text-amber-400 transition-colors duration-300" aria-label={t("common.close")}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="fantasy-bg border border-ink rounded-md p-3 mb-4 shadow-inner">
          <h5 className={`text-amber-400 text-sm mb-2 ${serifFontClass}`}>{t("dialogue.memorySummary")}:</h5>
          <div className="ml-2">
            <ol className={`list-decimal list-inside ${fontClass} text-cream text-sm`}>
              {node.data.label.split(/——>|-->|->|→/).map((step, index) => (
                <li key={index} className="mb-1">
                  {step.trim()}
                </li>
              ))}
            </ol>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className={`block text-amber text-sm mb-2 ${serifFontClass}`}>
              <span className="flex items-center">
                <MessageSquare className="w-3.5 h-3.5 mr-1" />
                {t("dialogue.response")}
              </span>
            </label>
            <textarea
              value={editContent}
              onChange={(e) => onChange(e.target.value)}
              className={`w-full h-64 p-3 bg-coal border border-stroke-strong rounded-md text-cream fantasy-scrollbar focus:outline-none focus:border-amber-400 ${fontClass} text-sm leading-relaxed`}
              placeholder={t("dialogue.responsePlaceholder")}
            />
          </div>
        </div>

        <div className="flex justify-end gap-5 mt-4">
          <button onClick={onClose} className={`text-text-muted hover:text-amber-400 transition-colors duration-300 ${serifFontClass}`} aria-label={t("common.cancel")} disabled={isSaving}>
            {t("common.cancel")}
          </button>
          {isSaving ? (
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 rounded-full border-2 border-t-amber-bright border-r-amber-soft border-b-ink-soft border-l-transparent animate-spin"></div>
              <div className="absolute inset-1 rounded-full border-2 border-t-ink-soft border-r-amber-bright border-b-amber-soft border-l-transparent animate-spin-slow"></div>
            </div>
          ) : (
            <button onClick={onSave} className={`text-amber-400 hover:text-amber-300 transition-colors duration-300 ${serifFontClass}`} aria-label={t("common.save")}>
              {t("common.save")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
