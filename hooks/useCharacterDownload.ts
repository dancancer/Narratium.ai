/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                     useCharacterDownload Hook                            ║
 * ║                                                                          ║
 * ║  角色下载核心逻辑：GitHub API 集成、缓存管理、图片预加载                    ║
 * ║  遵循 Linus 哲学：消除特殊情况，让数据结构驱动逻辑                          ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { handleCharacterUpload } from "@/function/character/import";
import { getJSON, setJSON, removeItem } from "@/lib/storage/client-storage";

/* ═══════════════════════════════════════════════════════════════════════════
   常量定义 - 集中管理，避免魔法数字
   ═══════════════════════════════════════════════════════════════════════════ */

const GITHUB_API_URL = "https://api.github.com/repos/Narratium/Character-Card/contents";
const RAW_BASE_URL = "https://raw.githubusercontent.com/Narratium/Character-Card/main/";

const CACHE_KEYS = {
  files: "narratium_character_files",
  images: "narratium_character_images",
  warning: "narratium_regulatory_warning_shown",
} as const;

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

/* ═══════════════════════════════════════════════════════════════════════════
   类型定义
   ═══════════════════════════════════════════════════════════════════════════ */

export interface GithubFile {
  name: string;
  download_url: string;
  sha?: string;
  size?: number;
}

export interface CharacterInfo {
  displayName: string;
  tags: string[];
}

interface CacheData {
  data: GithubFile[];
  timestamp: number;
  fileHashes: Record<string, string>;
}

interface ImageCacheData {
  [key: string]: { loaded: boolean; timestamp: number };
}

/* ═══════════════════════════════════════════════════════════════════════════
   标签配置 - 数据驱动，避免条件分支
   ═══════════════════════════════════════════════════════════════════════════ */

export const TAGS = ["Cultivation", "Fantasy", "Fanfiction", "Anime", "Other"] as const;
export type TagType = typeof TAGS[number] | "all";

const TAG_KEYWORDS: Record<string, string[]> = {
  Cultivation: ["x", "cultivation", "仙侠", "immortal", "修仙"],
  Fantasy: ["玄幻", "fantasy", "魔法", "magic", "奇幻"],
  Fanfiction: ["同人", "fanfiction", "fan", "二创", "doujin"],
  Anime: ["二次元", "anime", "动漫", "萌", "waifu", "少女", "萝莉", "御姐"],
};

const NSFW_KEYWORDS = ["nsfw", "18+", "adult", "mature", "r18"];

/* ═══════════════════════════════════════════════════════════════════════════
   纯函数工具 - 无副作用，易于测试
   ═══════════════════════════════════════════════════════════════════════════ */

/** 从文件名提取角色信息和标签 */
export const extractCharacterInfo = (fileName: string): CharacterInfo => {
  const nameWithoutExt = fileName.replace(/\.png$/, "");
  const parts = nameWithoutExt.split(/--/);
  const displayName = parts.length === 2 ? parts[0].trim() : nameWithoutExt;

  // 用映射表匹配标签，避免嵌套循环
  const lowerName = nameWithoutExt.toLowerCase();
  const tags = Object.entries(TAG_KEYWORDS)
    .filter(([, keywords]) => keywords.some(kw => lowerName.includes(kw.toLowerCase())))
    .map(([category]) => category);

  return { displayName, tags: tags.length > 0 ? tags : ["Other"] };
};

/** 检测 NSFW 内容 */
const isNsfwContent = (file: GithubFile): boolean => {
  const lowerName = file.name.toLowerCase();
  const { tags } = extractCharacterInfo(file.name);
  return tags.some(t => t.toLowerCase() === "nsfw") ||
    NSFW_KEYWORDS.some(kw => lowerName.includes(kw));
};

/* ═══════════════════════════════════════════════════════════════════════════
   缓存管理 - 封装 localStorage 操作
   ═══════════════════════════════════════════════════════════════════════════ */

