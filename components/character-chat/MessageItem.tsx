/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Message Item Component                             ║
 * ║                                                                            ║
 * ║  单条消息渲染：用户消息 vs 助手消息                                         ║
 * ║  设计原则：用条件渲染替代重复代码，组合优于继承                              ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useCallback } from "react";
import { ArrowUp, RefreshCw, User } from "lucide-react";
import ChatHtmlBubble from "@/components/ChatHtmlBubble";
import ThinkBubble from "@/components/ThinkBubble";
import { CharacterAvatarBackground } from "@/components/CharacterAvatarBackground";
import { trackButtonClick } from "@/utils/google-analytics";
import type { TavernHelperScript } from "@/lib/models/character-model";

// ============================================================================
//                              类型定义
// ============================================================================

export interface Message {
  id: string;
  role: string;
  thinkingContent?: string;
  content: string;
  timestamp?: string;
  isUser?: boolean;
}

interface Character {
  id: string;
  name: string;
  avatar_path?: string;
  extensions?: {
    TavernHelper_scripts?: TavernHelperScript[];
    [key: string]: unknown;
  };
}

interface MessageItemProps {
  message: Message;
  index: number;
  character: Character;
  isLastMessage: boolean;
  isSending: boolean;
  enableStreaming: boolean;
  streamingTarget: number;
  onTruncate: (id: string) => void;
  onRegenerate: (id: string) => void;
  onContentChange?: () => void;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  headerSlot?: React.ReactNode; // API 选择器、流式切换等
}

// ============================================================================
//                              主组件
// ============================================================================

export default function MessageItem({
  message,
  index,
  character,
  isLastMessage,
  isSending,
  enableStreaming,
  streamingTarget,
  onTruncate,
  onRegenerate,
  onContentChange,
  fontClass,
  serifFontClass,
  t,
  headerSlot,
}: MessageItemProps) {
  // 用户消息直接返回简化版
  if (message.role === "user") {
    return <UserMessage message={message} serifFontClass={serifFontClass} />;
  }

  // 助手消息需要完整渲染
  return (
    <AssistantMessage
      message={message}
      index={index}
      character={character}
      isLastMessage={isLastMessage}
      isSending={isSending}
      enableStreaming={enableStreaming}
      streamingTarget={streamingTarget}
      onTruncate={onTruncate}
      onRegenerate={onRegenerate}
      onContentChange={onContentChange}
      fontClass={fontClass}
      serifFontClass={serifFontClass}
      t={t}
      headerSlot={headerSlot}
    />
  );
}

// ============================================================================
//                              用户消息
// ============================================================================

interface UserMessageProps {
  message: Message;
  serifFontClass: string;
}

function UserMessage({ message, serifFontClass }: UserMessageProps) {
  const extractedContent = extractUserContent(message.content);

  return (
    <div className="flex justify-end mb-4">
      <div className="max-w-md lg:max-w-2xl break-words whitespace-pre-line text-cream story-text leading-relaxed magical-text">
        <p
          className={serifFontClass}
          dangerouslySetInnerHTML={{ __html: extractedContent }}
        />
      </div>
    </div>
  );
}

function extractUserContent(content: string): string {
  const match = content.match(/<input_message>([\s\S]*?)<\/input_message>/);
  const extracted = match?.[1] || "";
  return extracted.replace(
    /^[\s\n\r]*((<[^>]+>\s*)*)?(玩家输入指令|Player Input)[:：]\s*/i,
    "",
  );
}

// ============================================================================
//                              助手消息
// ============================================================================

interface AssistantMessageProps {
  message: Message;
  index: number;
  character: Character;
  isLastMessage: boolean;
  isSending: boolean;
  enableStreaming: boolean;
  streamingTarget: number;
  onTruncate: (id: string) => void;
  onRegenerate: (id: string) => void;
  onContentChange?: () => void;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  headerSlot?: React.ReactNode;
}

