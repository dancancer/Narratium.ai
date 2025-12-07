/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     Character Chat Panel Component                        ║
 * ║                                                                           ║
 * ║  角色聊天面板：编排层组件，组合子组件实现完整功能                                 ║
 * ║  设计原则：只做组合和状态协调，具体逻辑委托给子组件和 hooks                        ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { getDisplayUsername, setDisplayUsername } from "@/utils/username-helper";
import { useApiConfig } from "@/hooks/useApiConfig";
import { useScriptBridge } from "@/hooks/useScriptBridge";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";
import UserNameSettingModal from "@/components/UserNameSettingModal";
import ScriptDebugPanel from "@/components/ScriptDebugPanel";
import type { TavernHelperScript } from "@/lib/models/character-model";

import {
  ApiSelector,
  ChatInput,
  ControlPanel,
  MessageHeaderControls,
  MessageList,
  type Message,
} from "@/components/character-chat";

// ============================================================================
//                              类型定义
// ============================================================================

interface Character {
  id: string;
  name: string;
  personality?: string;
  avatar_path?: string;
  extensions?: {
    TavernHelper_scripts?: TavernHelperScript[];
    [key: string]: unknown;
  };
}

interface Props {
  character: Character;
  messages: Message[];
  openingMessages: { id: string; content: string }[];
  openingIndex: number;
  openingLocked: boolean;
  userInput: string;
  setUserInput: (val: string) => void;
  isSending: boolean;
  suggestedInputs: string[];
  onSubmit: (e: React.FormEvent) => void;
  onSuggestedInput: (input: string) => void;
  onTruncate: (id: string) => void;
  onRegenerate: (id: string) => void;
  onOpeningNavigate: (direction: "prev" | "next") => void;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  activeModes: Record<string, unknown>;
  setActiveModes: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
}

// ============================================================================
//                              主组件
// ============================================================================

