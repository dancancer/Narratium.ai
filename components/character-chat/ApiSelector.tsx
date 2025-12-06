/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         API Selector Component                             ║
 * ║                                                                            ║
 * ║  两级下拉选择器：API 配置 → 可用模型                                        ║
 * ║  职责单一：只负责 API/模型的可视化选择                                       ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import Image from "next/image";
import { resolveApiIcon } from "@/lib/utils/api-icon-resolver";
import type { APIConfig } from "@/hooks/useApiConfig";

// ============================================================================
//                              类型定义
// ============================================================================

interface ApiSelectorProps {
  configs: APIConfig[];
  activeConfigId: string;
  showApiDropdown: boolean;
  showModelDropdown: boolean;
  selectedConfigId: string;
  onToggleDropdown: () => void;
  onConfigSelect: (configId: string) => void;
  onModelSelect: (configId: string, modelName: string) => void;
  onBackToConfigs: () => void;
  t: (key: string) => string;
}

// ============================================================================
//                              图标渲染
// ============================================================================

function ApiIcon({ name }: { name: string }) {
  const { src, alt } = resolveApiIcon(name);
  return (
    <div className="w-5 h-5 rounded-full overflow-hidden bg-transparent flex items-center justify-center">
      <Image src={src} alt={alt} width={20} height={20} className="object-cover w-full h-full" />
    </div>
  );
}

// ============================================================================
//                              主组件
// ============================================================================

export default function ApiSelector({
  configs,
  activeConfigId,
  showApiDropdown,
  showModelDropdown,
  selectedConfigId,
  onToggleDropdown,
  onConfigSelect,
  onModelSelect,
  onBackToConfigs,
  t,
}: ApiSelectorProps) {
  const currentConfig = configs.find((c) => c.id === activeConfigId);
  const selectedConfig = configs.find((c) => c.id === selectedConfigId);

  return (
    <div className="relative mx-2 api-dropdown-container">
      {/* 主按钮 */}
      <button
        onClick={onToggleDropdown}
        className="p-1 rounded-md transition-all duration-300 group relative text-text-muted hover:text-amber flex items-center"
      >
        <div className="flex items-center">
          <ApiIcon name={currentConfig?.name || "openai"} />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-2 w-2 ml-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-overlay text-cream text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap border border-ink z-50">
          {currentConfig?.name || t("modelSettings.noConfigs")}
        </div>
      </button>

      {/* 第一层：API 配置列表 */}
      {showApiDropdown && !showModelDropdown && (
        <ConfigDropdown
          configs={configs}
          activeConfigId={activeConfigId}
          onSelect={onConfigSelect}
          emptyText={t("common.noApisConfigured")}
        />
      )}

      {/* 第二层：模型列表 */}
      {showModelDropdown && selectedConfig && (
        <ModelDropdown
          config={selectedConfig}
          onBack={onBackToConfigs}
          onSelect={(modelName) => onModelSelect(selectedConfigId, modelName)}
          t={t}
        />
      )}
    </div>
  );
}

// ============================================================================
//                              子组件
// ============================================================================

interface ConfigDropdownProps {
  configs: APIConfig[];
  activeConfigId: string;
  onSelect: (configId: string) => void;
  emptyText: string;
}

function ConfigDropdown({ configs, activeConfigId, onSelect, emptyText }: ConfigDropdownProps) {
  if (configs.length === 0) {
    return (
      <div className="absolute top-full left-0 mt-1 bg-overlay border border-ink rounded-md shadow-lg z-50 min-w-[160px]">
        <div className="px-2 py-1.5 text-xs text-text-muted">{emptyText}</div>
      </div>
    );
  }

  return (
    <div className="absolute top-full left-0 mt-1 bg-overlay border border-ink rounded-md shadow-lg z-50 min-w-[160px]">
      {configs.map((config) => (
        <button
          key={config.id}
          onClick={() => onSelect(config.id)}
          className={`w-full text-left px-2 py-1.5 text-xs hover:bg-muted-surface transition-colors flex items-center justify-between ${
            activeConfigId === config.id ? "bg-muted-surface text-amber" : "text-cream"
          }`}
        >
          <div className="flex items-center">
            <span className="mr-2.5"><ApiIcon name={config.name} /></span>
            <span className="truncate" title={config.name}>
              {config.name.length > 20 ? `${config.name.substring(0, 20)}...` : config.name}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ))}
    </div>
  );
}

interface ModelDropdownProps {
  config: APIConfig;
  onBack: () => void;
  onSelect: (modelName: string) => void;
  t: (key: string) => string;
}

function ModelDropdown({ config, onBack, onSelect, t }: ModelDropdownProps) {
  const models = config.availableModels;

  return (
    <div className="absolute top-full left-0 mt-1 bg-overlay border border-ink rounded-md shadow-lg z-50 min-w-[180px]">
      {/* 头部：返回按钮 */}
      <div className="px-2 py-1.5 text-xs text-text-muted border-b border-ink flex items-center justify-between">
        <button
          onClick={onBack}
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
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {t("characterChat.back")}
        </button>
        <span>{t("characterChat.selectModel")}</span>
      </div>

      {/* 模型列表或加载状态 */}
      {!models ? (
        <LoadingIndicator />
      ) : (
        models.map((modelName) => (
          <ModelItem
            key={modelName}
            modelName={modelName}
            configName={config.name}
            isActive={config.model === modelName}
            onSelect={() => onSelect(modelName)}
            defaultLabel={t("characterChat.defaultModel")}
          />
        ))
      )}
    </div>
  );
}

function LoadingIndicator() {
  return (
    <div className="px-2 py-1.5 text-xs text-text-muted flex items-center">
      <svg
        className="animate-spin h-3 w-3 mr-2"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
      Loading models...
    </div>
  );
}

interface ModelItemProps {
  modelName: string;
  configName: string;
  isActive: boolean;
  onSelect: () => void;
  defaultLabel: string;
}

function ModelItem({ modelName, configName, isActive, onSelect, defaultLabel }: ModelItemProps) {
  const isDefault = modelName === "default";
  const displayName = isDefault ? defaultLabel : modelName;
  const truncatedName = displayName.length > 25 ? `${displayName.substring(0, 25)}...` : displayName;

  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-2 py-1.5 text-xs hover:bg-muted-surface transition-colors flex items-center ${
        isActive ? "bg-muted-surface text-amber" : "text-cream"
      }`}
    >
      <span className="mr-2.5">
        <ApiIcon name={isDefault ? configName : modelName} />
      </span>
      <span className="truncate" title={displayName}>{truncatedName}</span>
    </button>
  );
}
