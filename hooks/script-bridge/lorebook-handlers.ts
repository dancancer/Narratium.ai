/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Lorebook 兼容层 Handlers                           ║
 * ║                                                                            ║
 * ║  旧版 API 兼容，内部映射到 worldbook 操作                                    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { WorldBookOperations } from "@/lib/data/roleplay/world-book-operation";
import type { WorldBookEntry } from "@/lib/models/world-book-model";
import type { ApiHandlerMap } from "./types";

// ============================================================================
//                              Handler 实现
// ============================================================================

async function getEntries(args: unknown[]) {
  const [lorebook] = args as [string];
  if (!lorebook) return [];
  const wb = await WorldBookOperations.getWorldBook(lorebook);
  return wb ? Object.values(wb) : [];
}

async function replaceEntries(args: unknown[]) {
  const [lorebook, entries] = args as [string, WorldBookEntry[]];
  if (!lorebook) return false;
  return WorldBookOperations.updateWorldBook(lorebook, entries || []);
}

async function setEntries(args: unknown[]) {
  const [lorebook, entries] = args as [string, WorldBookEntry[]];
  if (!lorebook || !Array.isArray(entries)) return [];
  const current = (await WorldBookOperations.getWorldBook(lorebook)) || {};
  const createdIds: string[] = [];
  for (const entry of entries) {
    const entryId = `entry_${Object.keys(current).length + createdIds.length}`;
    current[entryId] = entry;
    createdIds.push(entryId);
  }
  await WorldBookOperations.updateWorldBook(lorebook, current);
  return createdIds;
}

async function createEntry(args: unknown[]) {
  const [lorebook, entry] = args as [string, WorldBookEntry];
  if (!lorebook || !entry) return null;
  return WorldBookOperations.addWorldBookEntry(lorebook, entry);
}

async function deleteEntries(args: unknown[]) {
  const [lorebook, entryIds] = args as [string, string[]];
  if (!lorebook || !Array.isArray(entryIds)) return false;
  const current = (await WorldBookOperations.getWorldBook(lorebook)) || {};
  entryIds.forEach((id) => delete current[id]);
  return WorldBookOperations.updateWorldBook(lorebook, current);
}

async function deleteEntry(args: unknown[]) {
  const [lorebook, entryId] = args as [string, string];
  if (!lorebook || !entryId) return false;
  return WorldBookOperations.deleteWorldBookEntry(lorebook, entryId);
}

async function getSettings(args: unknown[]) {
  const [lorebook] = args as [string];
  if (!lorebook) return null;
  return WorldBookOperations.getWorldBookSettings(lorebook);
}

// ============================================================================
//                              导出 Handler Map
// ============================================================================

export const lorebookHandlers: ApiHandlerMap = {
  "lorebook.getEntries": getEntries,
  "lorebook.replaceEntries": replaceEntries,
  "lorebook.setEntries": setEntries,
  "lorebook.createEntries": setEntries,
  "lorebook.createEntry": createEntry,
  "lorebook.deleteEntries": deleteEntries,
  "lorebook.deleteEntry": deleteEntry,
  "lorebook.getSettings": getSettings,
};
