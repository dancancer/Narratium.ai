"use client";

import { useState, useEffect } from "react";
import { Check, RefreshCcw, X } from "lucide-react";
import { useLanguage } from "@/app/i18n";
import { setDisplayUsername, resetDisplayUsername } from "@/utils/username-helper";
import { getString } from "@/lib/storage/client-storage";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface UserNameSettingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDisplayName?: string;
  onSave: (newDisplayName: string) => void;
}

export default function UserNameSettingModal({ 
  isOpen, 
  onClose, 
  currentDisplayName = "",
  onSave, 
}: UserNameSettingModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [displayName, setDisplayName] = useState(currentDisplayName);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setDisplayName(currentDisplayName);
    setError("");
  }, [currentDisplayName, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      setError(t("userNameSetting.nameRequired"));
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Save the display name using helper function
      setDisplayUsername(displayName.trim());
      onSave(displayName.trim());
      onClose();
    } catch (err) {
      console.error("Save display name error:", err);
      setError(t("userNameSetting.saveFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    resetDisplayUsername();
    const loginUsername = getString("username", "");
    setDisplayName(loginUsername);
    setError("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="fantasy-bg bg-opacity-75 border border-ink rounded-lg shadow-lg p-4 sm:p-8 w-full max-w-sm sm:max-w-md backdrop-filter backdrop-blur-sm"
        hideCloseButton
      >
        <DialogTitle className="sr-only">{t("userNameSetting.title")}</DialogTitle>
        {/* ═══════════════════════════════════════════════════════════
            关闭按钮 - Close Button
            ═══════════════════════════════════════════════════════════ */}
        <button 
          onClick={onClose}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 text-ink-soft hover:text-amber-bright transition-colors"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        
        {/* ═══════════════════════════════════════════════════════════
            头部标题 - Header Title
            ═══════════════════════════════════════════════════════════ */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-amber-bright mb-2 font-cinzel">
            {t("userNameSetting.title")}
          </h1>
          <p className={`text-sm text-ink-soft ${fontClass}`}>
            {t("userNameSetting.description")}
          </p>
        </div>

        {/* ═══════════════════════════════════════════════════════════
            错误提示 - Error Message
            ═══════════════════════════════════════════════════════════ */}
        {error && (
          <div className="text-red-400 text-xs sm:text-sm text-center mb-4 p-2 bg-red-900/20 rounded border border-red-500/20">
            {error}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            表单区域 - Form Section
            ═══════════════════════════════════════════════════════════ */}
        <form onSubmit={handleSubmit} className="w-full space-y-6">
          {/* 登录用户名显示 - Login Username Display */}
          <div>
            <label className={`block text-sm text-amber-soft mb-2 ${fontClass}`}>
              {t("userNameSetting.loginUsername")}
            </label>
            <div className="relative magical-input min-h-[50px] flex items-center justify-center bg-overlay/50 border border-ink/50">
              <span className={`text-center text-sm text-text-muted ${serifFontClass}`}>
                {typeof window !== "undefined"
                  ? getString("username", t("userNameSetting.notLoggedIn"))
                  : t("userNameSetting.notLoggedIn")}
              </span>
            </div>
          </div>

          {/* 显示名称输入 - Display Name Input */}
          <div>
            <label className={`block text-sm text-amber-soft mb-2 ${fontClass}`}>
              {t("userNameSetting.displayUsername")}
            </label>
            <div className="relative w-full group">
              <div className="relative magical-input min-h-[60px] flex items-center justify-center">
                <input
                  type="text"
                  placeholder={t("userNameSetting.displayNamePlaceholder")}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  autoComplete="off"
                  className={`bg-transparent border-0 outline-none w-full text-center text-base text-cream-soft placeholder-ink-soft shadow-none focus:ring-0 focus:border-0 caret-[var(--color-amber-bright)] tracking-[0.05em] ${serifFontClass}`}
                />
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-32 h-0.5 opacity-100 transition-opacity duration-300">
                  <div className="w-full h-full bg-gradient-to-r from-transparent via-amber-soft to-transparent"></div>
                </div>
              </div>
            </div>
          </div>

          {/* 操作按钮 - Action Buttons */}
          <div className="flex gap-3 justify-center items-center">
            {/* 重置按钮 - Reset Button */}
            <button
              type="button"
              onClick={handleReset}
              disabled={isLoading}
              className={`group relative px-4 py-2 bg-transparent border border-ink-soft text-ink-soft rounded-full text-sm font-medium transition-all duration-300 hover:border-ink-soft hover:text-ink-soft disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${fontClass}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-ink-soft/0 via-ink-soft/5 to-ink-soft/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-600"></div>
              <div className="relative z-10 flex items-center justify-center gap-2">
                <RefreshCcw className="h-3 w-3" />
                <span className="tracking-wide">{t("userNameSetting.reset")}</span>
              </div>
            </button>

            {/* 保存按钮 - Save Button */}
            <button
              type="submit"
              disabled={isLoading || !displayName.trim()}
              className={`group relative px-6 py-2 bg-transparent border border-amber-soft text-amber-soft rounded-full text-sm font-medium transition-all duration-500 hover:border-amber-bright hover:text-amber-bright hover:shadow-lg hover:shadow-amber-soft/20 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${serifFontClass}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-amber-soft/0 via-amber-soft/10 to-amber-soft/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-amber-bright/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <div className="animate-spin w-3.5 h-3.5 border border-amber-soft border-t-transparent rounded-full"></div>
                    <span className="tracking-wide">{t("userNameSetting.saving")}</span>
                  </>
                ) : (
                  <>
                    <span className="tracking-wide">{t("userNameSetting.save")}</span>
                    <Check className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </>
                )}
              </div>
              <div className="absolute inset-0 rounded-full border border-amber-bright/20 scale-105 opacity-0 group-hover:opacity-100 transition-all duration-300"></div>
            </button>
          </div>

          {/* 帮助文本 - Helper Text */}
          <div className={`text-center mt-4 text-xs text-ink-soft ${fontClass}`}>
            <p>{t("userNameSetting.helperText")}</p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 
