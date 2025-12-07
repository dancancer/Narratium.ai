/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       DialoguePlaceholderCard                             ║
 * ║  对话树空态卡片：提示信息 + 可选按钮                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

interface DialoguePlaceholderCardProps {
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  fontClass: string;
  serifFontClass: string;
}

export function DialoguePlaceholderCard({
  title,
  description,
  actionText,
  onAction,
  fontClass,
  serifFontClass,
}: DialoguePlaceholderCardProps) {
  return (
    <div className="h-[calc(100%-6rem)] w-full flex flex-col items-center justify-center">
      <div className="text-center p-6 border border-border rounded-md bg-surface max-w-lg">
        <h4 className={"text-primary-400 mb-3 "}>{title}</h4>
        <p className={`text-cream mb-4 ${fontClass}`}>{description}</p>
        {actionText && onAction && (
          <button
            onClick={onAction}
            className={`px-4 py-2 bg-muted-surface hover:bg-overlay text-primary-400 rounded-md transition-all duration-300 border border-primary-700 ${fontClass}`}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}
