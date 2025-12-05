/**
 * Character Chat Panel Component
 *
 * This component implements the main chat interface for character interactions, featuring:
 * - Real-time message display with HTML formatting
 * - Character avatar and name display
 * - Message regeneration and truncation capabilities
 * - Suggested input system
 * - Auto-scrolling chat history
 * - Fantasy-themed UI elements
 *
 * The component handles both user and character messages, with special formatting
 * and interactive features for each message type.
 *
 * Dependencies:
 * - ChatHtmlBubble: For rendering formatted chat messages
 * - CharacterAvatarBackground: For character avatar display
 * - Google Analytics: For tracking user interactions
 */

"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import ChatHtmlBubble from "@/components/ChatHtmlBubble";
import ThinkBubble from "@/components/ThinkBubble";
import { CharacterAvatarBackground } from "@/components/CharacterAvatarBackground";
import UserNameSettingModal from "@/components/UserNameSettingModal";
import { getDisplayUsername, setDisplayUsername } from "@/utils/username-helper";
import { trackButtonClick, trackFormSubmit } from "@/utils/google-analytics";

/**
 * API Configuration types
 */
type LLMType = "openai" | "ollama" | "gemini";

interface APIConfig {
  id: string;
  name: string;
  type: LLMType;
  baseUrl: string;
  model: string;
  apiKey?: string;
  availableModels?: string[]; // Available models for this config
}

/**
 * Interface definitions for the component's data structures
 */
interface Character {
  id: string;
  name: string;
  personality?: string;
  avatar_path?: string;
}

interface Message {
  id: string;
  role: string;
  thinkingContent?: string;
  content: string;
  timestamp?: string;
  isUser?: boolean;
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
  activeModes: Record<string, any>;
  setActiveModes: React.Dispatch<React.SetStateAction<Record<string, any>>>;
}