export default function CharacterChatPanel({
  character,
  messages,
  openingMessages,
  openingIndex,
  openingLocked,
  userInput,
  setUserInput,
  isSending,
  suggestedInputs,
  onSubmit,
  onSuggestedInput,
  onTruncate,
  onRegenerate,
  onOpeningNavigate,
  fontClass,
  serifFontClass,
  t,
  activeModes,
  setActiveModes,
}: Props) {
  // ========== 状态管理 ==========
  const [streamingTarget, setStreamingTarget] = useState(-1);
  const [showUserNameModal, setShowUserNameModal] = useState(false);
  const [showScriptDebugPanel, setShowScriptDebugPanel] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState("");
  const { value: streamingEnabled, setValue: setStreamingEnabled } = useLocalStorageBoolean("streamingEnabled", true);
  const { value: fastModelEnabled, setValue: setFastModelEnabled } = useLocalStorageBoolean("fastModelEnabled", true);

  // ========== 自定义 Hooks ==========
  const apiConfig = useApiConfig();
  const scriptBridge = useScriptBridge({
    characterId: character.id,
    characterName: character.name,
  });

  // ═══════════════════════════════════════════════════════════════
  // 初始化流式传输状态
  // ───────────────────────────────────────────────────────────────
  // 【优化】拆分职责：流式传输、快速模型、用户名各自独立管理
  // ═══════════════════════════════════════════════════════════════
  
  // 同步流式传输状态
  useEffect(() => {
    setActiveModes((prev) => (prev.streaming === streamingEnabled ? prev : { ...prev, streaming: streamingEnabled }));
    setStreamingTarget(streamingEnabled && messages.length > 0 ? messages.length : -1);
  }, [messages.length, streamingEnabled, setActiveModes]);

  // 同步快速模型状态
  useEffect(() => {
    setActiveModes((prev) => (prev.fastModel === fastModelEnabled ? prev : { ...prev, fastModel: fastModelEnabled }));
  }, [fastModelEnabled, setActiveModes]);

  // 初始化用户名（仅首次）
  useEffect(() => {
    setCurrentDisplayName(getDisplayUsername());
  }, []);

  // ═══════════════════════════════════════════════════════════════
  // 广播最新消息到脚本系统
  // 
  // 为什么不依赖 broadcastMessage？
  // - broadcastMessage 使用 useCallback([])，引用完全稳定
  // - 我们只想在 messages 变化时广播，而不是函数引用变化时
  // - 这是标准的事件发射模式，函数引用不应触发副作用
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (messages.length > 0) {
      scriptBridge.broadcastMessage(messages[messages.length - 1]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  // ========== 事件处理器 ==========
  const handleUserNameSave = useCallback((newDisplayName: string) => {
    setCurrentDisplayName(newDisplayName);
    setDisplayUsername(newDisplayName);
  }, []);

  const handleToggleStreaming = useCallback(() => {
    setActiveModes((prev) => {
      const newStreaming = !prev.streaming;
      setStreamingTarget(newStreaming ? messages.length : -1);
      setStreamingEnabled(newStreaming);
      return { ...prev, streaming: newStreaming };
    });
  }, [messages.length, setActiveModes, setStreamingEnabled]);

  const handleToggleFastModel = useCallback(() => {
    setActiveModes((prev) => {
      const newFastModel = !prev.fastModel;
      setFastModelEnabled(newFastModel);
      return { ...prev, fastModel: newFastModel };
    });
  }, [setActiveModes, setFastModelEnabled]);

  // ========== 渲染函数 ==========
  const renderMessageHeaderSlot = useCallback((message: Message, index: number) => {
    const isLastAssistant = !isSending && message.role === "assistant" && index === messages.length - 1;
    if (!isLastAssistant) return null;

    return (
      <>
        <ApiSelector
          configs={apiConfig.configs}
          activeConfigId={apiConfig.activeConfigId}
          showApiDropdown={apiConfig.showApiDropdown}
          showModelDropdown={apiConfig.showModelDropdown}
          selectedConfigId={apiConfig.selectedConfigId}
          onToggleDropdown={() => {
            apiConfig.setShowApiDropdown(!apiConfig.showApiDropdown);
            apiConfig.setShowModelDropdown(false);
          }}
          onConfigSelect={apiConfig.handleConfigSelect}
          onModelSelect={apiConfig.handleModelSwitch}
          onBackToConfigs={() => {
            apiConfig.setShowModelDropdown(false);
            apiConfig.setShowApiDropdown(true);
          }}
          t={t}
        />
        <MessageHeaderControls
          streaming={!!activeModes.streaming}
          fastModel={!!activeModes.fastModel}
          onToggleStreaming={handleToggleStreaming}
          onToggleFastModel={handleToggleFastModel}
          t={t}
        />
      </>
    );
  }, [apiConfig, activeModes, isSending, messages.length, handleToggleStreaming, handleToggleFastModel, t]);

  // ========== 渲染 ==========
  return (
    <div className="flex flex-col h-full max-h-screen">
      {/* 消息列表 */}
      <MessageList
        messages={messages}
        character={character}
        openingMessages={openingMessages}
        openingIndex={openingIndex}
        openingLocked={openingLocked}
        isSending={isSending}
        enableStreaming={!!activeModes.streaming}
        streamingTarget={streamingTarget}
        onTruncate={onTruncate}
        onRegenerate={onRegenerate}
        onOpeningNavigate={onOpeningNavigate}
        fontClass={fontClass}
        serifFontClass={serifFontClass}
        t={t}
        renderHeaderSlot={renderMessageHeaderSlot}
      />

      {/* 输入区域 */}
      <ChatInput
        userInput={userInput}
        setUserInput={setUserInput}
        isSending={isSending}
        suggestedInputs={suggestedInputs}
        onSubmit={onSubmit}
        onSuggestedInput={onSuggestedInput}
        fontClass={fontClass}
        t={t}
      >
        <ControlPanel
          activeModes={activeModes as { "story-progress": boolean; perspective: { active: boolean; mode: "novel" | "protagonist" }; "scene-setting": boolean }}
          setActiveModes={setActiveModes}
          onOpenUserNameModal={() => setShowUserNameModal(true)}
          onOpenScriptDebug={() => setShowScriptDebugPanel(true)}
          t={t}
        />
      </ChatInput>

      {/* 模态框 */}
      <UserNameSettingModal
        isOpen={showUserNameModal}
        onClose={() => setShowUserNameModal(false)}
        currentDisplayName={currentDisplayName}
        onSave={handleUserNameSave}
      />

      <ScriptDebugPanel
        isOpen={showScriptDebugPanel}
        onClose={() => setShowScriptDebugPanel(false)}
        scripts={scriptBridge.scriptStatuses}
      />
    </div>
  );
}
