/**
 * ╔══════════════════════════════════════════════════════════════════════════╗
 * ║                    Import World Book Modal                                ║
 * ║                                                                          ║
 * ║  世界书导入弹窗 - 重构后的简洁版本                                           ║
 * ║  使用 import-modal 共享组件                                               ║
 * ╚══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { toast } from "react-hot-toast";
import { useLanguage } from "@/app/i18n";
import { importWorldBookFromJson } from "@/function/worldbook/import";
import { listGlobalWorldBooks, importFromGlobalWorldBook, GlobalWorldBook, deleteGlobalWorldBook } from "@/function/worldbook/global";
import { Toast } from "@/components/Toast";
import {
  DragDropZone,
  ImportModalHeader,
  GlobalItemSelector,
  GlobalItem,
  ImportResultDisplay,
  ImportResult,
  SaveAsGlobalCheckbox,
  GlobalFormFields,
  ImportModalFooter,
} from "@/components/import-modal";

/* ═══════════════════════════════════════════════════════════════════════════
   类型定义
   ═══════════════════════════════════════════════════════════════════════════ */

interface ImportWorldBookModalProps {
  isOpen: boolean;
  characterId: string;
  onClose: () => void;
  onImportSuccess: () => void;
}

/* ═══════════════════════════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════════════════════════ */

function mapToGlobalItem(book: GlobalWorldBook): GlobalItem {
  return {
    id: book.id,
    name: book.name,
    description: book.description,
    count: book.entryCount,
    createdAt: new Date(book.createdAt).toISOString(),
    sourceCharacterName: book.sourceCharacterName,
  };
}

/* ═══════════════════════════════════════════════════════════════════════════
   主组件
   ═══════════════════════════════════════════════════════════════════════════ */

