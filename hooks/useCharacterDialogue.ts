/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                       useCharacterDialogue Hook                            ║
 * ║                                                                            ║
 * ║  角色对话核心状态管理：消息、开场白、发送、重生成、分支切换                    ║
 * ║  从 character/page.tsx 提取的核心业务逻辑                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useState, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { initCharacterDialogue } from "@/function/dialogue/init";
import { getCharacterDialogue } from "@/function/dialogue/info";
import { handleCharacterChatRequest } from "@/function/dialogue/chat";
import { switchDialogueBranch } from "@/function/dialogue/truncate";
import { deleteDialogueNode } from "@/function/dialogue/delete";
import { getDisplayUsername } from "@/utils/username-helper";
import {
  UseCharacterDialogueOptions,
  UseCharacterDialogueReturn,
  DialogueMessage,
  OpeningMessage,
} from "@/types/character-dialogue";
import { extractOpeningMessages, formatMessages } from "@/hooks/character-dialogue/message-utils";
import { useDialoguePreferences } from "@/hooks/character-dialogue/useDialoguePreferences";

export type {
  DialogueMessage,
  OpeningMessage,
  Character,
  UseCharacterDialogueOptions,
  UseCharacterDialogueReturn,
} from "@/types/character-dialogue";

// ============================================================================
//                              主 Hook
// ============================================================================

