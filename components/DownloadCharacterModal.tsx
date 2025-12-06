/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     DownloadCharacterModal                               ║
 * ║                                                                          ║
 * ║  角色下载弹窗 - GitHub 角色库浏览、筛选与导入                               ║
 * ║                                                                          ║
 * ║  重构后的简洁版本：                                                        ║
 * ║  - 核心逻辑提取到 useCharacterDownload hook                               ║
 * ║  - UI 组件拆分到 download-modal/ 目录                                     ║
 * ║  - 主文件只负责布局编排                                                    ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/app/i18n";
import { Toast } from "@/components/Toast";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { useCharacterDownload, TAGS, TagType } from "@/hooks/useCharacterDownload";
import { CharacterCard, RegulatoryWarningModal, WARNING_STORAGE_KEY } from "@/components/download-modal";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";

/* ═══════════════════════════════════════════════════════════════════════════
   类型定义
   ═══════════════════════════════════════════════════════════════════════════ */

interface DownloadCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════════════════════════ */

export default function DownloadCharacterModal({
  isOpen,
  onClose,
  onImport,
}: DownloadCharacterModalProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const { isMobile } = useMobileDetection();

  // 错误提示状态
  const [errorToast, setErrorToast] = useState({ isVisible: false, message: "" });
  const showError = useCallback((message: string) => {
    setErrorToast({ isVisible: true, message });
  }, []);
  const hideError = useCallback(() => {
    setErrorToast({ isVisible: false, message: "" });
  }, []);

  // 合规警告状态
  const [showWarning, setShowWarning] = useState(false);
  const { value: warningShown } = useLocalStorageBoolean(WARNING_STORAGE_KEY, false);

  useEffect(() => {
    if (isOpen) {
      setShowWarning(!warningShown);
    }
  }, [isOpen, warningShown]);

  // 角色下载核心逻辑
  const {
    filteredCharacters,
    loading,
    loadingStage,
    importing,
    selectedTag,
    tagCounts,
    imageLoadingStates,
    setSelectedTag,
    downloadAndImport,
    refresh,
    handleImageLoad,
    handleImageError,
    RAW_BASE_URL,
  } = useCharacterDownload({
    isOpen,
    onImport,
    onClose,
    onError: showError,
    t,
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      {/* 背景遮罩 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 backdrop-blur-sm bg-black/50"
        onClick={onClose}
      />

      {/* 主弹窗 */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`bg-deep rounded-lg shadow-2xl w-full border border-ink relative z-10 ${
          isMobile
            ? "h-full max-h-[calc(100vh-12rem)] p-3 rounded-none pb-28"
            : "p-6 max-w-6xl max-h-[90vh] rounded-lg"
        }`}
      >
        {/* 头部 */}
        <ModalHeader
          isMobile={isMobile}
          loading={loading}
          serifFontClass={serifFontClass}
          t={t}
          onRefresh={refresh}
          onClose={onClose}
        />

        {/* 标签筛选 */}
        <TagFilter
          isMobile={isMobile}
          selectedTag={selectedTag}
          tagCounts={tagCounts}
          fontClass={fontClass}
          serifFontClass={serifFontClass}
          t={t}
          onTagSelect={setSelectedTag}
        />

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden">
          <ContentArea
            loading={loading}
            loadingStage={loadingStage}
            filteredCharacters={filteredCharacters}
            selectedTag={selectedTag}
            isMobile={isMobile}
            importing={importing}
            imageLoadingStates={imageLoadingStates}
            rawBaseUrl={RAW_BASE_URL}
            fontClass={fontClass}
            t={t}
            onDownload={downloadAndImport}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
          />
        </div>
      </motion.div>

      {/* 合规警告弹窗 */}
      <AnimatePresence>
        {showWarning && (
          <RegulatoryWarningModal
            isOpen={showWarning}
            onClose={() => setShowWarning(false)}
            fontClass={fontClass}
            serifFontClass={serifFontClass}
            t={t}
          />
        )}
      </AnimatePresence>

      {/* 错误提示 */}
      <Toast
        isVisible={errorToast.isVisible}
        message={errorToast.message}
        onClose={hideError}
        type="error"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   子组件 - 保持主文件简洁
   ═══════════════════════════════════════════════════════════════════════════ */

interface ModalHeaderProps {
  isMobile: boolean;
  loading: boolean;
  serifFontClass: string;
  t: (key: string) => string;
  onRefresh: () => void;
  onClose: () => void;
}

function ModalHeader({ isMobile, loading, serifFontClass, t, onRefresh, onClose }: ModalHeaderProps) {
  return (
    <div className={`flex justify-between items-center ${isMobile ? "mb-4" : "mb-6"}`}>
      <h2 className={`text-cream-soft font-bold ${serifFontClass} ${isMobile ? "text-lg" : "text-2xl"}`}>
        {t("downloadModal.title")}
      </h2>

      <div className="flex items-center gap-2">
        {/* 刷新按钮 */}
        <button
          onClick={onRefresh}
          disabled={loading}
          className={`group p-2 rounded-full text-ink-soft hover:text-amber-bright hover:bg-muted-surface transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-highlight/40 ${
            loading ? "opacity-60 cursor-wait" : ""
          }`}
          title={t("downloadModal.refresh")}
          type="button"
        >
          <svg
            className={`${isMobile ? "w-4 h-4" : "w-5 h-5"} ${loading ? "animate-spin" : ""} transition-transform duration-300 group-hover:rotate-180`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 11A8.1 8.1 0 004.5 9M4 5v6h6M20 19v-6h-6" />
          </svg>
        </button>

        {/* 关闭按钮 */}
        <button
          onClick={onClose}
          className="p-2 rounded-full text-ink-soft hover:text-amber-bright hover:bg-muted-surface transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-highlight/40"
          title={t("common.close")}
          type="button"
        >
          <svg className={isMobile ? "w-5 h-5" : "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

interface TagFilterProps {
  isMobile: boolean;
  selectedTag: TagType;
  tagCounts: Record<string, number>;
  fontClass: string;
  serifFontClass: string;
  t: (key: string) => string;
  onTagSelect: (tag: TagType) => void;
}

function TagFilter({ isMobile, selectedTag, tagCounts, fontClass, serifFontClass, t, onTagSelect }: TagFilterProps) {
  const buttonBase = `rounded-full transition-all duration-200 ${fontClass}`;
  const buttonSize = isMobile ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm";

  const getButtonStyle = (isSelected: boolean, isDisabled: boolean) => {
    if (isSelected) {
      return "bg-gradient-to-br from-sand to-sand text-ink font-semibold shadow-lg shadow-sand/20 border border-transparent";
    }
    return `bg-transparent text-amber-soft hover:bg-muted-surface hover:text-sand border border-ink/50 hover:border-ink ${
      isDisabled ? "opacity-50 cursor-not-allowed" : ""
    }`;
  };

  return (
    <div className={isMobile ? "mb-4" : "mb-6"}>
      <h3 className={`text-cream-soft ${serifFontClass} ${isMobile ? "text-base mb-2" : "text-lg mb-3"}`}>
        {t("downloadModal.tagFilter")}
      </h3>

      <div className={`flex flex-wrap ${isMobile ? "gap-1.5" : "gap-2"}`}>
        {/* 全部标签 */}
        <button
          onClick={() => onTagSelect("all")}
          className={`${buttonBase} ${buttonSize} ${getButtonStyle(selectedTag === "all", false)}`}
        >
          {isMobile
            ? `${t("downloadModal.all")} (${tagCounts.all})`
            : t("downloadModal.allCharacters").replace("{count}", String(tagCounts.all))}
        </button>

        {/* 分类标签 */}
        {TAGS.map(tag => (
          <button
            key={tag}
            onClick={() => onTagSelect(tag)}
            disabled={tagCounts[tag] === 0}
            className={`${buttonBase} ${buttonSize} ${getButtonStyle(selectedTag === tag, tagCounts[tag] === 0)}`}
          >
            {t(`downloadModal.tags.${tag}`)} ({tagCounts[tag] || 0})
          </button>
        ))}
      </div>
    </div>
  );
}

interface ContentAreaProps {
  loading: boolean;
  loadingStage: "fetching" | "preloading" | "complete";
  filteredCharacters: { name: string; download_url: string }[];
  selectedTag: TagType;
  isMobile: boolean;
  importing: string | null;
  imageLoadingStates: Record<string, boolean>;
  rawBaseUrl: string;
  fontClass: string;
  t: (key: string) => string;
  onDownload: (file: { name: string; download_url: string }) => void;
  onImageLoad: (fileName: string) => void;
  onImageError: (fileName: string) => void;
}

function ContentArea({
  loading,
  loadingStage,
  filteredCharacters,
  selectedTag,
  isMobile,
  importing,
  imageLoadingStates,
  rawBaseUrl,
  fontClass,
  t,
  onDownload,
  onImageLoad,
  onImageError,
}: ContentAreaProps) {
  // 加载状态
  if (loading) {
    return (
      <div className={`text-amber-soft py-12 text-center ${fontClass}`}>
        <div className="animate-spin w-8 h-8 border-2 border-amber-soft border-t-transparent rounded-full mx-auto mb-4" />
        <div className="mb-2">
          {loadingStage === "fetching" && t("downloadModal.loading")}
          {loadingStage === "preloading" && t("downloadModal.preloading")}
        </div>
        {loadingStage === "preloading" && (
          <div className="text-xs text-ink-soft">{t("downloadModal.preloadingDescription")}</div>
        )}
      </div>
    );
  }

  // 空状态
  if (filteredCharacters.length === 0) {
    return (
      <div className={`text-amber-soft py-12 text-center ${fontClass}`}>
        <div className="opacity-60 mb-2">📭</div>
        {t("downloadModal.noCharactersInTag")}
      </div>
    );
  }

  // 角色网格
  return (
    <div
      className={
        isMobile
          ? "grid grid-cols-1 gap-3 max-h-[calc(100vh-380px)] overflow-y-auto pr-1"
          : "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 max-h-[60vh] overflow-y-auto pr-2"
      }
    >
      <AnimatePresence mode="wait">
        {filteredCharacters.map((file, index) => (
          <CharacterCard
            key={`${selectedTag}-${file.name}`}
            file={file}
            index={index}
            selectedTag={selectedTag}
            isMobile={isMobile}
            isImageLoaded={imageLoadingStates[file.name] ?? false}
            isImporting={importing === file.name}
            disabled={!!importing}
            rawBaseUrl={rawBaseUrl}
            fontClass={fontClass}
            t={t}
            onDownload={onDownload}
            onImageLoad={onImageLoad}
            onImageError={onImageError}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
