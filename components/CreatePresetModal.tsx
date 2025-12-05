"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { useLanguage } from "@/app/i18n";
import { createPreset } from "@/function/preset/global";
import { toast } from "react-hot-toast";

interface CreatePresetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreatePresetModal({ isOpen, onClose, onSuccess }: CreatePresetModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [presetName, setPresetName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!presetName.trim()) {
      toast.error(t("preset.presetNameRequired"));
      return;
    }

    setIsCreating(true);
    
    try {
      const newPreset = {
        name: presetName.trim(),
        enabled: true,
        prompts: [],
      };

      const result = await createPreset(newPreset);
      if (result.success) {
        toast.success(t("preset.createSuccess"));
        onSuccess();
        handleClose();
      } else {
        toast.error(t("preset.createFailed"));
      }
    } catch (error) {
      console.error("Create preset failed:", error);
      toast.error(t("preset.createFailed"));
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setPresetName("");
    setIsCreating(false);
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
        <div className="p-4 border-b border-ink bg-gradient-to-r from-amber-500/5 to-transparent">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-medium text-cream-soft ${serifFontClass}`}>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300">
                {t("preset.createPreset")}
              </span>
            </h3>
            <button
              onClick={handleClose}
              className="w-7 h-7 flex items-center justify-center text-ink-soft hover:text-cream-soft transition-colors duration-300 rounded-md hover:bg-stroke group"
              disabled={isCreating}
            >
              <X className="h-3.5 w-3.5 transition-transform duration-300 group-hover:scale-110" />
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className={`block text-sm font-medium text-ink-soft mb-2 ${fontClass}`}>
              {t("preset.presetName")}
            </label>
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder={t("preset.presetNamePlaceholder")}
              disabled={isCreating}
              className={`w-full px-3 py-2 bg-gradient-to-br from-deep via-muted-surface to-deep 
                text-cream-soft rounded-md border border-ink 
                focus:border-amber-500/60 focus:outline-none focus:ring-2 focus:ring-amber-500/20 
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
              disabled={isCreating}
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
              disabled={isCreating || !presetName.trim()}
              className={`px-4 py-2 text-sm font-medium 
                bg-gradient-to-r from-ember to-coal 
                hover:from-muted-surface hover:to-ember 
                text-amber-soft hover:text-amber-soft 
                rounded-md transition-all duration-300 
                shadow-lg hover:shadow-amber-bright/20 
                border border-ink
                disabled:opacity-50 disabled:cursor-not-allowed ${fontClass}
                flex items-center`}
            >
              {isCreating && (
                <div className="w-4 h-4 mr-2 border-2 border-amber-soft border-t-transparent rounded-full animate-spin"></div>
              )}
              {isCreating ? t("preset.creating") : t("preset.create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 
