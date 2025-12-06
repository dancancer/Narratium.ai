/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         WorldBookEditor                                    ║
 * ║  世界书编辑：列表/排序/筛选/展开 + 条目编辑/导入                             ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-hot-toast";
import "@/app/styles/fantasy-ui.css";
import { useLanguage } from "@/app/i18n";
import WorldBookEntryEditor from "@/components/WorldBookEntryEditor";
import ImportWorldBookModal from "@/components/ImportWorldBookModal";
import { Toast as ErrorToast } from "@/components/Toast";
import { getWorldBookEntries } from "@/function/worldbook/info";
import { deleteWorldBookEntry } from "@/function/worldbook/delete";
import { saveAdvancedWorldBookEntry } from "@/function/worldbook/edit";
import { bulkToggleWorldBookEntries } from "@/function/worldbook/bulk-operations";
import { useTableSort, sortItems } from "@/hooks/useTableSort";
import { useTableFilter, filterItems } from "@/hooks/useTableFilter";
import { useRowExpansion } from "@/hooks/useRowExpansion";
import { useErrorToast } from "@/hooks/useErrorToast";
import {
  WorldBookHeader,
  WorldBookControls,
  WorldBookTable,
  WorldBookEntryData,
  EditingEntry,
} from "@/components/worldbook-editor";

interface WorldBookEditorProps {
  onClose: () => void;
  characterName: string;
  characterId: string;
}