/**
 * Main chat panel component that handles character interactions
 *
 * @param {Props} props - Component properties including character data, messages, and callbacks
 * @returns {JSX.Element} The complete chat interface with message history and input controls
 */
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
  const [streamingTarget, setStreamingTarget] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Username setting states
  const [showUserNameModal, setShowUserNameModal] = useState(false);
  const [currentDisplayName, setCurrentDisplayName] = useState("");
  
  // Toggle buttons expansion state
  const [isButtonsExpanded, setIsButtonsExpanded] = useState(false);
  // Control panel expansion state
  const [isControlPanelExpanded, setIsControlPanelExpanded] = useState(false);

  // API Configuration states
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string>("");
  const [showApiDropdown, setShowApiDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState<string>(""); // For the second level dropdown
  const [currentModel, setCurrentModel] = useState<string>(""); // Current active model
  // ====== 配置读取：用最新 localStorage 数据防止旧状态覆盖 ====== //
  const readConfigsFromStorage = (): APIConfig[] => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem("apiConfigs");
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error("Failed to read configs from storage", error);
      return [];
    }
  };

  const mergeConfigsWithStorage = (incoming: APIConfig[]) => {
    const latest = readConfigsFromStorage();
    const merged = new Map<string, APIConfig>();
    latest.forEach((config) => merged.set(config.id, config));
    incoming.forEach((config) => merged.set(config.id, config));
    return Array.from(merged.values());
  };

  const getWorkingConfigs = () =>
    mergeConfigsWithStorage(Array.isArray(configs) ? configs : []);

  useEffect(() => {
    const savedStreaming = localStorage.getItem("streamingEnabled");
    const isStreamingEnabled = savedStreaming !== null ? savedStreaming === "true" : true;

    setActiveModes((prev) => {
      if (prev.streaming === isStreamingEnabled) return prev;
      return { ...prev, streaming: isStreamingEnabled };
    });

    setStreamingTarget(isStreamingEnabled && messages.length > 0 ? messages.length : -1);

    if (savedStreaming === null) {
      localStorage.setItem("streamingEnabled", "true");
    }

    // Load display username using helper function
    setCurrentDisplayName(getDisplayUsername());
  }, [messages.length, setActiveModes]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  const maybeScrollToBottom = (threshold = 120) => {
    const el = scrollRef.current;
    if (!el) return;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distance < threshold) {
      scrollToBottom();
    }
  };

  const [suggestionsCollapsed, setSuggestionsCollapsed] = useState(false);

  const shouldShowRegenerateButton = (message: Message, index: number) => {
    if (isSending) return false;
    if (message.role !== "assistant") return false;
    if (index !== messages.length - 1) return false;

    return true;
  };

  // Username setting helper functions
  const handleUserNameSave = (newDisplayName: string) => {
    setCurrentDisplayName(newDisplayName);
    // Use helper function to set username, which also triggers the event
    setDisplayUsername(newDisplayName);
  };

  // API configuration helper functions
  const getCurrentConfig = () => {
    return configs.find((c) => c.id === activeConfigId);
  };

  const iconConfigs = [
    { keywords: ["deepseek", "deep-seek"], src: "/api-icons/deepseek.svg", alt: "DeepSeek" },
    { keywords: ["claude", "anthropic"], src: "/api-icons/claude.svg", alt: "Claude" },
    { keywords: ["gemini", "google"], src: "/api-icons/gemini.svg", alt: "Gemini" },
    { keywords: ["gemma"], src: "/api-icons/gemma.svg", alt: "Gemma" },
    { keywords: ["ollama", "llama", "mistral", "codellama", "dolphin", "vicuna", "alpaca"], src: "/api-icons/ollama.svg", alt: "Ollama" },
    { keywords: ["qwen", "qwq", "tongyi"], src: "/api-icons/qwen.svg", alt: "Qwen" },
    { keywords: ["grok", "xai"], src: "/api-icons/grok.svg", alt: "Grok" },
    { keywords: ["kimi", "moonshot"], src: "/api-icons/kimi.svg", alt: "Kimi" },
  ];

  const renderIcon = (src: string, alt: string) => (
    <div className="w-5 h-5 rounded-full overflow-hidden bg-transparent flex items-center justify-center">
      <Image src={src} alt={alt} width={20} height={20} className="object-cover w-full h-full" />
    </div>
  );

  const resolveIcon = (name: string) => {
    const lower = name.toLowerCase();
    const matched = iconConfigs.find(({ keywords }) =>
      keywords.some((keyword) => lower.includes(keyword)),
    );
    return matched || { src: "/api-icons/openai.svg", alt: "OpenAI" };
  };

  const getConfigIcon = (configName: string) => {
    const { src, alt } = resolveIcon(configName);
    return renderIcon(src, alt);
  };

  // Get icon based on model name (for second level)
  const getModelIcon = (modelName: string) => {
    const { src, alt } = resolveIcon(modelName);
    return renderIcon(src, alt);
  };

  // Fetch available models for a config
  const fetchAvailableModels = async (config: APIConfig): Promise<string[]> => {
    if (config.type === "ollama") {
      // For Ollama, return the configured model
      return [config.model || "default"];
    }

    if (!config.baseUrl || !config.apiKey) {
      return ["default"];
    }

    try {
      const response = await fetch(`${config.baseUrl}/models`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
        },
      });
      const data = await response.json();
      const modelList = data.data?.map((item: any) => item.id) || [];
      return modelList.length > 0 ? modelList : ["default"];
    } catch (error) {
      console.error("Failed to fetch models for config", config.id, error);
      return ["default"];
    }
  };

  const handleConfigSelect = async (configId: string) => {
    const mergedConfigs = getWorkingConfigs();
    setConfigs(mergedConfigs);
    const selectedConfig = mergedConfigs.find((c) => c.id === configId);
    if (!selectedConfig) return;

    // If config doesn't have availableModels, fetch them
    let configsWithModels = mergedConfigs;
    if (!selectedConfig.availableModels) {
      const models = await fetchAvailableModels(selectedConfig);
      configsWithModels = mergedConfigs.map((c) =>
        c.id === configId ? { ...c, availableModels: models } : c,
      );
      setConfigs(configsWithModels);
    }

    const configForUse =
      configsWithModels.find((c) => c.id === configId) || selectedConfig;

    if (configForUse.availableModels?.length === 1) {
      // If only one model available, switch directly
      handleModelSwitch(configId, configForUse.availableModels[0]);
      setShowApiDropdown(false);
      setShowModelDropdown(false);
    } else {
      // Show model dropdown for this config
      setSelectedConfigId(configId);
      setShowModelDropdown(true);
      setShowApiDropdown(false);
    }
  };

  const handleModelSwitch = (configId: string, modelName?: string) => {
    const mergedConfigs = getWorkingConfigs();
    const selectedConfig = mergedConfigs.find((c) => c.id === configId);
    if (!selectedConfig) {
      console.error("CharacterChatPanel: Config not found for id", configId);
      return;
    }

    // If modelName is provided, update the config's model
    // For "default", use the original configured model or "default" if none exists
    let updatedConfigs = mergedConfigs;
    if (modelName && modelName !== selectedConfig.model) {
      const actualModelName =
        modelName === "default" ? selectedConfig.model || "default" : modelName;
      updatedConfigs = mergedConfigs.map((c) =>
        c.id === configId ? { ...c, model: actualModelName } : c,
      );
      setConfigs(updatedConfigs);
      localStorage.setItem("apiConfigs", JSON.stringify(updatedConfigs));
    } else {
      setConfigs(updatedConfigs);
    }

    setActiveConfigId(configId);
    const configAfterUpdate =
      updatedConfigs.find((c) => c.id === configId) || selectedConfig;
    setCurrentModel(configAfterUpdate.model);
    localStorage.setItem("activeConfigId", configId);

    // Load configuration values to localStorage
    localStorage.setItem("llmType", configAfterUpdate.type);
    localStorage.setItem(
      configAfterUpdate.type === "openai" ? "openaiBaseUrl" : "ollamaBaseUrl",
      configAfterUpdate.baseUrl,
    );
    localStorage.setItem(
      configAfterUpdate.type === "openai" ? "openaiModel" : "ollamaModel",
      configAfterUpdate.model,
    );
    localStorage.setItem("modelName", configAfterUpdate.model);
    localStorage.setItem("modelBaseUrl", configAfterUpdate.baseUrl);

    // Store API key properly
    if (configAfterUpdate.type === "openai" && configAfterUpdate.apiKey) {
      localStorage.setItem("openaiApiKey", configAfterUpdate.apiKey);
      localStorage.setItem("apiKey", configAfterUpdate.apiKey);
    }

    // Dispatch custom event to notify other components
    window.dispatchEvent(
      new CustomEvent("modelChanged", {
        detail: {
          configId,
          config: configAfterUpdate,
          modelName: configAfterUpdate.model,
          configName: configAfterUpdate.name,
        },
      }),
    );

    setShowApiDropdown(false);
    setShowModelDropdown(false);
    trackButtonClick("CharacterChat", "切换模型");
  };

  useEffect(() => {
    const id = setTimeout(() => scrollToBottom(), 300);
    return () => clearTimeout(id);
  }, [messages]);

  useEffect(() => {
    // On mount, restore fastModel state from localStorage
    const fastModelEnabled = localStorage.getItem("fastModelEnabled");
    if (fastModelEnabled !== null) {
      setActiveModes((prev) => ({
        ...prev,
        fastModel: fastModelEnabled === "true",
      }));
    } else {
      // 默认开启快速回复
      setActiveModes((prev) => ({
        ...prev,
        fastModel: true,
      }));
      localStorage.setItem("fastModelEnabled", "true");
    }
  }, [setActiveModes]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        (showApiDropdown || showModelDropdown) &&
        !target.closest(".api-dropdown-container")
      ) {
        setShowApiDropdown(false);
        setShowModelDropdown(false);
      }
    };

    if (showApiDropdown || showModelDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showApiDropdown, showModelDropdown]);

  // Load API configurations
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadConfigs = () => {
      const savedConfigsStr = localStorage.getItem("apiConfigs");
      let loadedConfigs: APIConfig[] = [];

      if (savedConfigsStr) {
        try {
          loadedConfigs = JSON.parse(savedConfigsStr) as APIConfig[];
        } catch (e) {
          console.error("Error parsing saved API configs", e);
        }
      }

      const storedActiveId = localStorage.getItem("activeConfigId");
      const activeIdCandidate =
        storedActiveId && loadedConfigs.some((c) => c.id === storedActiveId)
          ? storedActiveId
          : loadedConfigs[0]?.id || "";

      setConfigs(loadedConfigs);
      setActiveConfigId(activeIdCandidate);

      // Set current model
      const activeConfig = loadedConfigs.find(
        (c) => c.id === activeIdCandidate,
      );
      if (activeConfig) {
        setCurrentModel(activeConfig.model);
      }
    };

    // Initial load
    loadConfigs();

    // Listen for changes from ModelSidebar
    const handleModelChanged = (event: CustomEvent) => {
      loadConfigs();
    };

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "apiConfigs" || event.key === "activeConfigId") {
        loadConfigs();
      }
    };

    window.addEventListener(
      "modelChanged",
      handleModelChanged as EventListener,
    );
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(
        "modelChanged",
        handleModelChanged as EventListener,
      );
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return (
    <div className="flex flex-col h-full max-h-screen">
      <div
        className="flex-grow overflow-y-auto p-6 fantasy-scrollbar"
        ref={scrollRef}
      >
        <div className="max-w-4xl mx-auto">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 opacity-60">
                <svg className="w-full h-full" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
                    stroke="var(--color-amber-bright)"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className={`text-amber-soft ${serifFontClass}`}>
                {t("characterChat.startConversation")}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {!openingLocked &&
                openingMessages.length > 1 &&
                messages.length === 1 &&
                messages[0].role === "assistant" && (
                <div className="flex items-center justify-center gap-3 text-amber-soft">
                  <button
                    onClick={() => onOpeningNavigate("prev")}
                    disabled={isSending}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-ink bg-surface hover:border-ink-soft hover:text-amber-bright disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="切换上一条开场"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M12.707 15.707a1 1 0 01-1.414 0l-5-5a1 1 0 010-1.414l5-5a1 1 0 111.414 1.414L8.414 10l4.293 4.293a1 1 0 010 1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                  <span className={`text-sm ${serifFontClass}`}>
                    {t("firstMessage") || "开场白"} {openingIndex + 1}/
                    {openingMessages.length}
                  </span>
                  <button
                    onClick={() => onOpeningNavigate("next")}
                    disabled={isSending}
                    className="w-8 h-8 flex items-center justify-center rounded-md border border-ink bg-surface hover:border-ink-soft hover:text-amber-bright disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    aria-label="切换下一条开场"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 4.293a1 1 0 011.414 0L14 9.586a1 1 0 010 1.414l-5.293 5.293a1 1 0 01-1.414-1.414L11.586 10 7.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </button>
                </div>
              )}
              {messages.map((message, index) => {
                if (message.role === "sample") return null;

                return message.role === "user" ? (
                  <div key={index} className="flex justify-end mb-4">
                    <div className="max-w-md lg:max-w-2xl break-words whitespace-pre-line text-cream story-text leading-relaxed magical-text">
                      <p
                        className={`${serifFontClass}`}
                        dangerouslySetInnerHTML={{
                          __html: (
                            message.content.match(
                              /<input_message>([\s\S]*?)<\/input_message>/,
                            )?.[1] || ""
                          ).replace(
                            /^[\s\n\r]*((<[^>]+>\s*)*)?(玩家输入指令|Player Input)[:：]\s*/i,
                            "",
                          ),
                        }}
                      ></p>
                    </div>
                  </div>
                ) : (
                  <div key={index} className="mb-6">
                    <div className="flex items-center mb-2">
                      <div className="w-8 h-8 rounded-full overflow-hidden mr-2">
                        {character.avatar_path ? (
                          <CharacterAvatarBackground
                            avatarPath={character.avatar_path}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-deep">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-ink"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1.5}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                              />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`text-sm font-medium text-cream ${serifFontClass}`}
                        >
                          {character.name}
                        </span>
                        {message.role === "assistant" &&
                          shouldShowRegenerateButton(message, index) && (
                          <>
                            {/* Two-Level API/Model Configuration Selector */}
                            <div className="relative mx-2 api-dropdown-container">
                              <button
                                onClick={() => {
                                  setShowApiDropdown(!showApiDropdown);
                                  setShowModelDropdown(false);
                                }}
                                className="p-1 rounded-md transition-all duration-300 group relative text-text-muted hover:text-amber flex items-center"
                              >
                                <div className="flex items-center">
                                  {getCurrentConfig()
                                    ? getConfigIcon(getCurrentConfig()!.name)
                                    : getConfigIcon("openai")}
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-2 w-2 ml-0.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M19 9l-7 7-7-7"
                                    />
                                  </svg>
                                </div>
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-overlay text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-ink z-50">
                                  {getCurrentConfig()?.name ||
                                      t("modelSettings.noConfigs")}
                                </div>
                              </button>

                              {/* First Level Dropdown - API Configurations */}
                              {showApiDropdown && !showModelDropdown && (
                                <div className="absolute top-full left-0 mt-1 bg-overlay border border-ink rounded-md shadow-lg z-50 min-w-[160px]">
                                  {configs.length > 0 ? (
                                    configs.map((config) => (
                                      <button
                                        key={config.id}
                                        onClick={() =>
                                          handleConfigSelect(config.id)
                                        }
                                        className={`w-full text-left px-2 py-1.5 text-xs hover:bg-muted-surface transition-colors flex items-center justify-between ${
                                          activeConfigId === config.id
                                            ? "bg-muted-surface text-amber"
                                            : "text-cream"
                                        }`}
                                      >
                                        <div className="flex items-center">
                                          <span className="mr-2.5">
                                            {getConfigIcon(config.name)}
                                          </span>
                                          <span
                                            className="truncate"
                                            title={config.name}
                                          >
                                            {config.name.length > 20
                                              ? `${config.name.substring(0, 20)}...`
                                              : config.name}
                                          </span>
                                        </div>
                                        <svg
                                          xmlns="http://www.w3.org/2000/svg"
                                          className="h-3 w-3 ml-2"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                          strokeWidth={2}
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 5l7 7-7 7"
                                          />
                                        </svg>
                                      </button>
                                    ))
                                  ) : (
                                    <div className="px-2 py-1.5 text-xs text-text-muted">
                                      {t("common.noApisConfigured")}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Second Level Dropdown - Models within Config */}
                              {showModelDropdown && selectedConfigId && (
                                <div className="absolute top-full left-0 mt-1 bg-overlay border border-ink rounded-md shadow-lg z-50 min-w-[180px]">
                                  <div className="px-2 py-1.5 text-xs text-text-muted border-b border-ink flex items-center justify-between">
                                    <button
                                      onClick={() => {
                                        setShowModelDropdown(false);
                                        setShowApiDropdown(true);
                                      }}
                                      className="flex items-center text-amber-soft hover:text-amber transition-colors"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-3 w-3 mr-1"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          d="M15 19l-7-7 7-7"
                                        />
                                      </svg>
                                      {t("characterChat.back")}
                                    </button>
                                    <span>
                                      {t("characterChat.selectModel")}
                                    </span>
                                  </div>
                                  {(() => {
                                    const selectedConfig = configs.find(
                                      (c) => c.id === selectedConfigId,
                                    );
                                    if (
                                      !selectedConfig ||
                                        !selectedConfig.availableModels
                                    ) {
                                      return (
                                        <div className="px-2 py-1.5 text-xs text-text-muted flex items-center">
                                          <svg
                                            className="animate-spin h-3 w-3 mr-2"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                          >
                                            <circle
                                              className="opacity-25"
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke="currentColor"
                                              strokeWidth="4"
                                            ></circle>
                                            <path
                                              className="opacity-75"
                                              fill="currentColor"
                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            ></path>
                                          </svg>
                                            Loading models...
                                        </div>
                                      );
                                    }

                                    return selectedConfig.availableModels.map(
                                      (modelName) => (
                                        <button
                                          key={modelName}
                                          onClick={() =>
                                            handleModelSwitch(
                                              selectedConfigId,
                                              modelName,
                                            )
                                          }
                                          className={`w-full text-left px-2 py-1.5 text-xs hover:bg-muted-surface transition-colors flex items-center ${
                                            selectedConfig.model ===
                                                modelName ||
                                              (modelName === "default" &&
                                                selectedConfig.model ===
                                                  "default")
                                              ? "bg-muted-surface text-amber"
                                              : "text-cream"
                                          }`}
                                        >
                                          <span className="mr-2.5">
                                            {modelName === "default"
                                              ? getConfigIcon(
                                                selectedConfig.name,
                                              )
                                              : getModelIcon(modelName)}
                                          </span>
                                          <span
                                            className="truncate"
                                            title={
                                              modelName === "default"
                                                ? t(
                                                  "characterChat.defaultModel",
                                                )
                                                : modelName
                                            }
                                          >
                                            {modelName === "default"
                                              ? t(
                                                "characterChat.defaultModel",
                                              )
                                              : modelName.length > 25
                                                ? `${modelName.substring(0, 25)}...`
                                                : modelName}
                                          </span>
                                        </button>
                                      ),
                                    );
                                  })()}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                setActiveModes((prev) => {
                                  const newStreaming = !prev.streaming;
                                  return { ...prev, streaming: newStreaming };
                                });
                                const newStreaming = !activeModes.streaming;
                                setStreamingTarget(
                                  newStreaming ? messages.length : -1,
                                );
                                localStorage.setItem(
                                  "streamingEnabled",
                                  String(newStreaming),
                                );
                                trackButtonClick(
                                  "toggle_streaming",
                                  "流式输出切换",
                                );
                              }}
                              className={`mx-1 w-6 h-6 flex items-center justify-center bg-surface rounded-lg border shadow-inner transition-all duration-300 group relative ${
                                activeModes.streaming
                                  ? "text-amber-400 hover:text-amber-300 border-amber-400/60 hover:border-amber-300/70 hover:shadow-[0_0_8px_rgba(252,211,77,0.4)]"
                                  : "text-ink-soft hover:text-amber-soft border-stroke hover:border-stroke-strong"
                              }`}
                              data-tooltip={
                                activeModes.streaming
                                  ? t("characterChat.disableStreaming")
                                  : t("characterChat.enableStreaming")
                              }
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-overlay text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-ink">
                                {activeModes.streaming
                                  ? t("characterChat.disableStreaming")
                                  : t("characterChat.enableStreaming")}
                              </div>
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                {/* Stream/Flow icon - horizontal flowing lines */}
                                <path
                                  d="M3 6h18M3 12h18M3 18h18"
                                  stroke={
                                    activeModes.streaming
                                      ? "var(--color-highlight)"
                                      : "currentColor"
                                  }
                                  strokeLinecap="round"
                                  strokeDasharray={
                                    activeModes.streaming ? "4,2" : "none"
                                  }
                                >
                                  {activeModes.streaming && (
                                    <animate
                                      attributeName="stroke-dashoffset"
                                      values="0;6"
                                      dur="1s"
                                      repeatCount="indefinite"
                                    />
                                  )}
                                </path>
                              </svg>
                            </button>
                            <button
                              onClick={() => {
                                setActiveModes((prev) => {
                                  const newFastModel = !prev.fastModel;
                                  // Store fastModel state in localStorage
                                  localStorage.setItem(
                                    "fastModelEnabled",
                                    String(newFastModel),
                                  );
                                  return { ...prev, fastModel: newFastModel };
                                });
                                trackButtonClick(
                                  "toggle_fastmodel",
                                  "快速模式切换",
                                );
                              }}
                              className={`mx-1 w-6 h-6 flex items-center justify-center bg-surface rounded-lg border shadow-inner transition-all duration-300 group relative ${
                                activeModes.fastModel
                                  ? "text-blue-500 hover:text-blue-400 border-blue-500/60 hover:border-blue-400/70 hover:shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                                  : "text-ink-soft hover:text-amber-soft border-stroke hover:border-stroke-strong"
                              }`}
                              data-tooltip={
                                activeModes.fastModel
                                  ? t("characterChat.disableFastModel")
                                  : t("characterChat.enableFastModel")
                              }
                            >
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-overlay text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-ink">
                                {activeModes.fastModel
                                  ? t("characterChat.disableFastModel")
                                  : t("characterChat.enableFastModel")}
                              </div>
                              {/* Lightning bolt SVG for fastmodel, blue when active - mirrored */}
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="12"
                                height="12"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="-scale-x-100"
                              >
                                <path
                                  d="M7 2L17 14h-7v8l-8-12h7z"
                                  fill={
                                    activeModes.fastModel ? "var(--color-sky-strong)" : "none"
                                  }
                                  stroke={
                                    activeModes.fastModel
                                      ? "var(--color-sky-strong)"
                                      : "currentColor"
                                  }
                                />
                              </svg>
                            </button>
                          </>
                        )}
                      </div>
                      <div className="flex items-center">
                        <button
                          onClick={() => {
                            trackButtonClick("page", "跳转到此消息");
                            onTruncate(message.id);
                          }}
                          className="ml-1 w-6 h-6 flex items-center justify-center text-ink-soft hover:text-green-400 bg-surface rounded-lg border border-stroke shadow-inner transition-all duration-300 hover:border-stroke-strong hover:shadow-[0_0_8px_rgba(34,197,94,0.4)] group relative"
                          data-tooltip={t("characterChat.jumpToMessage")}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-overlay text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-ink">
                            {t("characterChat.jumpToMessage")}
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M12 19V5"></path>
                            <polyline points="5 12 12 5 19 12"></polyline>
                          </svg>
                        </button>
                        <button
                          onClick={() => {
                            trackButtonClick("page", "重新生成消息");
                            onRegenerate(message.id);
                          }}
                          className={`ml-1 w-6 h-6 flex items-center justify-center text-ink-soft hover:text-orange-400 bg-surface rounded-lg border border-stroke shadow-inner transition-all duration-300 hover:border-stroke-strong hover:shadow-[0_0_8px_rgba(249,115,22,0.4)] group relative ${
                            shouldShowRegenerateButton(message, index)
                              ? ""
                              : "hidden"
                          }`}
                          data-tooltip={t("characterChat.regenerateMessage")}
                        >
                          <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-overlay text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-ink">
                            {t("characterChat.regenerateMessage")}
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="12"
                            height="12"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="17 1 21 5 17 9"></polyline>
                            <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                            <polyline points="7 23 3 19 7 15"></polyline>
                            <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                          </svg>
                        </button>
                      </div>
                    </div>

                    {/* Think Bubble - Show thinking content if available */}
                    <ThinkBubble
                      thinkingContent={message.thinkingContent || ""}
                      characterName={character.name}
                      fontClass={fontClass}
                      serifFontClass={serifFontClass}
                      t={t}
                    />

                    <ChatHtmlBubble
                      key={message.id}
                      html={message.content}
                      isLoading={
                        isSending &&
                        index === messages.length - 1 &&
                        message.content.trim() === ""
                      }
                      enableStreaming={
                        activeModes.streaming &&
                        message.role === "assistant" &&
                        index >= streamingTarget
                      }
                      onContentChange={
                        index === messages.length - 1
                          ? () => maybeScrollToBottom()
                          : undefined
                      }
                    />
                  </div>
                );
              })}

              {isSending && (
                <div className="flex items-center space-x-2 text-amber-soft mb-8 pb-4 pt-2 min-h-[40px]">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-t-amber-bright border-r-amber-soft border-b-ink-soft border-l-transparent animate-spin"></div>
                    <div className="absolute inset-1 rounded-full border-2 border-t-ink-soft border-r-amber-bright border-b-amber-soft border-l-transparent animate-spin-slow"></div>
                  </div>
                  <span className={`text-sm ${serifFontClass}`}>
                    {character.name}{" "}
                    {t("characterChat.isTyping") || "is typing..."}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-deep border-t border-ink pt-6 pb-6 px-5 z-5 mt-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.2)]">
        {suggestedInputs.length > 0 && !isSending && (
          <div className="relative max-w-4xl mx-auto">
            <button
              onClick={() => setSuggestionsCollapsed(!suggestionsCollapsed)}
              className="absolute -top-10 right-0 bg-overlay hover:bg-muted-surface text-amber-soft hover:text-cream p-1.5 rounded-md border border-ink hover:border-ink-soft transition-all duration-300 shadow-sm hover:shadow z-10"
              aria-label={suggestionsCollapsed ? "展开建议" : "收起建议"}
            >
              {suggestionsCollapsed ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>

            <div
              className={`transition-all duration-300 ease-in-out overflow-hidden ${
                suggestionsCollapsed
                  ? "max-h-0 opacity-0 mb-0"
                  : "max-h-40 opacity-100 mb-6"
              }`}
            >
              <div className="flex flex-wrap gap-2.5">
                {suggestedInputs.map((input, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      trackButtonClick("page", "建议输入");
                      onSuggestedInput(input);
                    }}
                    disabled={isSending}
                    className={`bg-overlay hover:bg-muted-surface text-amber-soft hover:text-cream py-1.5 px-4 rounded-md text-xs border border-ink hover:border-ink-soft transition-all duration-300 shadow-sm hover:shadow menu-item ${
                      isSending ? "opacity-50 cursor-not-allowed" : ""
                    } ${fontClass}`}
                  >
                    {input}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        <form
          onSubmit={(event) => {
            trackFormSubmit("page", "提交表单");
            onSubmit(event);
          }}
          className="max-w-4xl mx-auto"
        >
          <div className="flex gap-2 sm:gap-3">
            <div className="flex-grow magical-input relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-400/20 via-amber-500/5 to-amber-400/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <input
                type="text"
                value={userInput}
                id="send_textarea"
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={
                  t("characterChat.typeMessage") || "Type a message..."
                }
                data-tour="chat-input"
                className="w-full bg-overlay border border-ink rounded-lg py-2 sm:py-2.5 px-3 sm:px-4 text-cream text-sm leading-tight focus:outline-none focus:border-amber-soft shadow-inner relative z-1 transition-all duration-300 group-hover:border-ink-soft"
                disabled={isSending}
              />
            </div>
            {isSending ? (
              <div className="relative w-8 h-8 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-t-amber-bright border-r-amber-soft border-b-ink-soft border-l-transparent animate-spin"></div>
                <div className="absolute inset-1 rounded-full border-2 border-t-ink-soft border-r-amber-bright border-b-amber-soft border-l-transparent animate-spin-slow"></div>
              </div>
            ) : (
              <button
                type="submit"
                disabled={!userInput.trim()}
                className={`portal-button relative overflow-hidden bg-overlay hover:bg-muted-surface text-amber-soft hover:text-cream py-2 px-3 sm:px-4 rounded-lg text-sm border border-ink hover:border-ink-soft shadow-md transition-all duration-300 ${
                  !userInput.trim() ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {t("characterChat.send") || "Send"}
              </button>
            )}
          </div>

          <div className="mt-3 sm:mt-5 flex justify-start gap-1.5 sm:gap-2 md:gap-3 max-w-4xl mx-auto relative">
            {/* Expandable Control Panel */}
            <div className="relative">
              {/* Expanded Control Buttons */}
              <div
                className={`absolute bottom-full left-0 mb-2 z-50 transition-all duration-300 ease-in-out ${
                  isControlPanelExpanded
                    ? "opacity-100 translate-y-0 pointer-events-auto"
                    : "opacity-0 translate-y-2 pointer-events-none"
                }`}
              >
                <div className="flex flex-col gap-2 bg-canvas/95 backdrop-blur-sm rounded-lg p-2 border border-ink/50 shadow-lg">
                  {/* 剧情推进 */}
                  <button
                    type="button"
                    onClick={() => {
                      trackButtonClick("page", "切换故事进度");
                      setActiveModes((prev) => ({
                        ...prev,
                        "story-progress": !prev["story-progress"],
                      }));
                    }}
                    className={`px-1.5 sm:px-2 md:px-4 py-1.5 text-xs rounded-full border transition-all duration-300 whitespace-nowrap min-w-fit ${
                      activeModes["story-progress"]
                        ? "bg-amber text-overlay border-amber shadow-[0_0_8px_rgba(209,163,92,0.5)]"
                        : "bg-overlay text-amber border-ink hover:border-amber shadow-sm hover:shadow-md"
                    }`}
                  >
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 sm:mr-1"
                      >
                        <path d="M5 12h14"></path>
                        <path d="m12 5 7 7-7 7"></path>
                      </svg>
                      <span className="text-2xs sm:text-xs">
                        {t("characterChat.storyProgress") || "剧情推进"}
                      </span>
                    </span>
                  </button>

                  {/* 视角设计 */}
                  <button
                    type="button"
                    onClick={() => {
                      trackButtonClick("page", "切换视角");
                      setActiveModes((prev) => {
                        const perspective = prev["perspective"];

                        if (!perspective.active) {
                          return {
                            ...prev,
                            perspective: {
                              active: true,
                              mode: "novel",
                            },
                          };
                        }

                        if (perspective.mode === "novel") {
                          return {
                            ...prev,
                            perspective: {
                              active: true,
                              mode: "protagonist",
                            },
                          };
                        }

                        return {
                          ...prev,
                          perspective: {
                            active: false,
                            mode: "novel",
                          },
                        };
                      });
                    }}
                    className={`px-1.5 sm:px-2 md:px-4 py-1.5 text-xs rounded-full border transition-all duration-300 whitespace-nowrap min-w-fit ${
                      !activeModes["perspective"].active
                        ? "bg-overlay text-success border-ink hover:border-success shadow-sm hover:shadow-md"
                        : activeModes["perspective"].mode === "novel"
                          ? "bg-success text-overlay border-success shadow-[0_0_8px_color-mix(in srgb,var(--color-success) 45%,transparent)]"
                          : "bg-info text-overlay border-info shadow-[0_0_8px_color-mix(in srgb,var(--color-info) 45%,transparent)]"
                    }`}
                  >
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 sm:mr-1"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="2" y1="12" x2="22" y2="12"></line>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                      </svg>
                      <span className="text-2xs sm:text-xs">
                        {!activeModes["perspective"].active
                          ? t("characterChat.perspective") || "视角设计"
                          : activeModes["perspective"].mode === "novel"
                            ? t("characterChat.novelPerspective") || "小说视角"
                            : t("characterChat.protagonistPerspective") || "主角视角"}
                      </span>
                    </span>
                  </button>

                  {/* 场景过渡 */}
                  <button
                    type="button"
                    onClick={() => {
                      trackButtonClick("page", "切换场景设置");
                      setActiveModes((prev) => ({
                        ...prev,
                        "scene-setting": !prev["scene-setting"],
                      }));
                    }}
                    className={`px-1.5 sm:px-2 md:px-4 py-1.5 text-xs rounded-full border transition-all duration-300 whitespace-nowrap min-w-fit ${
                      activeModes["scene-setting"]
                        ? "bg-info text-overlay border-info shadow-[0_0_8px_rgba(192,147,255,0.5)]"
                        : "bg-overlay text-info border-ink hover:border-info shadow-sm hover:shadow-md"
                    }`}
                  >
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 sm:mr-1"
                      >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="3" y1="9" x2="21" y2="9"></line>
                        <line x1="3" y1="15" x2="21" y2="15"></line>
                        <line x1="9" y1="3" x2="9" y2="21"></line>
                        <line x1="15" y1="3" x2="15" y2="21"></line>
                      </svg>
                      <span className="text-2xs sm:text-xs">
                        {t("characterChat.sceneTransition")}
                      </span>
                    </span>
                  </button>

                  {/* 用户名称 */}
                  <button
                    type="button"
                    onClick={() => {
                      trackButtonClick("page", "设置用户名称");
                      setShowUserNameModal(true);
                    }}
                    className={"px-1.5 sm:px-2 md:px-4 py-1.5 text-xs rounded-full border transition-all duration-300 whitespace-nowrap min-w-fit bg-overlay text-amber-bright border-ink hover:border-amber-bright shadow-sm hover:shadow-md"}
                  >
                    <span className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="12"
                        height="12"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mr-1 sm:mr-1"
                      >
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      <span className="text-2xs sm:text-xs">
                        {t("characterChat.userNameSetting")}
                      </span>
                    </span>
                  </button>
                </div>
              </div>

              {/* Main Control Button */}
              <button
                type="button"
                onClick={() => {
                  setIsControlPanelExpanded(!isControlPanelExpanded);
                  trackButtonClick("page", "切换控制面板");
                }}
                className={`px-1.5 sm:px-2 md:px-4 py-1.5 text-xs rounded-full border transition-all duration-300 ${
                  isControlPanelExpanded
                    ? "bg-amber text-overlay border-amber shadow-[0_0_8px_rgba(209,163,92,0.5)]"
                    : "bg-overlay text-amber border-ink hover:border-amber shadow-sm hover:shadow-md"
                }`}
              >
                <span className="flex items-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`mr-1 sm:mr-1 transition-transform duration-300 ${
                      isControlPanelExpanded ? "rotate-180" : ""
                    }`}
                  >
                    <path d="M18 15l-6-6-6 6"></path>
                  </svg>
                  <span className="text-2xs sm:text-xs">
                    {isControlPanelExpanded ? "收起控制" : "展开控制"}
                  </span>
                </span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Username Setting Modal */}
      <UserNameSettingModal
        isOpen={showUserNameModal}
        onClose={() => setShowUserNameModal(false)}
        currentDisplayName={currentDisplayName}
        onSave={handleUserNameSave}
      />
    </div>
  );
}
