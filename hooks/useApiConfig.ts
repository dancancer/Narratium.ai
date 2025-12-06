/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         useApiConfig Hook                                  ║
 * ║                                                                            ║
 * ║  管理 API 配置状态：加载、切换、模型获取                                    ║
 * ║  单一职责：只处理 API 配置相关的状态和逻辑                                   ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { trackButtonClick } from "@/utils/google-analytics";
import { getJSON, setJSON, getString, setString } from "@/lib/storage/client-storage";

// ============================================================================
//                              类型定义
// ============================================================================

export type LLMType = "openai" | "ollama" | "gemini";

export interface APIConfig {
  id: string;
  name: string;
  type: LLMType;
  baseUrl: string;
  model: string;
  apiKey?: string;
  availableModels?: string[];
}

interface UseApiConfigReturn {
  configs: APIConfig[];
  activeConfigId: string;
  currentModel: string;
  getCurrentConfig: () => APIConfig | undefined;
  handleConfigSelect: (configId: string) => Promise<void>;
  handleModelSwitch: (configId: string, modelName?: string) => void;
  showApiDropdown: boolean;
  setShowApiDropdown: (show: boolean) => void;
  showModelDropdown: boolean;
  setShowModelDropdown: (show: boolean) => void;
  selectedConfigId: string;
  setSelectedConfigId: (id: string) => void;
}

// ============================================================================
//                              存储操作
// ============================================================================

function readConfigsFromStorage(): APIConfig[] {
  return getJSON<APIConfig[]>("apiConfigs", []);
}

function mergeConfigsWithStorage(incoming: APIConfig[]): APIConfig[] {
  const latest = readConfigsFromStorage();
  const merged = new Map<string, APIConfig>();
  latest.forEach((config) => merged.set(config.id, config));
  incoming.forEach((config) => merged.set(config.id, config));
  return Array.from(merged.values());
}

async function fetchAvailableModels(config: APIConfig): Promise<string[]> {
  // Ollama 直接返回配置的模型
  if (config.type === "ollama") {
    return [config.model || "default"];
  }

  if (!config.baseUrl || !config.apiKey) {
    return ["default"];
  }

  try {
    const response = await fetch(`${config.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${config.apiKey}` },
    });
    const data = await response.json();
    const modelList = data.data?.map((item: { id: string }) => item.id) || [];
    return modelList.length > 0 ? modelList : ["default"];
  } catch {
    return ["default"];
  }
}

// ============================================================================
//                              主 Hook
// ============================================================================