const cacheManager = {
  getFiles(): { data: GithubFile[]; hashes: Record<string, string> } | null {
    const cached = getJSON<CacheData | null>(CACHE_KEYS.files, null);
    if (!cached) return null;
    if (Date.now() - cached.timestamp >= CACHE_DURATION) return null;
    return { data: cached.data, hashes: cached.fileHashes || {} };
  },

  setFiles(data: GithubFile[]) {
    const fileHashes: Record<string, string> = {};
    data.forEach(f => f.sha && (fileHashes[f.name] = f.sha));

    const cacheData: CacheData = { data, timestamp: Date.now(), fileHashes };
    setJSON(CACHE_KEYS.files, cacheData);
  },

  getImages(currentNames?: string[]): ImageCacheData {
    const cache = getJSON<ImageCacheData>(CACHE_KEYS.images, {});
    const now = Date.now();

    Object.keys(cache).forEach(key => {
      const isExpired = now - cache[key].timestamp > CACHE_DURATION;
      const isRemoved = currentNames && !currentNames.includes(key);
      if (isExpired || isRemoved) delete cache[key];
    });

    if (currentNames) {
      setJSON(CACHE_KEYS.images, cache);
    }
    return cache;
  },

  setImageLoaded(name: string) {
    const cache = this.getImages();
    cache[name] = { loaded: true, timestamp: Date.now() };
    setJSON(CACHE_KEYS.images, cache);
  },

  clearAll() {
    removeItem(CACHE_KEYS.files);
    removeItem(CACHE_KEYS.images);
  },
};

/* ═══════════════════════════════════════════════════════════════════════════
   主 Hook - 组合所有逻辑
   ═══════════════════════════════════════════════════════════════════════════ */

export type LoadingStage = "fetching" | "preloading" | "complete";

interface UseCharacterDownloadOptions {
  isOpen: boolean;
  onImport: () => void;
  onClose: () => void;
  onError: (message: string) => void;
  t: (key: string) => string;
}