export function useCharacterDialogue({
  characterId,
  onError,
  t,
}: UseCharacterDialogueOptions): UseCharacterDialogueReturn {
  const { language, readLlmConfig, responseLength, fastModelEnabled } = useDialoguePreferences();

  // ========== 对话状态 ==========
  const [messages, setMessages] = useState<DialogueMessage[]>([]);
  const [openingMessages, setOpeningMessages] = useState<OpeningMessage[]>([]);
  const [openingIndex, setOpeningIndex] = useState(0);
  const [openingLocked, setOpeningLocked] = useState(false);
  const [suggestedInputs, setSuggestedInputs] = useState<string[]>([]);
  const [isSending, setIsSending] = useState(false);

  // ========== 获取最新对话 ==========
  const fetchLatestDialogue = useCallback(async () => {
    if (!characterId) return;

    try {
      const username = getDisplayUsername() || undefined;
      const response = await getCharacterDialogue(characterId, language, username);

      if (!response.success) {
        throw new Error(`Failed to load dialogue: ${response}`);
      }

      const dialogue = response.dialogue;
      if (dialogue && dialogue.messages) {
        const formattedMessages = formatMessages(dialogue.messages);
        setMessages(formattedMessages);

        const lastMessage = dialogue.messages[dialogue.messages.length - 1];
        setSuggestedInputs(lastMessage?.parsedContent?.nextPrompts || []);

        const { openings, activeIndex, locked } = extractOpeningMessages(
          dialogue,
          formattedMessages
        );
        setOpeningMessages(openings);
        setOpeningIndex(activeIndex);
        setOpeningLocked(locked);
      }
    } catch (err) {
      console.error("Error refreshing dialogue:", err);
    }
  }, [characterId, language]);

  // ========== 初始化新对话 ==========
  const initializeNewDialogue = useCallback(
    async (charId: string) => {
      try {
        const username = getDisplayUsername();
        const { llmType, modelName, baseUrl, apiKey } = readLlmConfig();

        const initData = await initCharacterDialogue({
          username,
          characterId: charId,
          modelName,
          baseUrl,
          apiKey,
          llmType,
          language,
        });

        if (!initData.success) {
          throw new Error(`Failed to initialize dialogue: ${initData}`);
        }

        const openings = initData.openingMessages || [];
        if (openings.length > 0) {
          setOpeningMessages(openings);
          setOpeningIndex(0);
          setOpeningLocked(false);
          setMessages([
            {
              id: openings[0].id,
              role: "assistant",
              content: openings[0].content,
            },
          ]);
          setSuggestedInputs([]);
        } else if (initData.firstMessage) {
          setOpeningMessages([]);
          setOpeningIndex(0);
          setOpeningLocked(false);
          setMessages([
            {
              id: initData.nodeId,
              role: "assistant",
              content: initData.firstMessage,
            },
          ]);
        }
      } catch (error) {
        console.error("Error initializing dialogue:", error);
        throw error;
      }
    },
    [language, readLlmConfig]
  );

  // ========== 发送消息 ==========
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!characterId || isSending) return;

      try {
        setIsSending(true);
        setOpeningLocked(true);
        setSuggestedInputs([]);

        const userMessage: DialogueMessage = {
          id: new Date().toISOString() + "-user",
          role: "user",
          thinkingContent: "",
          content: message,
        };
        setMessages((prev) => [...prev, userMessage]);

        const { llmType, modelName, baseUrl, apiKey } = readLlmConfig();
        const username = getDisplayUsername();
        const nodeId = uuidv4();

        const response = await handleCharacterChatRequest({
          username,
          characterId,
          message,
          modelName,
          baseUrl,
          apiKey,
          llmType,
          language,
          streaming: true,
          number: responseLength,
          nodeId,
          fastModel: fastModelEnabled,
        });

        if (!response.ok) {
          onError?.(t("characterChat.checkNetworkOrAPI"));
          return;
        }

        const result = await response.json();

        if (result.success) {
          const assistantMessage: DialogueMessage = {
            id: nodeId,
            role: "assistant",
            thinkingContent: result.thinkingContent ?? "",
            content: result.content || "",
          };
          setMessages((prev) => [...prev, assistantMessage]);

          if (result.parsedContent?.nextPrompts) {
            setSuggestedInputs(result.parsedContent.nextPrompts);
          }
        } else {
          onError?.(result.message || t("characterChat.checkNetworkOrAPI"));
        }
      } catch (err) {
        console.error("Error sending message:", err);
        onError?.(t("characterChat.checkNetworkOrAPI"));
      } finally {
        setIsSending(false);
      }
    },
    [characterId, fastModelEnabled, isSending, language, onError, readLlmConfig, responseLength, t]
  );

  // ========== 截断消息（切换分支） ==========
  const truncateMessagesAfter = useCallback(
    async (nodeId: string) => {
      if (!characterId) return;

      try {
        const messageIndex = messages.findIndex((msg) => msg.id === nodeId);
        if (messageIndex === -1) {
          console.warn(`Dialogue branch not found: ${nodeId}`);
          return;
        }

        const response = await switchDialogueBranch({ characterId, nodeId });
        if (!response.success) {
          console.error("Failed to truncate messages", response);
          return;
        }

        const dialogue = response.dialogue;
        if (dialogue) {
          setTimeout(() => {
            const formattedMessages = formatMessages(dialogue.messages);
            setMessages(formattedMessages);

            const lastMessage = dialogue.messages[dialogue.messages.length - 1];
            setSuggestedInputs(lastMessage?.parsedContent?.nextPrompts || []);
          }, 100);
        }
      } catch (error) {
        console.error("Error truncating messages:", error);
      }
    },
    [characterId, messages]
  );

  // ========== 重新生成消息 ==========
  const handleRegenerate = useCallback(
    async (nodeId: string) => {
      if (!characterId) return;

      try {
        const messageIndex = messages.findIndex(
          (msg) => msg.id === nodeId && msg.role === "assistant"
        );
        if (messageIndex === -1) {
          console.warn(`Message not found: ${nodeId}`);
          return;
        }

        const messageToRegenerate = messages[messageIndex];
        if (messageToRegenerate.role !== "assistant") {
          console.warn("Can only regenerate assistant messages");
          return;
        }

        // 找到前一条用户消息
        let userMessage: DialogueMessage | null = null;
        for (let i = messageIndex - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            userMessage = messages[i];
            break;
          }
        }

        if (!userMessage) {
          console.warn("No previous user message found for regeneration");
          return;
        }

        const response = await deleteDialogueNode({ characterId, nodeId });
        if (!response.success) {
          console.error("Failed to delete message", response);
          return;
        }

        const dialogue = response.dialogue;
        if (dialogue) {
          setTimeout(() => {
            const formattedMessages = formatMessages(dialogue.messages);
            setMessages(formattedMessages);

            const lastMessage = dialogue.messages[dialogue.messages.length - 1];
            setSuggestedInputs(lastMessage?.parsedContent?.nextPrompts || []);
          }, 100);
        }

        // 重新发送用户消息
        setTimeout(async () => {
          await handleSendMessage(userMessage!.content);
        }, 300);
      } catch (error) {
        console.error("Error regenerating message:", error);
      }
    },
    [characterId, messages, handleSendMessage]
  );

  // ========== 开场白导航 ==========
  const handleOpeningNavigate = useCallback(
    async (direction: "prev" | "next") => {
      if (!characterId) return;
      if (openingLocked || openingMessages.length <= 1) return;

      const total = openingMessages.length;
      const nextIndex =
        direction === "prev"
          ? (openingIndex - 1 + total) % total
          : (openingIndex + 1) % total;
      const target = openingMessages[nextIndex];

      try {
        const response = await switchDialogueBranch({
          characterId,
          nodeId: target.id,
        });

        if (response.success && response.dialogue) {
          const formattedMessages = formatMessages(response.dialogue.messages);
          setMessages(formattedMessages);
          setSuggestedInputs([]);
          setOpeningIndex(nextIndex);
        } else {
          setMessages([
            {
              id: target.id,
              role: "assistant",
              content: target.content,
            },
          ]);
          setOpeningIndex(nextIndex);
          setSuggestedInputs([]);
        }
      } catch (error) {
        console.error("Error switching opening message:", error);
      }
    },
    [characterId, openingLocked, openingMessages, openingIndex]
  );

  return {
    // 状态
    messages,
    openingMessages,
    openingIndex,
    openingLocked,
    suggestedInputs,
    isSending,

    // 操作
    setMessages,
    setSuggestedInputs,
    fetchLatestDialogue,
    initializeNewDialogue,
    handleSendMessage,
    truncateMessagesAfter,
    handleRegenerate,
    handleOpeningNavigate,

    // 工具
    readLlmConfig,
  };
}
