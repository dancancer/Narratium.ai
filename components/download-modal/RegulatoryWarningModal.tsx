/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     RegulatoryWarningModal                               ║
 * ║                                                                          ║
 * ║  合规警告弹窗 - 首次访问下载页时显示                                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { AlertTriangle } from "lucide-react";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";

export const WARNING_STORAGE_KEY = "narratium_regulatory_warning_shown";

interface RegulatoryWarningModalProps {
  isOpen: boolean;
  onClose: (doNotShowAgain?: boolean) => void;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
}

export function RegulatoryWarningModal({
  isOpen,
  onClose,
  fontClass,
  serifFontClass,
  t,
}: RegulatoryWarningModalProps) {
  const { value: warningShown, setValue: setWarningShown } = useLocalStorageBoolean(WARNING_STORAGE_KEY, false);

  if (!isOpen) return null;

  const handleClose = (doNotShowAgain: boolean) => {
    if (doNotShowAgain) {
      setWarningShown(true);
    }
    onClose(doNotShowAgain);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <div className="absolute inset-0 backdrop-blur-sm bg-black/70 animate-in fade-in duration-200" />

      {/* 弹窗内容 */}
      <div className="bg-deep rounded-md  border border-border relative z-10 max-w-md w-full mx-4 p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="text-center">
          {/* 警告图标 */}
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-primary-100 rounded-full flex items-center justify-center">
              <AlertTriangle size={24} className="text-primary-600" />
            </div>
            <h3 className={`text-lg font-semibold text-cream-soft mb-2 `}>
              {t("downloadModal.regulatoryWarning.title")}
            </h3>
          </div>

          {/* 警告信息 */}
          <p className={`text-primary-soft text-sm mb-6 leading-relaxed ${fontClass}`}>
            {t("downloadModal.regulatoryWarning.message")}
          </p>

          {/* 按钮组 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleClose(false)}
              className={`w-full bg-gradient-to-br from-sand to-primary-bright text-ink font-semibold py-2.5 px-4 rounded-md transition-all duration-200 hover: hover: ${fontClass}`}
            >
              {t("downloadModal.regulatoryWarning.understand")}
            </button>

            <button
              onClick={() => handleClose(true)}
              className={`w-full text-ink-soft hover:text-primary-soft py-2 px-4 rounded-md transition-colors duration-200 text-sm ${fontClass}`}
            >
              {t("downloadModal.regulatoryWarning.doNotShowAgain")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
