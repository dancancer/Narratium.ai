/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                    useCharacterDialogue Hook                               ║
 * ║                                                                            ║
 * ║  基于 Zustand Store 的对话管理 - 消除不稳定依赖                              ║
 * ║  设计原则：数据驱动、引用稳定、性能优化                                        ║
 * ║  【重构】从 useState 迁移到 Zustand Store                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useCallback, useMemo } from "react";
import { useDialogueStore } from "@/lib/store/dialogue-store";
import { useDialoguePreferences } from "@/hooks/character-dialogue/useDialoguePreferences";

/* ═══════════════════════════════════════════════════════════════════════════
   类型定义
   ═══════════════════════════════════════════════════════════════════════════ */

export interface UseCharacterDialogueOptions {
  characterId: string | null;
  onError?: (message: string) => void;
  t: (key: string) => string;
}

/* ═══════════════════════════════════════════════════════════════════════════
   主 Hook
   ═══════════════════════════════════════════════════════════════════════════ */

export function useCharacterDialogue({
  characterId,
  onError,
  t,
}: UseCharacterDialogueOptions) {
  const { language, readLlmConfig, responseLength, fastModelEnabled } = useDialoguePreferences();

  // ═══════════════════════════════════════════════════════════════
  // 从 Store 订阅状态
  // 
  // 【优化】使用选择器只订阅需要的状态，避免不必要的重渲染
  // ═══════════════════════════════════════════════════════════════
  const dialogue = useDialogueStore(
    useCallback(
      (state) => (characterId ? state.dialogues[characterId] : undefined),
      [characterId]
    )
  );

  // ═══════════════════════════════════════════════════════════════
  // Store 操作
  // 
  // 【优化】这些函数引用永久稳定，不会导致依赖问题
  // ═══════════════════════════════════════════════════════════════
  const fetchLatestDialogue = useDialogueStore((state) => state.fetchLatestDialogue);
  const initializeNewDialogue = useDialogueStore((state) => state.initializeNewDialogue);
  const sendMessage = useDialogueStore((state) => state.sendMessage);
  const truncateMessagesAfter = useDialogueStore((state) => state.truncateMessagesAfter);
  const regenerateMessage = useDialogueStore((state) => state.regenerateMessage);
  const navigateOpening = useDialogueStore((state) => state.navigateOpening);
  const setMessages = useDialogueStore((state) => state.setMessages);
  const setSuggestedInputs = useDialogueStore((state) => state.setSuggestedInputs);

  // ═══════════════════════════════════════════════════════════════
  // 包装操作函数
  // 
  // 【优化】使用 useCallback 确保引用稳定
  // 【优化】依赖数组只包含原始值，不包含函数
  // ═══════════════════════════════════════════════════════════════

  const handleFetchLatestDialogue = useCallback(async () => {
    if (!characterId) return;
    await fetchLatestDialogue(characterId, language);
  }, [characterId, language, fetchLatestDialogue]);

  const handleInitializeNewDialogue = useCallback(
    async (charId: string) => {
      const { llmType, modelName, baseUrl, apiKey } = readLlmConfig();
      await initializeNewDialogue({
        characterId: charId,
        language,
        modelName,
        baseUrl,
        apiKey,
        llmType,
      });
    },
    [language, readLlmConfig, initializeNewDialogue]
  );

  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!characterId) return;

      const { llmType, modelName, baseUrl, apiKey } = readLlmConfig();
      await sendMessage({
        characterId,
        message,
        language,
        modelName,
        baseUrl,
        apiKey,
        llmType,
        responseLength,
        fastModel: fastModelEnabled,
        onError,
      });
    },
    [
      characterId,
      language,
      responseLength,
      fastModelEnabled,
      readLlmConfig,
      sendMessage,
      onError,
    ]
  );

  const handleTruncateMessagesAfter = useCallback(
    async (nodeId: string) => {
      if (!characterId) return;
      await truncateMessagesAfter(characterId, nodeId);
    },
    [characterId, truncateMessagesAfter]
  );

  const handleRegenerate = useCallback(
    async (nodeId: string) => {
      if (!characterId) return;

      const { llmType, modelName, baseUrl, apiKey } = readLlmConfig();
      await regenerateMessage(characterId, nodeId, {
        language,
        modelName,
        baseUrl,
        apiKey,
        llmType,
        responseLength,
        fastModel: fastModelEnabled,
        onError,
      });
    },
    [
      characterId,
      language,
      responseLength,
      fastModelEnabled,
      readLlmConfig,
      regenerateMessage,
      onError,
    ]
  );

  const handleOpeningNavigate = useCallback(
    async (direction: "prev" | "next") => {
      if (!characterId) return;
      await navigateOpening(characterId, direction);
    },
    [characterId, navigateOpening]
  );

  const handleSetMessages = useCallback(
    (messages: any[]) => {
      if (!characterId) return;
      setMessages(characterId, messages);
    },
    [characterId, setMessages]
  );

  const handleSetSuggestedInputs = useCallback(
    (inputs: string[]) => {
      if (!characterId) return;
      setSuggestedInputs(characterId, inputs);
    },
    [characterId, setSuggestedInputs]
  );

  // ═══════════════════════════════════════════════════════════════
  // 派生状态
  // 
  // 【优化】使用 useMemo 避免不必要的计算
  // ═══════════════════════════════════════════════════════════════
  const state = useMemo(
    () => ({
      messages: dialogue?.messages || [],
      openingMessages: dialogue?.openingMessages || [],
      openingIndex: dialogue?.openingIndex || 0,
      openingLocked: dialogue?.openingLocked || false,
      suggestedInputs: dialogue?.suggestedInputs || [],
      isSending: dialogue?.isSending || false,
    }),
    [dialogue]
  );

  return {
    // 状态
    ...state,

    // 操作
    fetchLatestDialogue: handleFetchLatestDialogue,
    initializeNewDialogue: handleInitializeNewDialogue,
    handleSendMessage,
    truncateMessagesAfter: handleTruncateMessagesAfter,
    handleRegenerate,
    handleOpeningNavigate,
    setMessages: handleSetMessages,
    setSuggestedInputs: handleSetSuggestedInputs,

    // 工具
    readLlmConfig,
  };
}
