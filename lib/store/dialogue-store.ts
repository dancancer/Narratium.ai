/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                         Dialogue Store                                    ║
 * ║                                                                           ║
 * ║  对话状态的全局管理 - 使用 Zustand 替代 useState                            ║
 * ║  设计原则：单一数据源、类型安全、可预测的状态变更                              ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

import { create } from "zustand";
import { v4 as uuidv4 } from "uuid";
import { initCharacterDialogue } from "@/function/dialogue/init";
import { getCharacterDialogue } from "@/function/dialogue/info";
import { handleCharacterChatRequest } from "@/function/dialogue/chat";
import { switchDialogueBranch } from "@/function/dialogue/truncate";
import { deleteDialogueNode } from "@/function/dialogue/delete";
import { getDisplayUsername } from "@/utils/username-helper";
import { extractOpeningMessages, formatMessages } from "@/hooks/character-dialogue/message-utils";
import type { DialogueMessage, OpeningMessage } from "@/types/character-dialogue";

/* ═══════════════════════════════════════════════════════════════════════════
   类型定义
   ═══════════════════════════════════════════════════════════════════════════ */

export type { DialogueMessage, OpeningMessage } from "@/types/character-dialogue";

interface DialogueState {
  // ========== 状态 ==========
  // 按 characterId 组织的对话状态
  dialogues: Record<string, {
    messages: DialogueMessage[];
    openingMessages: OpeningMessage[];
    openingIndex: number;
    openingLocked: boolean;
    suggestedInputs: string[];
    isSending: boolean;
  }>;

  // ========== 操作 ==========
  // 获取最新对话
  fetchLatestDialogue: (
    characterId: string,
    language: "zh" | "en"
  ) => Promise<void>;

  // 初始化新对话
  initializeNewDialogue: (params: {
    characterId: string;
    language: "zh" | "en";
    modelName: string;
    baseUrl: string;
    apiKey: string;
    llmType: "openai" | "ollama" | "gemini";
  }) => Promise<void>;

  // 发送消息
  sendMessage: (params: {
    characterId: string;
    message: string;
    language: "zh" | "en";
    modelName: string;
    baseUrl: string;
    apiKey: string;
    llmType: "openai" | "ollama" | "gemini";
    responseLength: number;
    fastModel: boolean;
    onError?: (message: string) => void;
  }) => Promise<void>;

  // 截断消息（切换分支）
  truncateMessagesAfter: (
    characterId: string,
    nodeId: string
  ) => Promise<void>;

  // 重新生成消息
  regenerateMessage: (
    characterId: string,
    nodeId: string,
    params: {
      language: "zh" | "en";
      modelName: string;
      baseUrl: string;
      apiKey: string;
      llmType: "openai" | "ollama" | "gemini";
      responseLength: number;
      fastModel: boolean;
      onError?: (message: string) => void;
    }
  ) => Promise<void>;

  // 开场白导航
  navigateOpening: (
    characterId: string,
    direction: "prev" | "next"
  ) => Promise<void>;

  // 设置消息
  setMessages: (characterId: string, messages: DialogueMessage[]) => void;

  // 设置建议输入
  setSuggestedInputs: (characterId: string, inputs: string[]) => void;

  // 清理对话状态
  clearDialogue: (characterId: string) => void;

  // ========== 查询 ==========
  getDialogue: (characterId: string) => DialogueState["dialogues"][string] | undefined;
}

/* ═══════════════════════════════════════════════════════════════════════════
   默认状态
   ═══════════════════════════════════════════════════════════════════════════ */

const DEFAULT_DIALOGUE_STATE = {
  messages: [],
  openingMessages: [],
  openingIndex: 0,
  openingLocked: false,
  suggestedInputs: [],
  isSending: false,
};

/* ═══════════════════════════════════════════════════════════════════════════
   Store 实现
   ═══════════════════════════════════════════════════════════════════════════ */

