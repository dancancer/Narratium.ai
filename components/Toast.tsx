import React, { useEffect } from "react";
import { CheckCircle2, TriangleAlert, X, XCircle } from "lucide-react";
import { useLanguage } from "@/app/i18n";

export type ToastType = "success" | "warning" | "error";

interface ToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
  type?: ToastType;
  title?: string;
  autoClose?: boolean;
  duration?: number;
}

interface ErrorToastProps {
  message: string;
  isVisible: boolean;
  onClose: () => void;
}

// Enhanced Toast component with multiple states
export function Toast({ 
  message, 
  isVisible, 
  onClose, 
  type = "error", 
  title,
  autoClose = true,
  duration = 5000,
}: ToastProps) {
  const { t } = useLanguage();

  useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose, autoClose, duration]);

  if (!isVisible) return null;

  const getToastConfig = (type: ToastType) => {
    switch (type) {
    case "success":
      return {
        borderColor: "border-green-600",
        iconColor: "text-green-400",
        titleColor: "text-green-100",
        messageColor: "text-green-200",
        defaultTitle: t("toast.success") || "Success",
        icon: (
          <CheckCircle2 className="h-5 w-5" />
        ),
      };
    case "warning":
      return {
        borderColor: "border-yellow-600",
        iconColor: "text-yellow-400",
        titleColor: "text-yellow-100",
        messageColor: "text-yellow-200",
        defaultTitle: t("toast.warning") || "Warning",
        icon: (
          <TriangleAlert className="h-5 w-5" />
        ),
      };
    case "error":
    default:
      return {
        borderColor: "border-ink-soft",
        iconColor: "text-amber-soft",
        titleColor: "text-cream",
        messageColor: "text-amber-soft",
        defaultTitle: t("characterChat.requestFailed") || "Error",
        icon: (
          <XCircle className="h-5 w-5" />
        ),
      };
    }
  };

  const config = getToastConfig(type);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className={`bg-muted-surface ${config.borderColor} border rounded-lg shadow-lg p-4 max-w-sm mx-4`}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <div className={config.iconColor}>
              {config.icon}
            </div>
          </div>
          <div className="ml-3 flex-1">
            <p className={`text-sm ${config.titleColor} font-medium`}>
              {title || config.defaultTitle}
            </p>
            <p className={`text-sm ${config.messageColor} mt-1`}>
              {message}
            </p>
          </div>
          <div className="ml-4 flex-shrink-0 flex">
            <button
              onClick={onClose}
              className="inline-flex text-ink-soft hover:text-amber-soft focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
 
