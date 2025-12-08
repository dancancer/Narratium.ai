/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     DownloadCharacterModal                               ║
 * ║                                                                          ║
 * ║  角色下载弹窗 - 已迁移至 Radix UI Dialog                                    ║
 * ║  GitHub 角色库浏览、筛选与导入                                              ║
 * ║  核心逻辑在 useCharacterDownload hook                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React, { useEffect, useState } from "react";
import { useLanguage } from "@/app/i18n";
import { toast } from "@/lib/store/toast-store";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { useCharacterDownload, TAGS, TagType } from "@/hooks/useCharacterDownload";
import { CharacterCard, RegulatoryWarningModal, WARNING_STORAGE_KEY } from "@/components/download-modal";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";
import { X, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

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
    onError: toast.error,
    t,
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`p-0 overflow-hidden  border-border gap-0 ${
        isMobile
          ? "h-full max-h-[calc(100vh-12rem)] rounded-none pb-28 max-w-full"
          : "max-w-6xl max-h-[90vh] rounded-md"
      }`}>
        <DialogTitle className="sr-only">{t("downloadModal.title")}</DialogTitle>
        <div className={isMobile ? "p-3" : "p-6"}>
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
        </div>

        {/* 合规警告弹窗 */}
        {showWarning && (
          <RegulatoryWarningModal
            isOpen={showWarning}
            onClose={() => setShowWarning(false)}
            fontClass={fontClass}
            serifFontClass={serifFontClass}
            t={t}
          />
        )}
      </DialogContent>
    </Dialog>
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
      <h2 className={`text-cream-soft font-bold  ${isMobile ? "text-lg" : "text-2xl"}`}>
        {t("downloadModal.title")}
      </h2>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
          disabled={loading}
          title={t("downloadModal.refresh")}
        >
          <RefreshCw size={isMobile ? 16 : 20} className={loading ? "animate-spin" : ""} />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          title={t("common.close")}
        >
          <X size={isMobile ? 20 : 24} />
        </Button>
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
      return "bg-gradient-to-br from-sand to-sand text-ink font-semibold   border border-transparent";
    }
    return `bg-transparent text-primary-soft hover:bg-muted-surface hover:text-sand border border-border/50 hover:border-border ${
      isDisabled ? "opacity-50 cursor-not-allowed" : ""
    }`;
  };

  return (
    <div className={isMobile ? "mb-4" : "mb-6"}>
      <h3 className={`text-cream-soft  ${isMobile ? "text-base mb-2" : "text-lg mb-3"}`}>
        {t("downloadModal.tagFilter")}
      </h3>

      <div className={`flex flex-wrap ${isMobile ? "gap-1.5" : "gap-2"}`}>
        <Button
          variant={selectedTag === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => onTagSelect("all")}
          className={`${buttonBase} ${buttonSize}`}
        >
          {isMobile
            ? `${t("downloadModal.all")} (${tagCounts.all})`
            : t("downloadModal.allCharacters").replace("{count}", String(tagCounts.all))}
        </Button>

        {TAGS.map(tag => (
          <Button
            key={tag}
            variant={selectedTag === tag ? "default" : "outline"}
            size="sm"
            onClick={() => onTagSelect(tag)}
            disabled={tagCounts[tag] === 0}
            className={`${buttonBase} ${buttonSize}`}
          >
            {t(`downloadModal.tags.${tag}`)} ({tagCounts[tag] || 0})
          </Button>
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
      <div className={`text-primary-soft py-12 text-center ${fontClass}`}>
        <div className="animate-spin w-8 h-8 border-2 border-primary-soft border-t-transparent rounded-full mx-auto mb-4" />
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
      <div className={`text-primary-soft py-12 text-center ${fontClass}`}>
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
    </div>
  );
}
