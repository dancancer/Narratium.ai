/**
 * Model Sidebar Component
 * 
 * This component provides a comprehensive interface for managing LLM model configurations:
 * - API configuration management (OpenAI and Ollama)
 * - Model selection and testing
 * - Configuration persistence
 * - Real-time model testing
 * - Model list fetching
 * - Configuration naming and editing
 * 
 * The sidebar handles all model-related settings and provides a rich
 * set of features for managing API configurations and model interactions.
 * 
 * Key Features:
 * - Multiple API configuration support
 * - Real-time model testing
 * - Configuration persistence in localStorage
 * - Dynamic model list fetching for OpenAI
 * - Custom configuration naming
 * - Configuration switching and management
 * 
 * Dependencies:
 * - useLanguage: For internationalization
 * - trackButtonClick: For analytics tracking
 */

"use client";

import { useState, useEffect } from "react";
import "@/app/styles/fantasy-ui.css";
import { useLanguage } from "@/app/i18n";
import { trackButtonClick } from "@/utils/google-analytics";
import { ChatOpenAI } from "@langchain/openai";
import { ChatOllama } from "@langchain/ollama";
import { callGeminiOnce } from "@/lib/core/gemini-client";
import { DesktopSidebarView } from "./model-sidebar/DesktopSidebarView";
import { MobileSidebarView } from "./model-sidebar/MobileSidebarView";
import type { APIConfig, LLMType, SidebarActions, SidebarHelpers, SidebarState } from "./model-sidebar/types";

/**
 * Props interface for the ModelSidebar component
 * @property {boolean} isOpen - Controls the visibility of the sidebar
 * @property {() => void} toggleSidebar - Function to toggle the sidebar state
 */
interface ModelSidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

/**
 * Reads default API key and URL from environment variables if available
 */
const DEFAULT_API_KEY = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_KEY || "" : "";
const DEFAULT_API_URL = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL || "" : "";
const STORAGE_KEYS: Record<LLMType, { model: string; baseUrl: string; apiKey?: string }> = {
  openai: { model: "openaiModel", baseUrl: "openaiBaseUrl", apiKey: "openaiApiKey" },
  ollama: { model: "ollamaModel", baseUrl: "ollamaBaseUrl", apiKey: "" },
  gemini: { model: "geminiModel", baseUrl: "geminiBaseUrl", apiKey: "geminiApiKey" },
};

const describeLlmType = (type: LLMType) => {
  if (type === "ollama") return "Ollama API";
  if (type === "gemini") return "Gemini API";
  return "OpenAI API";
};

const getBaseUrlPlaceholder = (type: LLMType) => {
  if (type === "ollama") return "http://localhost:11434";
  if (type === "gemini") return "";
  return "https://api.openai.com/v1";
};

const getModelPlaceholder = (type: LLMType) => {
  if (type === "ollama") return "llama3, mistral, mixtral...";
  if (type === "gemini") return "gemini-1.5-flash, gemini-1.5-pro...";
  return "gpt-4-turbo, claude-3-opus-20240229...";
};

const getStorageKeys = (type: LLMType) => STORAGE_KEYS[type] || STORAGE_KEYS.openai;

// ====== 配置存取辅助：以最新的 localStorage 数据为准，避免保存时覆盖 ====== //
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
  latest.forEach(config => merged.set(config.id, config));
  incoming.forEach(config => merged.set(config.id, config));
  return Array.from(merged.values());
};

