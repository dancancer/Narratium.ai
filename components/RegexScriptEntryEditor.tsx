/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                  Regex Script Entry Editor Component                       ║
 * ║                                                                            ║
 * ║  正则脚本条目编辑器 - 已迁移至 Radix UI Dialog                                ║
 * ║  脚本名称、正则表达式、替换字符串编辑                                          ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useState, useEffect } from "react";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { useLanguage } from "@/app/i18n";
import { RegexScript } from "@/lib/models/regex-script-model";
import { toast } from "@/lib/store/toast-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ============================================================================
//                              类型定义
// ============================================================================

interface RegexScriptEntryEditorProps {
  isOpen: boolean;
  editingScript: Partial<RegexScript> | null;
  isSaving: boolean;
  onClose: () => void;
  onSave: (script: Partial<RegexScript>) => Promise<void>;
  onScriptChange: (script: Partial<RegexScript>) => void;
}

// ============================================================================
//                              主组件
// ============================================================================

export default function RegexScriptEntryEditor({
  isOpen,
  editingScript,
  isSaving,
  onClose,
  onSave,
  onScriptChange,
}: RegexScriptEntryEditorProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [localScript, setLocalScript] = useState<Partial<RegexScript>>({
    scriptName: "",
    findRegex: "",
    replaceString: "",
    placement: [999],
    disabled: false,
    trimStrings: [],
  });

  // ========== 初始化 ==========

  useEffect(() => {
    if (editingScript) {
      setLocalScript({
        ...editingScript,
        replaceString: editingScript.replaceString || "",
      });
    } else {
      setLocalScript({
        scriptName: "",
        findRegex: "",
        replaceString: "",
        placement: [999],
        disabled: false,
        trimStrings: [],
      });
    }
  }, [editingScript]);

  // ========== 更新处理 ==========

  const updateScript = (updates: Partial<RegexScript>) => {
    const newScript = { ...localScript, ...updates };
    setLocalScript(newScript);
    onScriptChange(newScript);
  };

  // ========== 保存处理 ==========

  const handleSave = async () => {
    if (!localScript.scriptName?.trim() || !localScript.findRegex?.trim()) {
      toast.error(t("regexScriptEditor.requiredFields") || "Please fill in script name and find regex");
      return;
    }
    try {
      const scriptToSave = {
        ...localScript,
        replaceString: localScript.replaceString || "",
      };
      await onSave(scriptToSave);
      handleOpenChange(false);
    } catch (error) {
      console.error("Error saving script:", error);
      toast.error(t("regexScriptEditor.saveError") || "Failed to save script");
    }
  };

  // ========== 表单重置 ==========

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  // ========== 渲染 ==========

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden bg-deep border-ink gap-0">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/3 via-transparent to-amber-500/3 opacity-50 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent pointer-events-none"></div>
        
        <div className="p-5 border-b border-ink/60 relative z-10">
          <DialogHeader>
            <DialogTitle className={`text-lg text-cream-soft magical-text ${serifFontClass} font-medium`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 via-orange-300 to-yellow-400">
                {editingScript?.id ? t("regexScriptEditor.editScript") : t("regexScriptEditor.newScript")}
              </span>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="p-5 relative z-10">
          <div className="space-y-4">
            <div>
              <label className={`block text-xs text-ink-soft mb-1.5 font-medium ${fontClass}`}>
                {t("regexScriptEditor.scriptName")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={localScript.scriptName || ""}
                onChange={(e) => updateScript({ scriptName: e.target.value })}
                className="w-full px-3 py-2 bg-gradient-to-br from-deep to-muted-surface border border-ink/60 rounded-lg text-cream 
                  focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300
                  placeholder-ink-soft/70 hover:border-ink text-sm"
                placeholder={t("regexScriptEditor.scriptNamePlaceholder")}
              />
            </div>

            <div>
              <label className={`block text-xs text-ink-soft mb-1.5 font-medium ${fontClass}`}>
                {t("regexScriptEditor.findRegex")} <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={localScript.findRegex || ""}
                onChange={(e) => updateScript({ findRegex: e.target.value })}
                className="w-full px-3 py-2 bg-gradient-to-br from-deep to-muted-surface border border-ink/60 rounded-lg text-amber-bright 
                  focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300
                  placeholder-ink-soft/70 hover:border-ink font-mono text-sm"
                placeholder={t("regexScriptEditor.findRegexPlaceholder")}
              />
            </div>

            <div>
              <label className={`block text-xs text-ink-soft mb-1.5 font-medium ${fontClass}`}>
                {t("regexScriptEditor.replaceString")} <span className="text-ink-soft text-2xs">({t("regexScriptEditor.optional") || "optional"})</span>
              </label>
              <input
                type="text"
                value={localScript.replaceString || ""}
                onChange={(e) => updateScript({ replaceString: e.target.value })}
                className="w-full px-3 py-2 bg-gradient-to-br from-deep to-muted-surface border border-ink/60 rounded-lg text-sky 
                  focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300
                  placeholder-ink-soft/70 hover:border-ink font-mono text-sm"
                placeholder={t("regexScriptEditor.replaceStringPlaceholder") || "Leave empty to remove matched text"}
              />
              <div className={`mt-1 text-2xs text-ink-soft/80 ${fontClass}`}>
                {(localScript.replaceString || "").length === 0 ? 
                  <span className="flex items-center">
                    <AlertCircle className="h-3 w-3 mr-1 text-orange-400" />
                    {t("regexScriptEditor.emptyReplaceHint") || "Empty: Will remove matched text"}
                  </span> : 
                  `${(localScript.replaceString || "").length} characters`
                }
              </div>
            </div>

            <div className="flex items-end space-x-4">
              <div className="flex-shrink-0">
                <label className={`block text-xs text-ink-soft mb-1.5 font-medium ${fontClass}`}>
                  {t("regexScriptEditor.priority")}
                </label>
                <input
                  type="number"
                  value={localScript.placement?.[0] || 999}
                  onChange={(e) => updateScript({ placement: [parseInt(e.target.value) || 999] })}
                  className="w-20 px-3 py-2 bg-gradient-to-br from-deep to-muted-surface border border-ink/60 rounded-lg text-cream 
                    focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all duration-300
                    hover:border-ink text-sm text-center"
                  min="0"
                  max="999"
                />
              </div>
              <label className="flex items-center space-x-2 pb-2 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={localScript.disabled || false}
                    onChange={(e) => updateScript({ disabled: e.target.checked })}
                    className="sr-only"
                  />
                  <div className={`w-5 h-5 rounded border-2 transition-all duration-300 flex items-center justify-center ${
                    localScript.disabled 
                      ? "bg-gradient-to-br from-orange-600 to-orange-700 border-orange-500/60" 
                      : "bg-gradient-to-br from-deep to-muted-surface border-ink/60 group-hover:border-amber-500/40"
                  }`}>
                    {localScript.disabled && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                </div>
                <span className={`text-xs text-cream font-medium ${fontClass} group-hover:text-amber-200 transition-colors`}>
                  {t("regexScriptEditor.disabled")}
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-ink/30">
              <button
                onClick={() => handleOpenChange(false)}
                className="px-4 py-2 bg-gradient-to-br from-muted-surface to-deep hover:from-muted-surface hover:to-muted-surface 
                  text-cream rounded-lg border border-ink/60 transition-all duration-300 text-sm font-medium
                  hover:border-ink hover:shadow-lg group"
              >
                <span className={`${serifFontClass} group-hover:scale-105 transition-transform inline-block`}>
                  {t("regexScriptEditor.cancel")}
                </span>
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 
                  text-deep rounded-lg font-medium transition-all duration-300 text-sm
                  disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-amber-500/25 group
                  disabled:hover:shadow-none"
              >
                <span className={`${serifFontClass} flex items-center group-hover:scale-105 transition-transform ${isSaving ? "" : "group-hover:text-white"}`}>
                  {isSaving && (
                    <Loader2 className="animate-spin -ml-1 mr-2 h-3 w-3 text-deep" />
                  )}
                  {isSaving ? t("regexScriptEditor.saving") : t("regexScriptEditor.save")}
                </span>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