export const useDialogueStore = create<DialogueState>((set, get) => ({
  // ========== 初始状态 ==========
  dialogues: {},

  // ========== 操作 ==========

  // ─── 获取最新对话 ───
  fetchLatestDialogue: async (characterId, language) => {
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
        const lastMessage = dialogue.messages[dialogue.messages.length - 1];
        const { openings, activeIndex, locked } = extractOpeningMessages(
          dialogue,
          formattedMessages,
        );

        set((state) => ({
          dialogues: {
            ...state.dialogues,
            [characterId]: {
              ...DEFAULT_DIALOGUE_STATE,
              ...state.dialogues[characterId],
              messages: formattedMessages,
              openingMessages: openings,
              openingIndex: activeIndex,
              openingLocked: locked,
              suggestedInputs: lastMessage?.parsedContent?.nextPrompts || [],
            },
          },
        }));
      }
    } catch (err) {
      console.error("Error refreshing dialogue:", err);
    }
  },

  // ─── 初始化新对话 ───
  initializeNewDialogue: async (params) => {
    const { characterId, language, modelName, baseUrl, apiKey, llmType } = params;

    try {
      const username = getDisplayUsername();
      const initData = await initCharacterDialogue({
        username,
        characterId,
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
        set((state) => ({
          dialogues: {
            ...state.dialogues,
            [characterId]: {
              ...DEFAULT_DIALOGUE_STATE,
              openingMessages: openings,
              openingIndex: 0,
              openingLocked: false,
              messages: [
                {
                  id: openings[0].id,
                  role: "assistant",
                  content: openings[0].content,
                },
              ],
              suggestedInputs: [],
            },
          },
        }));
      } else if (initData.firstMessage) {
        set((state) => ({
          dialogues: {
            ...state.dialogues,
            [characterId]: {
              ...DEFAULT_DIALOGUE_STATE,
              messages: [
                {
                  id: initData.nodeId,
                  role: "assistant",
                  content: initData.firstMessage,
                },
              ],
            },
          },
        }));
      }
    } catch (error) {
      console.error("Error initializing dialogue:", error);
      throw error;
    }
  },

  // ─── 发送消息 ───
  sendMessage: async (params) => {
    const {
      characterId,
      message,
      language,
      modelName,
      baseUrl,
      apiKey,
      llmType,
      responseLength,
      fastModel,
      onError,
    } = params;

    const state = get();
    const dialogue = state.dialogues[characterId];
    if (!dialogue || dialogue.isSending) return;

    try {
      // 设置发送状态
      set((state) => ({
        dialogues: {
          ...state.dialogues,
          [characterId]: {
            ...state.dialogues[characterId],
            isSending: true,
            openingLocked: true,
            suggestedInputs: [],
          },
        },
      }));

      // 添加用户消息
      const userMessage: DialogueMessage = {
        id: new Date().toISOString() + "-user",
        role: "user",
        thinkingContent: "",
        content: message,
      };

      set((state) => ({
        dialogues: {
          ...state.dialogues,
          [characterId]: {
            ...state.dialogues[characterId],
            messages: [...state.dialogues[characterId].messages, userMessage],
          },
        },
      }));

      // 发送请求
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
        fastModel,
      });

      if (!response.ok) {
        onError?.("请检查网络连接或 API 配置");
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

        set((state) => ({
          dialogues: {
            ...state.dialogues,
            [characterId]: {
              ...state.dialogues[characterId],
              messages: [...state.dialogues[characterId].messages, assistantMessage],
              suggestedInputs: result.parsedContent?.nextPrompts || [],
            },
          },
        }));
      } else {
        onError?.(result.message || "请检查网络连接或 API 配置");
      }
    } catch (err) {
      console.error("Error sending message:", err);
      onError?.("请检查网络连接或 API 配置");
    } finally {
      set((state) => ({
        dialogues: {
          ...state.dialogues,
          [characterId]: {
            ...state.dialogues[characterId],
            isSending: false,
          },
        },
      }));
    }
  },

  // ─── 截断消息 ───
  truncateMessagesAfter: async (characterId, nodeId) => {
    if (!characterId) return;

    const state = get();
    const dialogue = state.dialogues[characterId];
    if (!dialogue) return;

    try {
      const messageIndex = dialogue.messages.findIndex((msg) => msg.id === nodeId);
      if (messageIndex === -1) {
        console.warn(`Dialogue branch not found: ${nodeId}`);
        return;
      }

      const response = await switchDialogueBranch({ characterId, nodeId });
      if (!response.success) {
        console.error("Failed to truncate messages", response);
        return;
      }

      const dialogueData = response.dialogue;
      if (dialogueData) {
        setTimeout(() => {
          const formattedMessages = formatMessages(dialogueData.messages);
          const lastMessage = dialogueData.messages[dialogueData.messages.length - 1];

          set((state) => ({
            dialogues: {
              ...state.dialogues,
              [characterId]: {
                ...state.dialogues[characterId],
                messages: formattedMessages,
                suggestedInputs: lastMessage?.parsedContent?.nextPrompts || [],
              },
            },
          }));
        }, 100);
      }
    } catch (error) {
      console.error("Error truncating messages:", error);
    }
  },

  // ─── 重新生成消息 ───
  regenerateMessage: async (characterId, nodeId, params) => {
    if (!characterId) return;

    const state = get();
    const dialogue = state.dialogues[characterId];
    if (!dialogue) return;

    try {
      const messageIndex = dialogue.messages.findIndex(
        (msg) => msg.id === nodeId && msg.role === "assistant",
      );
      if (messageIndex === -1) {
        console.warn(`Message not found: ${nodeId}`);
        return;
      }

      const messageToRegenerate = dialogue.messages[messageIndex];
      if (messageToRegenerate.role !== "assistant") {
        console.warn("Can only regenerate assistant messages");
        return;
      }

      // 找到前一条用户消息
      let userMessage: DialogueMessage | null = null;
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (dialogue.messages[i].role === "user") {
          userMessage = dialogue.messages[i];
          break;
        }
      }

      if (!userMessage) {
        console.warn("No previous user message found for regeneration");
        return;
      }

      // 删除旧消息
      const response = await deleteDialogueNode({ characterId, nodeId });
      if (!response.success) {
        console.error("Failed to delete message", response);
        return;
      }

      const dialogueData = response.dialogue;
      if (dialogueData) {
        setTimeout(() => {
          const formattedMessages = formatMessages(dialogueData.messages);
          const lastMessage = dialogueData.messages[dialogueData.messages.length - 1];

          set((state) => ({
            dialogues: {
              ...state.dialogues,
              [characterId]: {
                ...state.dialogues[characterId],
                messages: formattedMessages,
                suggestedInputs: lastMessage?.parsedContent?.nextPrompts || [],
              },
            },
          }));
        }, 100);
      }

      // 重新发送用户消息
      setTimeout(async () => {
        await get().sendMessage({
          characterId,
          message: userMessage!.content,
          ...params,
        });
      }, 300);
    } catch (error) {
      console.error("Error regenerating message:", error);
    }
  },

  // ─── 开场白导航 ───
  navigateOpening: async (characterId, direction) => {
    if (!characterId) return;

    const state = get();
    const dialogue = state.dialogues[characterId];
    if (!dialogue || dialogue.openingLocked || dialogue.openingMessages.length <= 1) return;

    const total = dialogue.openingMessages.length;
    const nextIndex =
      direction === "prev"
        ? (dialogue.openingIndex - 1 + total) % total
        : (dialogue.openingIndex + 1) % total;
    const target = dialogue.openingMessages[nextIndex];

    try {
      const response = await switchDialogueBranch({
        characterId,
        nodeId: target.id,
      });

      if (response.success && response.dialogue) {
        const formattedMessages = formatMessages(response.dialogue.messages);

        set((state) => ({
          dialogues: {
            ...state.dialogues,
            [characterId]: {
              ...state.dialogues[characterId],
              messages: formattedMessages,
              suggestedInputs: [],
              openingIndex: nextIndex,
            },
          },
        }));
      } else {
        set((state) => ({
          dialogues: {
            ...state.dialogues,
            [characterId]: {
              ...state.dialogues[characterId],
              messages: [
                {
                  id: target.id,
                  role: "assistant",
                  content: target.content,
                },
              ],
              openingIndex: nextIndex,
              suggestedInputs: [],
            },
          },
        }));
      }
    } catch (error) {
      console.error("Error switching opening message:", error);
    }
  },

  // ─── 设置消息 ───
  setMessages: (characterId, messages) => {
    set((state) => ({
      dialogues: {
        ...state.dialogues,
        [characterId]: {
          ...(state.dialogues[characterId] || DEFAULT_DIALOGUE_STATE),
          messages,
        },
      },
    }));
  },

  // ─── 设置建议输入 ───
  setSuggestedInputs: (characterId, inputs) => {
    set((state) => ({
      dialogues: {
        ...state.dialogues,
        [characterId]: {
          ...(state.dialogues[characterId] || DEFAULT_DIALOGUE_STATE),
          suggestedInputs: inputs,
        },
      },
    }));
  },

  // ─── 清理对话状态 ───
  clearDialogue: (characterId) => {
    set((state) => {
      const newDialogues = { ...state.dialogues };
      delete newDialogues[characterId];
      return { dialogues: newDialogues };
    });
  },

  // ========== 查询 ==========
  getDialogue: (characterId) => {
    return get().dialogues[characterId];
  },
}));