export function useApiConfig(): UseApiConfigReturn {
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [activeConfigId, setActiveConfigId] = useState("");
  const [currentModel, setCurrentModel] = useState("");
  const [showApiDropdown, setShowApiDropdown] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [selectedConfigId, setSelectedConfigId] = useState("");

  // 获取最新配置（合并内存与 localStorage）
  const getWorkingConfigs = useCallback(
    () => mergeConfigsWithStorage(configs),
    [configs]
  );

  const getCurrentConfig = useCallback(
    () => configs.find((c) => c.id === activeConfigId),
    [configs, activeConfigId]
  );

  // 选择配置（第一层下拉）
  const handleConfigSelect = useCallback(async (configId: string) => {
    const mergedConfigs = getWorkingConfigs();
    setConfigs(mergedConfigs);

    const selectedConfig = mergedConfigs.find((c) => c.id === configId);
    if (!selectedConfig) return;

    // 懒加载可用模型
    let configsWithModels = mergedConfigs;
    if (!selectedConfig.availableModels) {
      const models = await fetchAvailableModels(selectedConfig);
      configsWithModels = mergedConfigs.map((c) =>
        c.id === configId ? { ...c, availableModels: models } : c
      );
      setConfigs(configsWithModels);
    }

    const configForUse = configsWithModels.find((c) => c.id === configId) || selectedConfig;

    // 单模型直接切换，多模型显示第二层下拉
    if (configForUse.availableModels?.length === 1) {
      handleModelSwitch(configId, configForUse.availableModels[0]);
      setShowApiDropdown(false);
      setShowModelDropdown(false);
    } else {
      setSelectedConfigId(configId);
      setShowModelDropdown(true);
      setShowApiDropdown(false);
    }
  }, [getWorkingConfigs]);

  // 切换模型
  const handleModelSwitch = useCallback((configId: string, modelName?: string) => {
    const mergedConfigs = getWorkingConfigs();
    const selectedConfig = mergedConfigs.find((c) => c.id === configId);
    if (!selectedConfig) return;

    // 更新模型配置
    let updatedConfigs = mergedConfigs;
    if (modelName && modelName !== selectedConfig.model) {
      const actualModelName = modelName === "default" ? (selectedConfig.model || "default") : modelName;
      updatedConfigs = mergedConfigs.map((c) =>
        c.id === configId ? { ...c, model: actualModelName } : c
      );
      setConfigs(updatedConfigs);
      setJSON("apiConfigs", updatedConfigs);
    } else {
      setConfigs(updatedConfigs);
    }

    setActiveConfigId(configId);
    const configAfterUpdate = updatedConfigs.find((c) => c.id === configId) || selectedConfig;
    setCurrentModel(configAfterUpdate.model);
    setString("activeConfigId", configId);

    // 同步到各存储键
    syncConfigToStorage(configAfterUpdate);

    // 广播变更事件
    window.dispatchEvent(
      new CustomEvent("modelChanged", {
        detail: {
          configId,
          config: configAfterUpdate,
          modelName: configAfterUpdate.model,
          configName: configAfterUpdate.name,
        },
      })
    );

    setShowApiDropdown(false);
    setShowModelDropdown(false);
    trackButtonClick("CharacterChat", "切换模型");
  }, [getWorkingConfigs]);

  // 初始化加载配置
  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadConfigs = () => {
      const loadedConfigs = readConfigsFromStorage();
      const storedActiveId = getString("activeConfigId");
      const activeIdCandidate = storedActiveId && loadedConfigs.some((c) => c.id === storedActiveId)
        ? storedActiveId
        : loadedConfigs[0]?.id || "";

      setConfigs(loadedConfigs);
      setActiveConfigId(activeIdCandidate);

      const activeConfig = loadedConfigs.find((c) => c.id === activeIdCandidate);
      if (activeConfig) {
        setCurrentModel(activeConfig.model);
      }
    };

    loadConfigs();

    // 监听外部变更
    const handleModelChanged = () => loadConfigs();
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === "apiConfigs" || event.key === "activeConfigId") {
        loadConfigs();
      }
    };

    window.addEventListener("modelChanged", handleModelChanged);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("modelChanged", handleModelChanged);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  // 点击外部关闭下拉
  useEffect(() => {
    if (!showApiDropdown && !showModelDropdown) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".api-dropdown-container")) {
        setShowApiDropdown(false);
        setShowModelDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showApiDropdown, showModelDropdown]);

  return {
    configs,
    activeConfigId,
    currentModel,
    getCurrentConfig,
    handleConfigSelect,
    handleModelSwitch,
    showApiDropdown,
    setShowApiDropdown,
    showModelDropdown,
    setShowModelDropdown,
    selectedConfigId,
    setSelectedConfigId,
  };
}

// ============================================================================
//                              辅助函数
// ============================================================================

function syncConfigToStorage(config: APIConfig): void {
  setString("llmType", config.type);
  setString(config.type === "openai" ? "openaiBaseUrl" : "ollamaBaseUrl", config.baseUrl);
  setString(config.type === "openai" ? "openaiModel" : "ollamaModel", config.model);
  setString("modelName", config.model);
  setString("modelBaseUrl", config.baseUrl);

  if (config.type === "openai" && config.apiKey) {
    setString("openaiApiKey", config.apiKey);
    setString("apiKey", config.apiKey);
  }
}
