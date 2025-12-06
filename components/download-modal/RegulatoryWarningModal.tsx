/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     RegulatoryWarningModal                               ║
 * ║                                                                          ║
 * ║  合规警告弹窗 - 首次访问下载页时显示                                        ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { motion } from "framer-motion";
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm bg-black/70"
      />

      {/* 弹窗内容 */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-deep rounded-lg shadow-2xl border border-ink relative z-10 max-w-md w-full mx-4 p-6"
      >
        <div className="text-center">
          {/* 警告图标 */}
          <div className="mb-4">
            <div className="w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-full flex items-center justify-center">
              <svg
                className="w-6 h-6 text-amber-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <h3 className={`text-lg font-semibold text-cream-soft mb-2 ${serifFontClass}`}>
              {t("downloadModal.regulatoryWarning.title")}
            </h3>
          </div>

          {/* 警告信息 */}
          <p className={`text-amber-soft text-sm mb-6 leading-relaxed ${fontClass}`}>
            {t("downloadModal.regulatoryWarning.message")}
          </p>

          {/* 按钮组 */}
          <div className="flex flex-col gap-3">
            <button
              onClick={() => handleClose(false)}
              className={`w-full bg-gradient-to-br from-sand to-amber-bright text-ink font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-sand/20 ${fontClass}`}
            >
              {t("downloadModal.regulatoryWarning.understand")}
            </button>

            <button
              onClick={() => handleClose(true)}
              className={`w-full text-ink-soft hover:text-amber-soft py-2 px-4 rounded-lg transition-colors duration-200 text-sm ${fontClass}`}
            >
              {t("downloadModal.regulatoryWarning.doNotShowAgain")}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