export function useCharacterDownload({
  isOpen,
  onImport,
  onClose,
  onError,
  t,
}: UseCharacterDownloadOptions) {
  const [characterFiles, setCharacterFiles] = useState<GithubFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingStage, setLoadingStage] = useState<LoadingStage>("fetching");
  const [importing, setImporting] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<TagType>("all");
  const [imageLoadingStates, setImageLoadingStates] = useState<Record<string, boolean>>({});

  /* ─────────────────────────────────────────────────────────────────────────
     图片预加载 - 批量处理，避免阻塞浏览器
     ───────────────────────────────────────────────────────────────────────── */
  const preloadImages = useCallback(async (files: GithubFile[]) => {
    if (files.length === 0) {
      setLoadingStage("complete");
      return;
    }

    setLoadingStage("preloading");
    const currentNames = files.map(f => f.name);
    const imageCache = cacheManager.getImages(currentNames);
    const toPreload = files.filter(f => !imageCache[f.name]?.loaded);

    if (toPreload.length === 0) {
      setLoadingStage("complete");
      return;
    }

    // 批量加载，每批 8 张
    const BATCH_SIZE = 8;
    for (let i = 0; i < toPreload.length; i += BATCH_SIZE) {
      const batch = toPreload.slice(i, i + BATCH_SIZE);

      await Promise.all(batch.map(file => new Promise<void>(resolve => {
        const img = new window.Image();
        img.onload = () => {
          cacheManager.setImageLoaded(file.name);
          setImageLoadingStates(prev => ({ ...prev, [file.name]: true }));
          resolve();
        };
        img.onerror = () => resolve();
        img.src = RAW_BASE_URL + file.name;
      })));

      await new Promise(r => setTimeout(r, 100)); // 批次间隔
    }

    setLoadingStage("complete");
  }, []);

  /* ─────────────────────────────────────────────────────────────────────────
     加载角色列表
     
     【修复】移除 onError 和 t 的依赖，避免不必要的重新加载
     - onError 是 toast.error，每次都是新引用但逻辑相同
     - t 是翻译函数，通常也是稳定的
     - 使用最新值而不是依赖数组中的值
     ───────────────────────────────────────────────────────────────────────── */
  const loadCharacters = useCallback(async () => {
    setLoading(true);
    setLoadingStage("fetching");

    try {
      const res = await fetch(GITHUB_API_URL);
      const data = await res.json();

      if (!Array.isArray(data)) throw new Error("Invalid response format");

      const pngFiles: GithubFile[] = data.filter((item: GithubFile) =>
        item.name.endsWith(".png")
      );
      const cachedData = cacheManager.getFiles();

      // 检查是否有更新
      const hasUpdates = !cachedData || pngFiles.some(file => {
        const cachedHash = cachedData.hashes[file.name];
        return !cachedHash || cachedHash !== file.sha;
      });

      const hasRemovals = cachedData && Object.keys(cachedData.hashes).some(
        name => !pngFiles.find(f => f.name === name)
      );

      if (!hasUpdates && !hasRemovals && cachedData) {
        setCharacterFiles(cachedData.data);
        setLoading(false);
        preloadImages(cachedData.data);
      } else {
        setCharacterFiles(pngFiles);
        cacheManager.setFiles(pngFiles);
        setLoading(false);

        // 清理已更新文件的图片缓存
        if (cachedData) {
          const imageCache = cacheManager.getImages();
          pngFiles.forEach(file => {
            if (cachedData.hashes[file.name] && cachedData.hashes[file.name] !== file.sha) {
              delete imageCache[file.name];
            }
          });
          setJSON(CACHE_KEYS.images, imageCache);
        }

        preloadImages(pngFiles);
      }
    } catch (err) {
      console.error("Failed to fetch characters:", err);
      onError(t("downloadModal.fetchError") || "Failed to fetch characters");
      setLoading(false);
      setLoadingStage("complete");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preloadImages]);

  /* ─────────────────────────────────────────────────────────────────────────
     下载并导入角色
     ───────────────────────────────────────────────────────────────────────── */
  const downloadAndImport = useCallback(async (file: GithubFile) => {
    setImporting(file.name);
    try {
      const res = await fetch(file.download_url || RAW_BASE_URL + file.name);
      if (!res.ok) throw new Error(t("downloadModal.downloadFailed"));

      const blob = await res.blob();
      const fileObj = new File([blob], file.name, { type: blob.type });
      await handleCharacterUpload(fileObj);
      onImport();
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : t("downloadModal.importFailed");
      onError(msg);
    } finally {
      setImporting(null);
    }
  }, [onClose, onError, onImport, t]);

  /* ─────────────────────────────────────────────────────────────────────────
     刷新（清除缓存重新加载）
     ───────────────────────────────────────────────────────────────────────── */
  const refresh = useCallback(() => {
    cacheManager.clearAll();
    setCharacterFiles([]);
    setImageLoadingStates({});
    loadCharacters();
  }, [loadCharacters]);

  /* ─────────────────────────────────────────────────────────────────────────
     图片加载回调
     ───────────────────────────────────────────────────────────────────────── */
  const handleImageLoad = useCallback((fileName: string) => {
    setImageLoadingStates(prev => ({ ...prev, [fileName]: true }));
    cacheManager.setImageLoaded(fileName);
  }, []);

  const handleImageError = useCallback((fileName: string) => {
    setImageLoadingStates(prev => ({ ...prev, [fileName]: false }));
  }, []);

  /* ─────────────────────────────────────────────────────────────────────────
     派生状态 - 筛选和计数
     ───────────────────────────────────────────────────────────────────────── */
  const filteredCharacters = useMemo(() => {
    const nonNsfw = characterFiles.filter(f => !isNsfwContent(f));
    if (selectedTag === "all") return nonNsfw;

    return nonNsfw.filter(file => {
      const { tags } = extractCharacterInfo(file.name);
      return tags.some(t => t.toLowerCase() === selectedTag.toLowerCase());
    });
  }, [characterFiles, selectedTag]);

  const tagCounts = useMemo(() => {
    const nonNsfw = characterFiles.filter(f => !isNsfwContent(f));
    const counts: Record<string, number> = { all: nonNsfw.length };

    TAGS.forEach(tag => {
      counts[tag] = nonNsfw.filter(file => {
        const { tags } = extractCharacterInfo(file.name);
        return tags.some(t => t.toLowerCase() === tag.toLowerCase());
      }).length;
    });

    return counts;
  }, [characterFiles]);

  /* ─────────────────────────────────────────────────────────────────────────
     副作用 - 自动加载
     ───────────────────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isOpen) loadCharacters();
  }, [isOpen, loadCharacters]);

  return {
    // 状态
    characterFiles,
    filteredCharacters,
    loading,
    loadingStage,
    importing,
    selectedTag,
    tagCounts,
    imageLoadingStates,

    // 操作
    setSelectedTag,
    downloadAndImport,
    refresh,
    handleImageLoad,
    handleImageError,

    // 常量
    RAW_BASE_URL,
    TAGS,
  };
}