export default function ImportWorldBookModal({ isOpen, characterId, onClose, onImportSuccess }: ImportWorldBookModalProps) {
  const { t, serifFontClass } = useLanguage();

  // UI 状态
  const [activeTab, setActiveTab] = useState<"file" | "global">("file");
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // 保存为全局
  const [saveAsGlobal, setSaveAsGlobal] = useState(false);
  const [globalName, setGlobalName] = useState("");
  const [globalDescription, setGlobalDescription] = useState("");

  // 全局世界书
  const [globalWorldBooks, setGlobalWorldBooks] = useState<GlobalWorldBook[]>([]);
  const [selectedGlobalId, setSelectedGlobalId] = useState("");
  const [isLoadingGlobal, setIsLoadingGlobal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 错误提示
  const [errorToast, setErrorToast] = useState({ isVisible: false, message: "" });
  const showError = useCallback((msg: string) => setErrorToast({ isVisible: true, message: msg }), []);
  const hideError = useCallback(() => setErrorToast({ isVisible: false, message: "" }), []);

  /* ─────────────────────────────────────────────────────────────────────────
     加载全局世界书
     ───────────────────────────────────────────────────────────────────────── */

  const loadGlobalWorldBooks = useCallback(async () => {
    setIsLoadingGlobal(true);
    try {
      const result = await listGlobalWorldBooks();
      if (result.success) setGlobalWorldBooks(result.globalWorldBooks);
      else showError("Failed to load global world books");
    } catch (error) {
      console.error("Failed to load global world books:", error);
      showError("Failed to load global world books");
    } finally {
      setIsLoadingGlobal(false);
    }
  }, [showError]);

  useEffect(() => {
    if (activeTab === "global" && isOpen) loadGlobalWorldBooks();
  }, [activeTab, isOpen, loadGlobalWorldBooks]);

  /* ─────────────────────────────────────────────────────────────────────────
     文件导入
     ───────────────────────────────────────────────────────────────────────── */

  const handleFilesSelect = useCallback(async (files: File[]) => {
    const file = files[0];
    if (!file?.type.includes("json")) { showError("Please select a JSON file"); return; }

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      const options = saveAsGlobal ? { saveAsGlobal: true, globalName: globalName.trim() || file.name.replace(".json", ""), globalDescription: globalDescription.trim(), sourceCharacterName: undefined } : undefined;
      const result = await importWorldBookFromJson(characterId, jsonData, options);
      setImportResult(result);
      if (result.success) { toast.success(result.message); onImportSuccess(); }
      else showError(result.message);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Unknown error";
      showError(`Failed to import: ${msg}`);
      setImportResult({ success: false, message: `Failed to import: ${msg}`, errors: [msg], importedCount: 0, skippedCount: 0 });
    } finally {
      setIsImporting(false);
    }
  }, [characterId, saveAsGlobal, globalName, globalDescription, showError, onImportSuccess]);

  /* ─────────────────────────────────────────────────────────────────────────
     全局导入
     ───────────────────────────────────────────────────────────────────────── */

  const handleImportFromGlobal = useCallback(async () => {
    if (!selectedGlobalId) { showError("Please select a global world book"); return; }

    setIsImporting(true);
    try {
      const result = await importFromGlobalWorldBook(characterId, selectedGlobalId);
      if (result.success) {
        setImportResult({ success: true, message: result.message, importedCount: result.importedCount, skippedCount: 0, errors: [] });
        toast.success(result.message);
        onImportSuccess();
      } else showError(result.message);
    } catch (error: any) {
      console.error("Import from global failed:", error);
      showError(`Import failed: ${error.message}`);
    } finally {
      setIsImporting(false);
    }
  }, [characterId, selectedGlobalId, showError, onImportSuccess]);

  /* ─────────────────────────────────────────────────────────────────────────
     删除全局
     ───────────────────────────────────────────────────────────────────────── */

  const handleDeleteGlobal = useCallback(async (globalId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    setDeletingId(globalId);
    try {
      const result = await deleteGlobalWorldBook(globalId);
      if (result.success) {
        toast.success(t("worldBook.globalWorldBookDeleted"));
        loadGlobalWorldBooks();
        if (selectedGlobalId === globalId) setSelectedGlobalId("");
      } else showError(result.message || t("worldBook.failedToDeleteGlobalWorldBook"));
    } catch (error: any) {
      console.error("Failed to delete global world book:", error);
      showError(`${t("worldBook.failedToDeleteGlobalWorldBook")}: ${error.message}`);
    } finally {
      setDeletingId(null);
    }
  }, [t, loadGlobalWorldBooks, selectedGlobalId, showError]);

  /* ─────────────────────────────────────────────────────────────────────────
     关闭弹窗
     ───────────────────────────────────────────────────────────────────────── */

  const handleClose = useCallback(() => {
    setImportResult(null);
    setSaveAsGlobal(false);
    setGlobalName("");
    setGlobalDescription("");
    setActiveTab("file");
    setSelectedGlobalId("");
    onClose();
  }, [onClose]);

  /* ─────────────────────────────────────────────────────────────────────────
     拖拽处理
     ───────────────────────────────────────────────────────────────────────── */

  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) handleFilesSelect(files);
  }, [handleFilesSelect]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="relative bg-gradient-to-br from-deep/95 via-muted-surface/95 to-deep/95 backdrop-blur-xl border border-ink/60 rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-blue-500/5 opacity-50 animate-pulse" />

        <ImportModalHeader
          title={t("worldBook.importWorldBook")}
          activeTab={activeTab}
          tabs={[
            { id: "file", label: t("worldBook.importFromJson"), icon: "file", activeColor: "amber" },
            { id: "global", label: t("worldBook.importFromGlobal"), icon: "global", activeColor: "blue" },
          ]}
          serifFontClass={serifFontClass}
          onTabChange={setActiveTab}
          onClose={handleClose}
        />

        <div className="relative p-3 max-h-[55vh] overflow-y-auto scrollbar-thin scrollbar-track-deep scrollbar-thumb-ink">
          {activeTab === "file" ? (
            <div className="space-y-3">
              <DragDropZone
                isDragging={isDragging}
                description={t("worldBook.dragDropJson")}
                hint={t("worldBook.jsonFileOnly")}
                serifFontClass={serifFontClass}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onFilesSelect={handleFilesSelect}
              />
              <SaveAsGlobalCheckbox checked={saveAsGlobal} label={t("worldBook.saveAsGlobalWorldBook")} serifFontClass={serifFontClass} onChange={setSaveAsGlobal}>
                <GlobalFormFields
                  name={globalName}
                  description={globalDescription}
                  nameLabel={t("worldBook.globalName")}
                  namePlaceholder={t("worldBook.enterGlobalWorldBookName")}
                  descriptionLabel={t("worldBook.description")}
                  descriptionPlaceholder={t("worldBook.enterDescriptionForThisGlobalWorldBook")}
                  serifFontClass={serifFontClass}
                  onNameChange={setGlobalName}
                  onDescriptionChange={setGlobalDescription}
                />
              </SaveAsGlobalCheckbox>
            </div>
          ) : (
            <GlobalItemSelector
              items={globalWorldBooks.map(mapToGlobalItem)}
              selectedId={selectedGlobalId}
              isLoading={isLoadingGlobal}
              deletingId={deletingId}
              emptyTitle={t("worldBook.noGlobalWorldBooks")}
              emptyHint={t("worldBook.createGlobalWorldBookFirst")}
              selectLabel={t("worldBook.selectGlobalWorldBook")}
              loadingText={t("worldBook.loading")}
              deleteTitle={t("worldBook.deleteGlobalWorldBook")}
              serifFontClass={serifFontClass}
              onSelect={setSelectedGlobalId}
              onDelete={handleDeleteGlobal}
            />
          )}

          {importResult && (
            <ImportResultDisplay
              result={importResult}
              title={t("worldBook.importResults")}
              importedLabel={t("worldBook.importedEntries")}
              skippedLabel={t("worldBook.skippedEntries")}
              errorsLabel={t("worldBook.importErrors")}
              serifFontClass={serifFontClass}
            />
          )}
        </div>

        <ImportModalFooter
          activeTab={activeTab}
          isImporting={isImporting}
          canImport={!!selectedGlobalId}
          cancelLabel={t("common.cancel")}
          importingLabel={t("worldBook.importing")}
          importLabel={t("worldBook.importFromGlobal")}
          serifFontClass={serifFontClass}
          onClose={handleClose}
          onImport={handleImportFromGlobal}
        />
      </div>

      <Toast isVisible={errorToast.isVisible} message={errorToast.message} onClose={hideError} type="error" />
    </div>
  );
}
