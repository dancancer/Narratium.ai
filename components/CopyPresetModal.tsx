"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/app/i18n";
import { createPreset, getPreset } from "@/function/preset/global";
import { toast } from "react-hot-toast";

interface CopyPresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  sourcePresetId: string;
  sourcePresetName: string;
}

export default function CopyPresetModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  sourcePresetId, 
  sourcePresetName, 
}: CopyPresetModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [presetName, setPresetName] = useState("");
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPresetName(`${sourcePresetName} (Copy)`);
    }
  }, [isOpen, sourcePresetName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!presetName.trim()) {
      toast.error(t("preset.presetNameRequired"));
      return;
    }

    if (!sourcePresetId) {
      toast.error(t("preset.sourcePresetNotFound"));
      return;
    }

    setIsCopying(true);
    
    try {
      // 获取源预设的完整数据
      const sourceResult = await getPreset(sourcePresetId);
      
      if (!sourceResult.success || !sourceResult.data) {
        toast.error(t("preset.loadSourceFailed"));
        return;
      }

      // 创建新预设，复制源预设的所有数据
      const newPreset = {
        name: presetName.trim(),
        enabled: false, // 新复制的预设默认不启用
        prompts: sourceResult.data.prompts || [],
      };

      const result = await createPreset(newPreset);
      if (result.success) {
        toast.success(t("preset.copySuccess"));
        onSuccess();
        handleClose();
      } else {
        toast.error(t("preset.copyFailed"));
      }
    } catch (error) {
      console.error("Copy preset failed:", error);
      toast.error(t("preset.copyFailed"));
    } finally {
      setIsCopying(false);
    }
  };

  const handleClose = () => {
    setPresetName("");
    setIsCopying(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md mx-4 bg-gradient-to-br from-deep via-muted-surface to-deep rounded-lg border border-ink shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-ink bg-gradient-to-r from-blue-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium text-cream-soft ${serifFontClass}`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-300">
                {t("preset.copyPreset")}
              </span>
            </h3>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center text-ink-soft hover:text-cream-soft transition-colors duration-300 rounded-md hover:bg-stroke group"
              disabled={isCopying}
            >
              <X className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={`block text-sm font-medium text-ink-soft mb-2 ${fontClass}`}>
              {t("preset.sourcePreset")}
            </label>
            <div className="px-3 py-2 bg-muted-surface/50 text-ink-soft rounded-md border border-ink/50 text-sm">
              {sourcePresetName}
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium text-ink-soft mb-2 ${fontClass}`}>
              {t("preset.newPresetName")}
            </label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t("preset.newPresetNamePlaceholder")}
              disabled={isCopying}
              className={`w-full px-3 py-2 bg-gradient-to-br from-deep via-muted-surface to-deep 
                text-cream-soft rounded-md border border-ink 
                focus:border-blue-500/60 focus:outline-none focus:ring-2 focus:ring-blue-500/20 
                transition-all duration-300 hover:border-ink backdrop-blur-sm
                shadow-inner ${fontClass}
                disabled:opacity-50 disabled:cursor-not-allowed`}
              autoFocus
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isCopying}
              className={`px-4 py-2 text-sm font-medium text-ink-soft hover:text-cream-soft 
                bg-gradient-to-br from-deep via-muted-surface to-deep 
                border border-ink rounded-md 
                hover:border-ink transition-all duration-300 backdrop-blur-sm
                disabled:opacity-50 disabled:cursor-not-allowed ${fontClass}`}
            >
              {t("preset.cancel")}
            </button>
            <button
              type="submit"
              disabled={isCopying || !presetName.trim()}
              className={`px-4 py-2 text-sm font-medium 
                bg-gradient-to-r from-ember to-coal 
                hover:from-ember hover:to-coal 
                text-sky hover:text-sky/80 
                rounded-md transition-all duration-300 
                shadow-lg hover:shadow-blue-500/20 
                border border-info
                disabled:opacity-50 disabled:cursor-not-allowed ${fontClass}
                flex items-center`}
            >
              {isCopying && (
                <div className="w-4 h-4 mr-2 border-2 border-sky border-t-transparent rounded-full animate-spin"></div>
              )}
              {isCopying ? t("preset.copying") : t("preset.copy")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
