"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Settings, 
  Power, 
  PowerOff, 
  Info, 
  CheckCircle, 
  AlertCircle,
  Package,
  ExternalLink,
  User,
  RefreshCw,
  Wrench,
  AlertTriangle,
  Clock,
  ChevronDown,
  Filter,
  BarChart3,
} from "lucide-react";
import { useLanguage } from "@/app/i18n";

interface PluginEntry {
  plugin: any;
  manifest: any;
  enabled: boolean;
  initialized: boolean;
  loaded: boolean;
  error?: string;
  loadTime?: Date;
}

interface PluginManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PluginManagerModal({ isOpen, onClose }: PluginManagerModalProps) {
  const { t, fontClass } = useLanguage();
  const [plugins, setPlugins] = useState<PluginEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "enabled" | "disabled">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadPlugins();
    }
  }, [isOpen]);

  const loadPlugins = async () => {
    setIsLoading(true);
    try {
      // 确保插件系统已初始化
      if (typeof window !== "undefined" && (window as any).pluginRegistry) {
        await (window as any).pluginRegistry.initialize();
        const allPlugins = (window as any).pluginRegistry.getPlugins();
        setPlugins(allPlugins);
      }
    } catch (error) {
      console.error("Failed to load plugins:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshPlugins = async () => {
    setIsRefreshing(true);
    try {
      // 重新发现插件
      if (typeof window !== "undefined" && (window as any).pluginDiscovery) {
        await (window as any).pluginDiscovery.discoverPlugins();
      }
      await loadPlugins();
    } catch (error) {
      console.error("Failed to refresh plugins:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleTogglePlugin = async (pluginId: string, enabled: boolean) => {
    try {
      if (typeof window !== "undefined" && (window as any).pluginRegistry) {
        if (enabled) {
          await (window as any).pluginRegistry.enablePlugin(pluginId);
        } else {
          await (window as any).pluginRegistry.disablePlugin(pluginId);
        }
        // 刷新插件列表
        await loadPlugins();
      }
    } catch (error) {
      console.error(`Failed to ${enabled ? "enable" : "disable"} plugin:`, error);
    }
  };

  const getFilteredPlugins = () => {
    switch (filter) {
    case "enabled":
      return plugins.filter(plugin => plugin.enabled);
    case "disabled":
      return plugins.filter(plugin => !plugin.enabled);
    default:
      return plugins;
    }
  };

  const getPluginStatusIcon = (plugin: PluginEntry) => {
    if (plugin.error) {
      return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
    if (plugin.enabled) {
      return <CheckCircle className="w-4 h-4 text-green-400" />;
    }
    return <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  const getPluginStatusText = (plugin: PluginEntry) => {
    if (plugin.error) {
      return { text: "错误", color: "text-red-400" };
    }
    if (plugin.enabled) {
      return { text: "已启用", color: "text-green-400" };
    }
    return { text: "已禁用", color: "text-gray-400" };
  };

  const filteredPlugins = getFilteredPlugins();

  // Filter options with icons and counts
  const filterOptions = [
    {
      value: "all",
      label: t("plugins.allPlugins"),
      icon: Package,
      count: plugins.length,
      color: "text-cream",
    },
    {
      value: "enabled",
      label: t("plugins.enabled"),
      icon: CheckCircle,
      count: plugins.filter(p => p.enabled).length,
      color: "text-green-400",
    },
    {
      value: "disabled", 
      label: t("plugins.disabled"),
      icon: AlertCircle,
      count: plugins.filter(p => !p.enabled).length,
      color: "text-gray-400",
    },
  ];

  const currentFilter = filterOptions.find(option => option.value === filter);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 backdrop-blur-sm"
              onClick={onClose}
            />
            {/* 模态框 */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-deep bg-opacity-90 border border-ink/40 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[85vh] overflow-hidden relative z-10 backdrop-filter backdrop-blur-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-br from-cream/20 to-amber/20 rounded-xl">
                    <Package className="w-5 h-5 text-cream" />
                  </div>
                  <div>
                    <h2 className={`text-lg font-semibold text-cream ${fontClass}`}>
                      {t("plugins.title")}
                    </h2>
                    <p className="text-xs text-amber-soft opacity-80">
                      {t("plugins.enhancedSystem")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefreshPlugins}
                    disabled={isRefreshing}
                    className="p-2 bg-ink/30 hover:bg-ink-soft/40 text-cream rounded-lg transition-all duration-200 disabled:opacity-50 group"
                    title={t("plugins.refresh")}
                  >
                    <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : "group-hover:rotate-180"} transition-transform duration-300`} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 text-amber-soft hover:text-cream hover:bg-ink/30 rounded-lg transition-all duration-200"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>

              {/* 工具栏 */}
              <div className="px-6 py-3 border-b border-ink/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* 优化的下拉框 */}
                    <div className="relative" ref={dropdownRef}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="flex items-center space-x-2 bg-gradient-to-r from-ink/25 to-ink/15 hover:from-ink/35 hover:to-ink/25 text-cream px-4 py-2.5 rounded-xl border border-ink/40 hover:border-cream/30 transition-all duration-200 group min-w-[140px]"
                      >
                        <Filter className="w-4 h-4 text-amber-soft group-hover:text-cream transition-colors" />
                        <div className="flex items-center space-x-2 flex-1">
                          {currentFilter && (
                            <>
                              <currentFilter.icon className={`w-4 h-4 ${currentFilter.color}`} />
                              <span className="text-sm font-medium">{currentFilter.label}</span>
                              <span className="text-xs bg-ink/40 px-2 py-0.5 rounded-full text-amber-soft">
                                {currentFilter.count}
                              </span>
                            </>
                          )}
                        </div>
                        <ChevronDown className={`w-4 h-4 text-amber-soft transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                      </motion.button>

                      {/* 下拉菜单 */}
                      <AnimatePresence>
                        {isDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-full left-0 mt-2 w-full bg-deep border border-ink/40 rounded-xl shadow-2xl overflow-hidden z-20 backdrop-blur-md"
                          >
                            {filterOptions.map((option) => (
                              <motion.button
                                key={option.value}
                                whileHover={{ backgroundColor: "rgba(83, 71, 65, 0.2)" }}
                                onClick={() => {
                                  setFilter(option.value as "all" | "enabled" | "disabled");
                                  setIsDropdownOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-all duration-150 ${
                                  filter === option.value 
                                    ? "bg-ink/30 border-r-2 border-cream" 
                                    : "hover:bg-ink/20"
                                }`}
                              >
                                <option.icon className={`w-4 h-4 ${option.color}`} />
                                <span className={`text-sm flex-1 ${
                                  filter === option.value ? "text-cream font-medium" : "text-amber-soft"
                                }`}>
                                  {option.label}
                                </span>
                                <span className={`text-xs px-2 py-1 rounded-full ${
                                  filter === option.value 
                                    ? "bg-cream/20 text-cream" 
                                    : "bg-ink/30 text-amber-soft"
                                }`}>
                                  {option.count}
                                </span>
                              </motion.button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="px-3 py-1.5 bg-gradient-to-r from-ink/20 to-ink/10 rounded-lg text-amber-soft border border-ink/20">
                        <span className="font-medium text-cream">{filteredPlugins.length}</span>
                        <span className="mx-1 text-amber-soft/60">/</span>
                        <span>{plugins.length}</span>
                        <span className="ml-1 text-amber-soft/80">{t("plugins.items")}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-amber-soft opacity-70">
                    <span>{t("plugins.version")}</span>
                  </div>
                </div>
              </div>

              {/* 内容区域 */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cream"></div>
                    <span className="ml-3 text-cream">{t("plugins.loading")}</span>
                  </div>
                ) : filteredPlugins.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400 text-lg">
                      {filter === "all" ? t("plugins.noPluginsFound") : filter === "enabled" ? t("plugins.noEnabledPlugins") : t("plugins.noDisabledPlugins")}
                    </p>
                    <p className="text-gray-500 text-sm mt-2">
                      {t("plugins.pluginDirectory")}
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {filteredPlugins.map((plugin) => (
                      <motion.div
                        key={plugin.manifest.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        whileHover={{ y: -2, transition: { duration: 0.2 } }}
                        className="group bg-gradient-to-br from-overlay/30 to-deep/50 rounded-xl p-5 border border-ink/30 hover:border-cream/40 transition-all duration-300 backdrop-blur-sm hover:shadow-lg hover:shadow-cream/10"
                      >
                        <div className="flex items-start justify-between">
                          {/* 插件信息 */}
                          <div className="flex items-start space-x-4 flex-1">
                            {/* 插件图标 */}
                            <div className="w-12 h-12 bg-gradient-to-br from-ink/40 to-overlay/60 rounded-xl flex items-center justify-center overflow-hidden relative group-hover:from-cream/20 group-hover:to-amber/20 transition-all duration-300">
                              {plugin.manifest.icon ? (
                                // Check if icon is a URL or emoji/text
                                plugin.manifest.icon.startsWith("http") || plugin.manifest.icon.startsWith("/") ? (
                                  // Special handling for dialogue-stats plugin
                                  plugin.manifest.id === "dialogue-stats" ? (
                                    // Inline SVG for dialogue-stats
                                    <BarChart3 className="h-6 w-6 text-cream" />
                                  ) : (
                                    // Regular image files
                                    <Image
                                      src={plugin.manifest.icon}
                                      alt={plugin.manifest.name}
                                      fill
                                      sizes="48px"
                                      className="rounded object-cover"
                                      onError={() => {
                                        console.log("Icon failed to load:", plugin.manifest.icon);
                                      }}
                                    />
                                  )
                                ) : (
                                  // Emoji or text icon
                                  <span className="text-2xl select-none">{plugin.manifest.icon}</span>
                                )
                              ) : (
                                <Package className="w-6 h-6 text-cream" />
                              )}
                            </div>

                            {/* 插件详情 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center space-x-2 mb-2">
                                <h3 className="font-medium text-cream truncate">
                                  {plugin.manifest.name}
                                </h3>
                                <span className="text-xs bg-ink/30 px-2 py-1 rounded-md text-amber-soft flex-shrink-0">
                                  v{plugin.manifest.version}
                                </span>
                                <div className="flex items-center space-x-1 flex-shrink-0">
                                  {getPluginStatusIcon(plugin)}
                                  <span className={`text-xs font-medium ${getPluginStatusText(plugin).color}`}>
                                    {getPluginStatusText(plugin).text}
                                  </span>
                                </div>
                              </div>

                              <p className="text-sm text-amber-soft mb-3 leading-relaxed line-clamp-2 overflow-hidden">
                                {plugin.manifest.description}
                              </p>

                              <div className="flex items-center space-x-3 text-xs text-amber-soft/70">
                                <div className="flex items-center space-x-1">
                                  <User className="w-3 h-3" />
                                  <span>{plugin.manifest.author}</span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Wrench className="w-3 h-3" />
                                  <span className="capitalize">{plugin.manifest.category}</span>
                                </div>
                              </div>

                              {plugin.error && (
                                <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-xs">
                                  <strong>{t("plugins.error")}</strong> {plugin.error}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* 操作按钮 */}
                          <div className="flex items-center space-x-2 flex-shrink-0">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleTogglePlugin(plugin.manifest.id, !plugin.enabled)}
                              className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                plugin.enabled
                                  ? "bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                                  : "bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30"
                              }`}
                            >
                              {plugin.enabled ? (
                                <PowerOff className="w-4 h-4" />
                              ) : (
                                <Power className="w-4 h-4" />
                              )}
                              <span className="hidden sm:inline">{plugin.enabled ? t("plugins.disable") : t("plugins.enable")}</span>
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                if (plugin.manifest.homepage) {
                                  window.open(plugin.manifest.homepage, "_blank");
                                }
                              }}
                              disabled={!plugin.manifest.homepage}
                              className="p-2 bg-ink/20 hover:bg-ink/40 text-amber-soft rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed"
                              title={t("plugins.homepage")}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              className="p-2 bg-ink/20 hover:bg-ink/40 text-amber-soft rounded-lg transition-all duration-200"
                              onClick={() => {
                                console.log("Plugin details:", plugin);
                              }}
                              title={t("plugins.details")}
                            >
                              <Info className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* 底部状态栏 */}
              <div className="px-6 py-4 border-t border-ink/30 bg-gradient-to-r from-overlay/20 to-deep/40">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3 text-amber-soft">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span>{t("plugins.systemStatus")}</span>
                    </div>
                    <span className="text-ink">•</span>
                    <span>
                      {t("plugins.pluginStats").replace("{enabled}", plugins.filter(p => p.enabled).length.toString()).replace("{total}", plugins.length.toString())}
                    </span>
                  </div>
                  <div className="text-amber-soft/70">
                    <span>v1.0.0</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
} 