export default function WorldBookEditor({ onClose, characterName, characterId }: WorldBookEditorProps) {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [entries, setEntries] = useState<WorldBookEntryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const { sortBy, sortOrder, handleSortByChange, handleSortOrderToggle } = useTableSort({
    storageKey: `worldbook_sort_${characterId}`,
    defaultSortBy: "position",
    defaultSortOrder: "asc",
  });
  const { filterBy, handleFilterChange } = useTableFilter({
    storageKey: `worldbook_filter_${characterId}`,
    defaultFilter: "all",
  });
  const { expandedRows, toggleRow, setExpandedRows } = useRowExpansion();
  const { toast: errorToast, showToast: showErrorToast, hideToast: hideErrorToast } = useErrorToast();

  const sortComparators = useMemo(
    () => ({
      position: (a: WorldBookEntryData, b: WorldBookEntryData) => Number(a.position ?? 4) - Number(b.position ?? 4),
      priority: (a: WorldBookEntryData, b: WorldBookEntryData) => a.insertion_order - b.insertion_order,
      characterCount: (a: WorldBookEntryData, b: WorldBookEntryData) => a.contentLength - b.contentLength,
      keywords: (a: WorldBookEntryData, b: WorldBookEntryData) => a.keyCount - b.keyCount,
      comment: (a: WorldBookEntryData, b: WorldBookEntryData) => (a.comment || "").localeCompare(b.comment || ""),
      depth: (a: WorldBookEntryData, b: WorldBookEntryData) => a.depth - b.depth,
      lastUpdated: (a: WorldBookEntryData, b: WorldBookEntryData) => a.lastUpdated - b.lastUpdated,
    }),
    [],
  );

  const filterMap = useMemo(
    () => ({
      all: () => true,
      enabled: (entry: WorldBookEntryData) => entry.isActive,
      disabled: (entry: WorldBookEntryData) => !entry.isActive,
      constant: (entry: WorldBookEntryData) => entry.constant,
      imported: (entry: WorldBookEntryData) => entry.isImported,
    }),
    [],
  );

  const formatEntry = useCallback(
    (entry: any): WorldBookEntryData => {
      const extensions = entry.extensions || {};
      const keys = entry.keys || [];
      const secondaryKeys = entry.secondary_keys || [];
      const updated = extensions.updatedAt || entry.updated_at || entry.created_at || Date.now();
      return {
        ...entry,
        keys,
        secondary_keys: secondaryKeys,
        primaryKey: keys[0] || t("worldBook.noKeyword"),
        keyCount: keys.length,
        secondaryKeyCount: secondaryKeys.length,
        contentLength: (entry.content || "").length,
        isActive: entry.enabled !== false,
        lastUpdated: typeof updated === "number" ? updated : new Date(updated).getTime(),
        isImported: Boolean(extensions.importedAt),
        importedAt: extensions.importedAt || null,
      };
    },
    [t],
  );

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await getWorldBookEntries(characterId);
      if (result.success) {
        setEntries((result.entries || []).map(formatEntry));
      } else {
        showErrorToast(t("worldBook.loadingFailed") || "Failed to load entries");
      }
    } catch (error) {
      console.error("Failed to load world book entries:", error);
      showErrorToast(t("worldBook.loadingFailed") || "Failed to load entries");
    } finally {
      setIsLoading(false);
    }
  }, [characterId, formatEntry, showErrorToast, t]);

  const handleEditEntry = useCallback(
    (entry?: WorldBookEntryData) => {
      if (entry) {
        setEditingEntry({
          entry_id: entry.entry_id,
          id: entry.id,
          comment: entry.comment || "",
          keys: entry.keys || [],
          secondary_keys: entry.secondary_keys || [],
          content: entry.content || "",
          position: Number(entry.position ?? 4),
          depth: entry.depth || 1,
          enabled: entry.enabled !== false,
          use_regex: entry.use_regex || false,
          selective: entry.selective || false,
          constant: entry.constant || false,
          insertion_order: entry.insertion_order || 0,
        });
      } else {
        setEditingEntry({
          entry_id: `entry_${uuidv4()}`,
          id: entries.length + 1,
          comment: "",
          keys: [""],
          secondary_keys: [],
          content: "",
          position: 4,
          depth: 1,
          enabled: true,
          use_regex: false,
          selective: false,
          constant: false,
          insertion_order: 0,
        });
      }
      setIsEditModalOpen(true);
    },
    [entries.length],
  );

  const handleSaveEntry = useCallback(async () => {
    if (!editingEntry) return;
    if (!editingEntry.content.trim()) {
      showErrorToast(t("worldBook.contentRequired") || "Content is required");
      return;
    }

    setIsSaving(true);
    try {
      await saveAdvancedWorldBookEntry(characterId, {
        entry_id: editingEntry.entry_id,
        content: editingEntry.content,
        keys: editingEntry.keys.filter((k) => k.trim()),
        secondary_keys: editingEntry.secondary_keys.filter((k) => k.trim()),
        comment: editingEntry.comment,
        position: editingEntry.position,
        depth: editingEntry.depth,
        enabled: editingEntry.enabled,
        use_regex: editingEntry.use_regex,
        selective: editingEntry.selective,
        constant: editingEntry.constant,
        insertion_order: editingEntry.insertion_order,
      });
      toast.success(t("worldBook.saveSuccess") || "Saved");
      setIsEditModalOpen(false);
      setEditingEntry(null);
      await loadEntries();
    } catch (error) {
      console.error("Save failed:", error);
      showErrorToast(t("worldBook.saveFailed") || "Failed to save entry");
    } finally {
      setIsSaving(false);
    }
  }, [characterId, editingEntry, loadEntries, showErrorToast, t]);

  const handleDeleteEntry = useCallback(
    async (entryId: string) => {
      try {
        const result = await deleteWorldBookEntry(characterId, entryId);
        if (result.success) {
          toast.success(t("worldBook.deleteSuccess"));
          setEntries((prev) => prev.filter((entry) => entry.entry_id !== entryId));
          setExpandedRows((prev) => {
            const next = new Set(prev);
            next.delete(entryId);
            return next;
          });
        }
      } catch (error) {
        console.error("Delete failed:", error);
        showErrorToast(t("worldBook.deleteFailed") || "Failed to delete entry");
      }
    },
    [characterId, setExpandedRows, showErrorToast, t],
  );

  const handleToggleEntry = useCallback(
    async (entryId: string, enabled: boolean) => {
      setEntries((prev) => prev.map((entry) => (entry.entry_id === entryId ? { ...entry, isActive: enabled, enabled } : entry)));
      try {
        const result = await bulkToggleWorldBookEntries(characterId, [entryId], enabled);
        if (result.success) {
          toast.success(enabled ? t("worldBook.enabled") : t("worldBook.disabled"));
          await loadEntries();
        } else {
          setEntries((prev) => prev.map((entry) => (entry.entry_id === entryId ? { ...entry, isActive: !enabled, enabled: !enabled } : entry)));
          showErrorToast(t("worldBook.toggleFailed") || "Failed to toggle entry");
        }
      } catch (error) {
        setEntries((prev) => prev.map((entry) => (entry.entry_id === entryId ? { ...entry, isActive: !enabled, enabled: !enabled } : entry)));
        console.error("Toggle failed:", error);
        showErrorToast(t("worldBook.toggleFailed") || "Failed to toggle entry");
      }
    },
    [characterId, loadEntries, showErrorToast, t],
  );

  const handleBulkToggle = useCallback(
    async (enabled: boolean) => {
      const entryIds = filterItems(entries, filterBy, filterMap).map((entry) => entry.entry_id);
      if (entryIds.length === 0) {
        showErrorToast(t("worldBook.noEntries") || "No entries selected");
        return;
      }

      setEntries((prev) =>
        prev.map((entry) => (entryIds.includes(entry.entry_id) ? { ...entry, isActive: enabled, enabled } : entry)),
      );

      try {
        const result = await bulkToggleWorldBookEntries(characterId, entryIds, enabled);
        if (result.success) {
          toast.success(enabled ? t("worldBook.enabledAll") : t("worldBook.disabledAll"));
          await loadEntries();
        } else {
          setEntries((prev) =>
            prev.map((entry) => (entryIds.includes(entry.entry_id) ? { ...entry, isActive: !enabled, enabled: !enabled } : entry)),
          );
          showErrorToast(t("worldBook.bulkOperationFailed") || "Bulk operation failed");
        }
      } catch (error) {
        setEntries((prev) =>
          prev.map((entry) => (entryIds.includes(entry.entry_id) ? { ...entry, isActive: !enabled, enabled: !enabled } : entry)),
        );
        console.error("Bulk toggle failed:", error);
        showErrorToast(t("worldBook.bulkOperationFailed") || "Bulk operation failed");
      }
    },
    [characterId, entries, filterBy, filterMap, loadEntries, showErrorToast, t],
  );

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const filteredEntries = filterItems(entries, filterBy, filterMap);
  const sortedEntries = sortItems(filteredEntries, sortBy, sortOrder, sortComparators);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center breathing-bg">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-2 border-t-amber-bright border-r-amber-soft border-b-ink-soft border-l-transparent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-2 border-t-ink-soft border-r-amber-bright border-b-amber-soft border-l-transparent animate-spin-slow"></div>
          </div>
          <p className="mt-4 text-amber-soft magical-text">{t("worldBook.loading")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col breathing-bg text-cream-soft">
      <WorldBookHeader
        characterName={characterName}
        entries={entries}
        filteredCount={filteredEntries.length}
        filterBy={filterBy}
        fontClass={fontClass}
        serifFontClass={serifFontClass}
        t={t}
        onClose={onClose}
      />

      <WorldBookControls
        sortBy={sortBy}
        sortOrder={sortOrder}
        filterBy={filterBy}
        canBulk={filteredEntries.length > 0}
        onCreate={() => handleEditEntry()}
        onImport={() => setIsImportModalOpen(true)}
        onSortByChange={handleSortByChange}
        onSortOrderToggle={handleSortOrderToggle}
        onFilterChange={handleFilterChange}
        onBulkToggle={handleBulkToggle}
        fontClass={fontClass}
        serifFontClass={serifFontClass}
        t={t}
      />

      <WorldBookTable
        entries={sortedEntries}
        expandedRows={expandedRows}
        fontClass={fontClass}
        serifFontClass={serifFontClass}
        t={t}
        onToggleRow={toggleRow}
        onToggleEntry={handleToggleEntry}
        onEdit={(entry) => handleEditEntry(entry)}
        onDelete={handleDeleteEntry}
      />

      {errorToast.isVisible && (
        <ErrorToast
          message={errorToast.message}
          isVisible={errorToast.isVisible}
          onClose={hideErrorToast}
          type="error"
        />
      )}

      {isImportModalOpen && (
        <ImportWorldBookModal
          isOpen={isImportModalOpen}
          characterId={characterId}
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={() => {
            setIsImportModalOpen(false);
            loadEntries();
          }}
        />
      )}

      <WorldBookEntryEditor
        isOpen={isEditModalOpen}
        editingEntry={editingEntry}
        isSaving={isSaving}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        onEntryChange={(entry) => setEditingEntry(entry)}
      />
    </div>
  );
}