export default function ModelSidebar({ isOpen, toggleSidebar }: ModelSidebarProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState<string>("");
  const [showNewConfigForm, setShowNewConfigForm] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string>("");
  const [editingName, setEditingName] = useState("");
  const [showEditHint, setShowEditHint] = useState(true);
  const [isConfigHovered, setIsConfigHovered] = useState(false);
  
  const [llmType, setLlmType] = useState<LLMType>("openai");
  const [baseUrl, setBaseUrl] = useState("");
  const [model, setModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [newConfigName, setNewConfigName] = useState("");
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [getModelListSuccess, setGetModelListSuccess] = useState(false);
  const [getModelListError, setGetModelListError] = useState(false);
  const [testModelSuccess, setTestModelSuccess] = useState(false);
  const [testModelError, setTestModelError] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const [modelListEmpty, setModelListEmpty] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  /**
   * Loads saved configurations from localStorage and initializes the component state
   * Handles error cases and sets up initial active configuration
   */
  useEffect(() => {
    if (typeof window === "undefined") return;

    let mergedConfigs = readConfigsFromStorage();

    // If no configs exist and env variables are set, auto-create a default config
    if (mergedConfigs.length === 0 && (DEFAULT_API_URL || DEFAULT_API_KEY)) {
      // Generate a default config name
      const defaultConfigName = `【1】${DEFAULT_API_URL ? "API" : "OpenAI"}`;
      const defaultConfig: APIConfig = {
        id: generateId(),
        name: defaultConfigName,
        type: "openai",
        baseUrl: DEFAULT_API_URL,
        model: "",
        apiKey: DEFAULT_API_KEY,
      };
      mergedConfigs = [defaultConfig];
      localStorage.setItem("apiConfigs", JSON.stringify(mergedConfigs));
      localStorage.setItem("activeConfigId", defaultConfig.id);
    }

    const storedActiveId = localStorage.getItem("activeConfigId");
    const activeIdCandidate = storedActiveId && mergedConfigs.some((c) => c.id === storedActiveId)
      ? storedActiveId
      : (mergedConfigs[0]?.id || "");

    setConfigs(mergedConfigs);
    setActiveConfigId(activeIdCandidate);

    if (mergedConfigs.length > 0) {
      loadConfigToForm(mergedConfigs.find((c) => c.id === activeIdCandidate)!);
    }
  }, []);

  // Listen for model changes from other components
  useEffect(() => {
    const handleModelChanged = (event: CustomEvent) => {
      const { configId, modelName, configName, config } = event.detail; // Destructure config from detail
      if (configId && configId !== activeConfigId) {
        // Use the config object directly from the event detail
        if (config) {
          setActiveConfigId(configId);
          loadConfigToForm(config); // Use 'config' directly
        } else {
          console.error("ModelSidebar: Config not found for id", configId);
        }
      } else if (configId === activeConfigId && modelName && modelName !== model) {
        // Update model if it changed within the same config
        setModel(modelName);
        const keys = getStorageKeys(llmType);
        localStorage.setItem(keys.model, modelName);
        localStorage.setItem("modelName", modelName);
      }
    };

    window.addEventListener("modelChanged", handleModelChanged as EventListener);

    return () => {
      window.removeEventListener("modelChanged", handleModelChanged as EventListener);
    };
  }, [activeConfigId, model, llmType]); // Removed 'configs' from dependencies

  const handleLlmTypeChange = (type: LLMType) => {
    setLlmType(type);
    if (type === "gemini") {
      setBaseUrl("");
    }
    setAvailableModels([]);
    setModelListEmpty(false);
  };

  /**
   * Loads a configuration into the form fields
   * @param {APIConfig} config - The configuration to load
   */
  const loadConfigToForm = (config: APIConfig) => {
    handleLlmTypeChange(config.type);
    const normalizedBaseUrl = config.type === "gemini" ? "" : config.baseUrl;
    setBaseUrl(normalizedBaseUrl);
    setModel(config.model);
    setApiKey(config.apiKey || "");
    setAvailableModels(config.availableModels || []);
    setModelListEmpty(false);
    
    // Update localStorage with the selected configuration
    const keys = getStorageKeys(config.type);
    localStorage.setItem("llmType", config.type);
    if (config.type !== "gemini") {
      localStorage.setItem(keys.baseUrl, normalizedBaseUrl);
      localStorage.setItem("modelBaseUrl", normalizedBaseUrl);
    } else {
      localStorage.removeItem(keys.baseUrl);
      localStorage.setItem("modelBaseUrl", "");
    }
    localStorage.setItem(keys.model, config.model);
    localStorage.setItem("modelName", config.model);
    
    if (config.type !== "ollama" && config.apiKey) {
      if (keys.apiKey) {
        localStorage.setItem(keys.apiKey, config.apiKey);
      }
      localStorage.setItem("apiKey", config.apiKey);
    }
    
    if (config.type === "openai" && normalizedBaseUrl && config.apiKey) {
      handleGetModelList("openai", normalizedBaseUrl, config.apiKey);
    } else if (config.type === "gemini" && config.apiKey) {
      handleGetModelList("gemini", "", config.apiKey);
    }
  };

  /**
   * Generates a unique ID for new configurations
   * @returns {string} A unique identifier
   */
  const generateId = () => `api_${Date.now()}`;

  /**
   * Initiates the creation of a new configuration
   * Resets form fields and shows the new configuration form
   */
  const handleCreateConfig = () => {
    handleLlmTypeChange("openai");
    setModel("");
    setApiKey("");
    setNewConfigName(generateConfigName("openai", ""));
    setShowNewConfigForm(true);
    setActiveConfigId("");
  };
  
  /**
   * Cancels the creation of a new configuration
   * Restores the previous state if available
   */
  const handleCancelCreate = () => {
    setShowNewConfigForm(false);
    setNewConfigName("");
    if (configs.length > 0 && activeConfigId) {
      const selectedConfig = configs.find(c => c.id === activeConfigId);
      if (selectedConfig) {
        loadConfigToForm(selectedConfig);
      } else {
        setActiveConfigId(configs[0].id);
        loadConfigToForm(configs[0]);
      }
    } else if (configs.length > 0) {
      setActiveConfigId(configs[0].id);
      loadConfigToForm(configs[0]);
    }
  };

  /**
   * Saves the current configuration
   * Handles both new configurations and updates to existing ones
   * Persists changes to localStorage
   */
  // === 配置持久化：删除时不能被旧存储反向“复活”，因此直接用当前入参覆盖存储 === //
  const persistConfigs = (nextConfigs: APIConfig[]) => {
    const normalized = Array.isArray(nextConfigs) ? nextConfigs : [];
    setConfigs(normalized);
    localStorage.setItem("apiConfigs", JSON.stringify(normalized));
    return normalized;
  };

  /**
   * 内联更新模型并持久化，防止其它配置被覆盖
   */
  const handleInlineModelChange = (newModel: string) => {
    if (!activeConfigId) {
      setModel(newModel);
      return;
    }
    setModel(newModel);
    const workingConfigs = Array.isArray(configs) ? configs : [];
    const updatedConfigs = workingConfigs.map(config => {
      if (config.id === activeConfigId) {
        return { ...config, model: newModel };
      }
      return config;
    });
    persistConfigs(updatedConfigs);
    const keys = getStorageKeys(llmType);
    localStorage.setItem(keys.model, newModel);
    localStorage.setItem("modelName", newModel);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleSave = () => {
    const normalizedBaseUrl = llmType === "gemini" ? "" : baseUrl;

    if (showNewConfigForm) {
      const configName = newConfigName.trim() || generateConfigName(llmType, model);
      
      const newConfig: APIConfig = {
        id: generateId(),
        name: configName,
        type: llmType,
        baseUrl: normalizedBaseUrl,
        model,
        availableModels: llmType === "ollama" ? [] : availableModels,
        apiKey: llmType === "ollama" ? undefined : apiKey,
      };

      const currentConfigs = Array.isArray(configs) ? configs : [];
      const updatedConfigs = persistConfigs([...currentConfigs, newConfig]);
      setActiveConfigId(newConfig.id);
      setShowNewConfigForm(false);
      setNewConfigName("");

      localStorage.setItem("activeConfigId", newConfig.id);
      
      // Dispatch model change event for new config
      window.dispatchEvent(new CustomEvent("modelChanged", { 
        detail: { 
          configId: newConfig.id, 
          config: newConfig,
          modelName: newConfig.model,
          configName: newConfig.name,
        }, 
      }));
      
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
      
      return;
    } else {
      const safeConfigs = Array.isArray(configs) ? configs : readConfigsFromStorage();
      
      const updatedConfigs = safeConfigs.map(config => {
        if (config.id === activeConfigId) {
          return {
            ...config,
            type: llmType,
            baseUrl: normalizedBaseUrl,
            model,
            availableModels: llmType === "ollama" ? [] : availableModels,
            apiKey: llmType === "ollama" ? undefined : apiKey,
          };
        }
        return config;
      });

      const mergedConfigs = persistConfigs(updatedConfigs);
      
      // Dispatch model change event for updated config
      const updatedConfig = mergedConfigs.find(c => c.id === activeConfigId);
      if (updatedConfig) {
        window.dispatchEvent(new CustomEvent("modelChanged", { 
          detail: { 
            configId: activeConfigId, 
            config: updatedConfig,
            modelName: updatedConfig.model,
            configName: updatedConfig.name,
          }, 
        }));
      }
    }

    const keys = getStorageKeys(llmType);
    localStorage.setItem("llmType", llmType);
    if (llmType !== "gemini") {
      localStorage.setItem(keys.baseUrl, normalizedBaseUrl);
      localStorage.setItem("modelBaseUrl", normalizedBaseUrl);
    } else {
      localStorage.removeItem(keys.baseUrl);
      localStorage.setItem("modelBaseUrl", "");
    }
    localStorage.setItem(keys.model, model);
    if (llmType !== "ollama") {
      if (keys.apiKey) {
        localStorage.setItem(keys.apiKey, apiKey);
      }
      localStorage.setItem("apiKey", apiKey);
    }
    localStorage.setItem("modelName", model);

    if (!showNewConfigForm) {
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
      }, 2000);
    }
  };

  /**
   * Generates a unique name for a new configuration
   * @param {LLMType} type - The type of LLM provider
   * @param {string} model - The model name
   * @returns {string} A formatted configuration name
   */
  const generateConfigName = (type: LLMType, model: string): string => {
    const currentConfigs = Array.isArray(configs) ? configs : [];

    let modelName = model && model.trim() ? model : (type === "openai" ? "OpenAI" : type === "gemini" ? "Gemini" : "Ollama");
    
    if (modelName.length > 15) {
      modelName = modelName.substring(0, 15);
    }
    
    const sameModelConfigs = currentConfigs.filter(config => {
      if (config.model === model) return true;
      
      const namePattern = new RegExp(`【\\d+】${modelName}`);
      return namePattern.test(config.name);
    });
    
    if (sameModelConfigs.length === 0) {
      return `【1】${modelName}`;
    }
    
    let maxNumber = 0;
    sameModelConfigs.forEach(config => {
      const match = config.name.match(/【(\d+)】/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    return `【${maxNumber + 1}】${modelName}`;
  };

  /**
   * Deletes a configuration
   * @param {string} id - The ID of the configuration to delete
   */
  const handleDeleteConfig = (id: string) => {
    const workingConfigs = mergeConfigsWithStorage(Array.isArray(configs) ? configs : []);
    const updatedConfigs = workingConfigs.filter(config => config.id !== id);
    persistConfigs(updatedConfigs);

    if (id === activeConfigId) {
      if (updatedConfigs.length > 0) {
        setActiveConfigId(updatedConfigs[0].id);
        loadConfigToForm(updatedConfigs[0]);
      } else {
        setActiveConfigId("");
        setLlmType("openai");
        setBaseUrl("");
        setModel("");
        setApiKey("");
        setAvailableModels([]);
        setModelListEmpty(false);
      }
    }

    if (id === activeConfigId) {
      localStorage.setItem("activeConfigId", updatedConfigs.length > 0 ? updatedConfigs[0].id : "");
    }
  };

  /**
   * Switches to a different configuration
   * @param {string} id - The ID of the configuration to switch to
   */
  const handleSwitchConfig = (id: string) => {
    if (id === activeConfigId) return;
    
    setActiveConfigId(id);
    const selectedConfig = configs.find(config => config.id === id);
    if (selectedConfig) {
      loadConfigToForm(selectedConfig);
      localStorage.setItem("activeConfigId", id);
      setShowNewConfigForm(false);
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(new CustomEvent("modelChanged", { 
        detail: { 
          configId: id, 
          config: selectedConfig,
          modelName: selectedConfig.model,
          configName: selectedConfig.name,
        }, 
      }));
    } else {
      console.error("ModelSidebar: Config not found for id", id);
    }
  };

  /**
   * Fetches the list of available models from the OpenAI API
   * @param {string} baseUrl - The base URL for the API
   * @param {string} apiKey - The API key for authentication
   */
  const handleGetModelList = async (type: LLMType, targetBaseUrl: string, targetApiKey: string) => {
    if (type === "ollama") return;

    setGetModelListError(false);
    setGetModelListSuccess(false);
    setModelListEmpty(false);

    if (type === "openai" && (!targetBaseUrl || !targetApiKey)) {
      setAvailableModels([]);
      setGetModelListError(true);
      setModelListEmpty(true);
      setTimeout(() => setGetModelListError(false), 2000);
      return;
    }

    if (type === "gemini" && !targetApiKey) {
      setAvailableModels([]);
      setGetModelListError(true);
      setModelListEmpty(true);
      setTimeout(() => setGetModelListError(false), 2000);
      return;
    }
    
    try {
      let modelList: string[] = [];

      if (type === "openai") {
        const response = await fetch(`${targetBaseUrl}/models`, {
          headers: {
            "Authorization": `Bearer ${targetApiKey}`,
          },
        });
        const data = await response.json();
        modelList = data.data?.map((item: any) => item.id) || [];
      } else if (type === "gemini") {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${targetApiKey}`);
        const data = await response.json();
        modelList = Array.isArray(data.models)
          ? data.models
            .map((item: any) => {
              if (item?.name) {
                return item.name.replace(/^models\//, "");
              }
              return "";
            })
            .filter(Boolean)
          : [];
      }
  
      setAvailableModels(modelList);
      setModelListEmpty(modelList.length === 0);
  
      setGetModelListSuccess(true);
      setTimeout(() => setGetModelListSuccess(false), 2000);
    } catch (error) {
      setAvailableModels([]);
      setGetModelListError(true);
      setModelListEmpty(true);
      setTimeout(() => setGetModelListError(false), 2000);
    }
  };

  /**
   * Initiates the editing of a configuration name
   * @param {APIConfig} config - The configuration being edited
   * @param {React.MouseEvent} e - The mouse event
   */
  const handleStartEditName = (config: APIConfig, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingConfigId(config.id);
    setEditingName(config.name);
  };

  /**
   * Saves the edited configuration name
   */
  const handleSaveName = () => {
    if (!editingName.trim()) return;

    const workingConfigs = mergeConfigsWithStorage(Array.isArray(configs) ? configs : []);
    const updatedConfigs = workingConfigs.map(config => {
      if (config.id === editingConfigId) {
        return { ...config, name: editingName.trim() };
      }
      return config;
    });

    persistConfigs(updatedConfigs);
    setEditingConfigId("");
  };

  /**
   * Handles keyboard events during name editing
   * @param {React.KeyboardEvent} e - The keyboard event
   */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSaveName();
    } else if (e.key === "Escape") {
      setEditingConfigId("");
    }
  };

  /**
   * Tests the current model configuration using LangChain
   * Sends a test request to verify the configuration works
   * Uses a minimal test prompt to check model connectivity and response
   * Includes Windows-specific fixes for Ollama connectivity
   */
  const handleTestModel = async () => {
    if (!model) return;
    
    setIsTesting(true);
    setTestModelSuccess(false);
    setTestModelError(false);
    
    try {
      if (llmType === "gemini") {
        if (!apiKey) {
          throw new Error("Gemini 需要有效的 API Key");
        }
        const reply = await callGeminiOnce({
          system: "You are a helpful AI assistant.",
          user: "Ping",
          config: {
            apiKey,
            model,
            temperature: 0.1,
          },
        });

        if (reply.trim().length === 0) {
          throw new Error("Empty or invalid response from Gemini");
        }
        setTestModelSuccess(true);
        setTimeout(() => setTestModelSuccess(false), 2000);
        return;
      }

      // For Ollama on Windows, ensure proper URL formatting
      let finalBaseUrl = baseUrl || getBaseUrlPlaceholder(llmType);
      if (llmType === "ollama") {
        if (finalBaseUrl === "localhost:11434" || finalBaseUrl === "11434") {
          finalBaseUrl = "http://localhost:11434";
        } else if (finalBaseUrl.startsWith("localhost:") && !finalBaseUrl.startsWith("http://")) {
          finalBaseUrl = "http://" + finalBaseUrl;
        } else if (!finalBaseUrl.startsWith("http://") && !finalBaseUrl.startsWith("https://")) {
          finalBaseUrl = "http://" + finalBaseUrl;
        }
        
        if (finalBaseUrl.endsWith("/")) {
          finalBaseUrl = finalBaseUrl.slice(0, -1);
        }

        console.log(`Testing Ollama connection to: ${finalBaseUrl}`);
      }

      // Initialize the appropriate LangChain client based on LLM type
      const chatModel = llmType === "openai" 
        ? new ChatOpenAI({
          modelName: model,
          openAIApiKey: apiKey,
          configuration: {
            baseURL: finalBaseUrl,
          },
          timeout: 30000,
        })
        : new ChatOllama({
          baseUrl: finalBaseUrl,
          model: model,
          temperature: 0.1,
        });

      const testMessage = llmType === "ollama" 
        ? "Hi"
        : "Hello, this is a test message. Please respond with 'Test successful' if you can read this.";

      const messages = llmType === "ollama"
        ? [{ role: "user", content: testMessage }]
        : [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: testMessage },
        ];

      console.log(`Sending test message to ${llmType}:`, testMessage);
      
      const response = await chatModel.invoke(messages);
      const responseContent = response.content.toString().trim();

      console.log(`Received response from ${llmType}:`, responseContent);

      if (responseContent && responseContent.length > 0) {
        console.log("Model test successful. Response:", responseContent);
        setTestModelSuccess(true);
        setTimeout(() => setTestModelSuccess(false), 2000);
      } else {
        throw new Error("Empty or invalid response from model");
      }
    } catch (error) {
      console.error("Model test failed:", error);
      
      if (llmType === "ollama") {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        if (errorMessage.includes("ECONNREFUSED") || errorMessage.includes("fetch failed")) {
          console.error("Ollama connection failed. Please ensure:");
          console.error("1. Ollama is running on Windows");
          console.error("2. The model is downloaded: ollama pull " + model);
          console.error("3. Try: ollama serve");
          console.error("4. Check if Windows Firewall is blocking the connection");
        } else if (errorMessage.includes("model") && errorMessage.includes("not found")) {
          console.error(`Model '${model}' not found. Please run: ollama pull ${model}`);
        } else if (errorMessage.includes("timeout")) {
          console.error("Request timeout. The model might be loading or the server is slow.");
        }
      }
      
      setTestModelError(true);
      setTimeout(() => setTestModelError(false), 2000);
    } finally {
      setIsTesting(false);
    }
  };

  const sidebarState: SidebarState = {
    configs,
    activeConfigId,
    showNewConfigForm,
    showEditHint,
    isConfigHovered,
    editingConfigId,
    editingName,
    newConfigName,
    llmType,
    baseUrl,
    model,
    apiKey,
    availableModels,
    modelListEmpty,
    saveSuccess,
    getModelListSuccess,
    getModelListError,
    isTesting,
    testModelSuccess,
    testModelError,
  };

  const sidebarActions: SidebarActions = {
    toggleSidebar,
    handleCreateConfig,
    handleSwitchConfig,
    handleStartEditName,
    setEditingName,
    handleSaveName,
    handleKeyDown,
    handleDeleteConfig,
    setIsConfigHovered,
    handleGetModelList,
    handleSave,
    handleCancelCreate,
    setLlmType: handleLlmTypeChange,
    setBaseUrl,
    setApiKey,
    setNewConfigName,
    setModel,
    handleInlineModelChange,
    handleTestModel,
  };

  const sidebarHelpers: SidebarHelpers = {
    describeLlmType,
    getBaseUrlPlaceholder,
    getModelPlaceholder,
  };

  const viewProps = {
    isOpen,
    fontClass,
    serifFontClass,
    t,
    trackButtonClick,
    state: sidebarState,
    actions: sidebarActions,
    helpers: sidebarHelpers,
  };

  if (isMobile && isOpen) {
    return <MobileSidebarView {...viewProps} />;
  }

  return <DesktopSidebarView {...viewProps} />;
}
