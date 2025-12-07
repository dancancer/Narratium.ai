/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                         CharacterCard                                    ║
 * ║                                                                          ║
 * ║  单个角色卡片组件 - 展示角色图片、标签和下载按钮                             ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import NextImage from "next/image";
import { Download } from "lucide-react";
import { GithubFile, extractCharacterInfo } from "@/hooks/useCharacterDownload";

interface CharacterCardProps {
  file: GithubFile;
  index: number;
  selectedTag: string;
  isMobile: boolean;
  isImageLoaded: boolean;
  isImporting: boolean;
  disabled: boolean;
  rawBaseUrl: string;
  fontClass: string;
  t: (key: string) => string;
  onDownload: (file: GithubFile) => void;
  onImageLoad: (fileName: string) => void;
  onImageError: (fileName: string) => void;
}

export function CharacterCard({
  file,
  index,
  selectedTag,
  isMobile,
  isImageLoaded,
  isImporting,
  disabled,
  rawBaseUrl,
  fontClass,
  t,
  onDownload,
  onImageLoad,
  onImageError,
}: CharacterCardProps) {
  const { displayName, tags } = extractCharacterInfo(file.name);

  return (
    <div
      className={`bg-muted-surface rounded-md border border-border hover:border-primary-soft transition-all duration-200 hover: animate-in fade-in zoom-in-95 ${
        isMobile ? "p-3 flex gap-3" : "p-4"
      }`}
      style={{ animationDelay: `${index * 20}ms` }}
    >
      {/* 角色图片 */}
      <CharacterImage
        fileName={file.name}
        rawBaseUrl={rawBaseUrl}
        isMobile={isMobile}
        isImageLoaded={isImageLoaded}
        tags={tags}
        fontClass={fontClass}
        t={t}
        onLoad={onImageLoad}
        onError={onImageError}
      />

      {/* 角色信息和下载按钮 */}
      <div className={isMobile ? "flex-1 flex flex-col justify-between" : "mb-3"}>
        <CharacterInfo
          displayName={displayName}
          tags={tags}
          isMobile={isMobile}
          fontClass={fontClass}
          t={t}
        />

        <DownloadButton
          isMobile={isMobile}
          isImporting={isImporting}
          disabled={disabled}
          fontClass={fontClass}
          t={t}
          onClick={() => onDownload(file)}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   子组件 - 拆分渲染逻辑
   ═══════════════════════════════════════════════════════════════════════════ */

interface CharacterImageProps {
  fileName: string;
  rawBaseUrl: string;
  isMobile: boolean;
  isImageLoaded: boolean;
  tags: string[];
  fontClass: string;
  t: (key: string) => string;
  onLoad: (name: string) => void;
  onError: (name: string) => void;
}

function CharacterImage({
  fileName,
  rawBaseUrl,
  isMobile,
  isImageLoaded,
  tags,
  fontClass,
  t,
  onLoad,
  onError,
}: CharacterImageProps) {
  return (
    <div
      className={`relative rounded-md overflow-hidden ${
        isMobile ? "w-20 h-20 flex-shrink-0" : "h-56 mb-3"
      }`}
    >
      {/* 加载占位 */}
      {!isImageLoaded && (
        <div className="absolute inset-0 bg-deep flex items-center justify-center">
          <div
            className={`animate-spin border-2 border-primary-soft border-t-transparent rounded-full ${
              isMobile ? "w-4 h-4" : "w-6 h-6"
            }`}
          />
        </div>
      )}

      {/* 图片 */}
      <NextImage
        src={rawBaseUrl + fileName}
        alt={fileName}
        fill
        sizes={
          isMobile
            ? "80px"
            : "(min-width:1280px) 200px, (min-width:1024px) 180px, (min-width:640px) 160px, 120px"
        }
        className={`object-cover transition-all duration-300 ${
          isImageLoaded ? "opacity-100" : "opacity-0"
        }`}
        loading="lazy"
        onLoad={() => onLoad(fileName)}
        onError={() => onError(fileName)}
      />

      {/* 桌面端标签覆盖层 */}
      {tags.length > 0 && !isMobile && (
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          {tags.slice(0, 2).map(tag => (
            <span
              key={tag}
              className={`px-2 py-0.5 text-xs rounded-full bg-black/60 text-highlight ${fontClass}`}
            >
              {t(`downloadModal.tags.${tag}`)}
            </span>
          ))}
          {tags.length > 2 && (
            <span className={`px-2 py-0.5 text-xs rounded-full bg-black/60 text-highlight ${fontClass}`}>
              +{tags.length - 2}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface CharacterInfoProps {
  displayName: string;
  tags: string[];
  isMobile: boolean;
  fontClass: string;
  t: (key: string) => string;
}

function CharacterInfo({ displayName, tags, isMobile, fontClass, t }: CharacterInfoProps) {
  return (
    <div>
      <h3
        className={`text-cream-soft font-medium line-clamp-1 ${fontClass} ${
          isMobile ? "text-sm mb-1" : "text-sm mb-1"
        }`}
      >
        {displayName}
      </h3>

      {/* 移动端标签显示 */}
      {isMobile && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className={`px-1.5 py-0.5 text-xs rounded-full bg-ink text-highlight ${fontClass}`}
            >
              {t(`downloadModal.tags.${tag}`)}
            </span>
          ))}
          {tags.length > 3 && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full bg-ink text-highlight ${fontClass}`}>
              +{tags.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

interface DownloadButtonProps {
  isMobile: boolean;
  isImporting: boolean;
  disabled: boolean;
  fontClass: string;
  t: (key: string) => string;
  onClick: () => void;
}

function DownloadButton({
  isMobile,
  isImporting,
  disabled,
  fontClass,
  t,
  onClick,
}: DownloadButtonProps) {
  const baseClass = `group w-full rounded-md transition-all duration-200 ${fontClass}`;
  const sizeClass = isMobile ? "px-2 py-1.5 text-xs" : "px-3 py-2 text-sm";

  const stateClass = isImporting
    ? "bg-ink text-primary-soft cursor-wait"
    : "bg-gradient-to-br from-sand to-primary-bright text-ink hover: hover:";

  return (
    <button
      disabled={disabled}
      className={`${baseClass} ${sizeClass} ${stateClass}`}
      onClick={onClick}
    >
      {isImporting ? (
        <div className="flex items-center justify-center gap-2">
          <div
            className={`animate-spin border-2 border-primary-soft border-t-transparent rounded-full ${
              isMobile ? "w-3 h-3" : "w-4 h-4"
            }`}
          />
          {isMobile ? t("downloadModal.importingShort") : t("downloadModal.importing")}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 font-semibold">
          <DownloadIcon isMobile={isMobile} />
          {isMobile ? t("downloadModal.downloadShort") : t("downloadModal.downloadAndImport")}
        </div>
      )}
    </button>
  );
}

function DownloadIcon({ isMobile }: { isMobile: boolean }) {
  return (
    <Download
      className={`opacity-80 group-hover:opacity-100 transition-opacity ${
        isMobile ? "h-3 w-3" : "h-4 w-4"
      }`}
    />
  );
}