function AssistantMessage({
  message,
  index,
  character,
  isLastMessage,
  isSending,
  enableStreaming,
  streamingTarget,
  onTruncate,
  onRegenerate,
  onContentChange,
  fontClass,
  serifFontClass,
  t,
  headerSlot,
}: AssistantMessageProps) {
  const showRegenerateButton = !isSending && isLastMessage;

  const handleTruncate = useCallback(() => {
    trackButtonClick("page", "跳转到此消息");
    onTruncate(message.id);
  }, [message.id, onTruncate]);

  const handleRegenerate = useCallback(() => {
    trackButtonClick("page", "重新生成消息");
    onRegenerate(message.id);
  }, [message.id, onRegenerate]);

  return (
    <div className="mb-6">
      {/* 消息头部 */}
      <MessageHeader
        character={character}
        serifFontClass={serifFontClass}
        showRegenerateButton={showRegenerateButton}
        onTruncate={handleTruncate}
        onRegenerate={handleRegenerate}
        t={t}
        headerSlot={headerSlot}
      />

      {/* 思考气泡 */}
      <ThinkBubble
        thinkingContent={message.thinkingContent || ""}
        characterName={character.name}
        fontClass={fontClass}
        serifFontClass={serifFontClass}
        t={t}
      />

      {/* 消息内容 */}
      <ChatHtmlBubble
        key={message.id}
        html={message.content}
        scripts={character.extensions?.TavernHelper_scripts || []}
        isLoading={isSending && isLastMessage && message.content.trim() === ""}
        enableStreaming={enableStreaming && index >= streamingTarget}
        onContentChange={isLastMessage ? onContentChange : undefined}
        enableScript={true}
        onScriptMessage={(data) => {
          if (data.type === "CONSOLE_LOG") {
            console.log("[Script]", ...data.payload.args);
          }
        }}
      />
    </div>
  );
}

// ============================================================================
//                              消息头部
// ============================================================================

interface MessageHeaderProps {
  character: Character;
  serifFontClass: string;
  showRegenerateButton: boolean;
  onTruncate: () => void;
  onRegenerate: () => void;
  t: (key: string) => string;
  headerSlot?: React.ReactNode;
}

function MessageHeader({
  character,
  serifFontClass,
  showRegenerateButton,
  onTruncate,
  onRegenerate,
  t,
  headerSlot,
}: MessageHeaderProps) {
  return (
    <div className="flex items-center mb-2">
      {/* 头像 */}
      <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
        {character.avatar_path ? (
          <CharacterAvatarBackground avatarPath={character.avatar_path} />
        ) : (
          <DefaultAvatar />
        )}
      </div>

      {/* 名称和控制按钮 */}
      <div className="flex items-center">
        <span className={`text-sm font-medium text-cream `}>
          {character.name}
        </span>
        {showRegenerateButton && headerSlot}
      </div>

      {/* 操作按钮 */}
      <div className="flex items-center">
        <ActionButton
          onClick={onTruncate}
          tooltip={t("characterChat.jumpToMessage")}
          icon={<TruncateIcon />}
          hoverColor="green"
        />
        {showRegenerateButton && (
          <ActionButton
            onClick={onRegenerate}
            tooltip={t("characterChat.regenerateMessage")}
            icon={<RegenerateIcon />}
            hoverColor="orange"
          />
        )}
      </div>
    </div>
  );
}

function DefaultAvatar() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-deep">
      <User className="h-4 w-4 text-ink" />
    </div>
  );
}

// ============================================================================
//                              操作按钮
// ============================================================================

interface ActionButtonProps {
  onClick: () => void;
  tooltip: string;
  icon: React.ReactNode;
  hoverColor: "green" | "orange";
}

function ActionButton({ onClick, tooltip, icon, hoverColor }: ActionButtonProps) {
  const colorClass = hoverColor === "green"
    ? "hover:text-green-400 hover:shadow-[0_0_8px_rgba(34,197,94,0.4)]"
    : "hover:text-orange-400 hover:shadow-[0_0_8px_rgba(249,115,22,0.4)]";

  return (
    <button
      onClick={onClick}
      className={`ml-1 w-6 h-6 flex items-center justify-center text-ink-soft bg-surface rounded-md border border-stroke  transition-all duration-300 hover:border-stroke-strong group relative ${colorClass}`}
      data-tooltip={tooltip}
    >
      <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-overlay text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-border">
        {tooltip}
      </div>
      {icon}
    </button>
  );
}

function TruncateIcon() {
  return <ArrowUp className="w-3 h-3" />;
}

function RegenerateIcon() {
  return <RefreshCw className="w-3 h-3" />;
}
