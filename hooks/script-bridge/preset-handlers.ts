/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         预设操作 Handlers                                  ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import { PresetOperations } from "@/lib/data/roleplay/preset-operation";
import { importPresetFromJson } from "@/function/preset/import";
import type { ApiHandlerMap } from "./types";

// ============================================================================
//                              查询操作
// ============================================================================

async function getPresetNames() {
  const presets = await PresetOperations.getAllPresets();
  return presets.map((p) => ({ id: p.id, name: p.name }));
}

async function getPreset(args: unknown[]) {
  const [presetId] = args as [string];
  if (!presetId) return null;
  return PresetOperations.getPreset(presetId);
}

async function getOrderedPrompts(args: unknown[]) {
  const [presetId] = args as [string];
  if (!presetId) return [];
  return PresetOperations.getPromptsOrderedForDisplay(presetId);
}

async function getLoadedPresetName() {
  const presets = await PresetOperations.getAllPresets();
  const active = presets.find((preset) => preset.enabled !== false);
  return active?.name || null;
}

// ============================================================================
//                              创建/更新操作
// ============================================================================

async function createPreset(args: unknown[]) {
  const [presetData] = args as [any];
  const payload = {
    name: presetData?.name || "New Preset",
    enabled: presetData?.enabled !== false,
    prompts: presetData?.prompts || [],
  };
  return PresetOperations.createPreset(payload as any);
}

async function updatePreset(args: unknown[]) {
  const [presetId, updates] = args as [string, any];
  if (!presetId) return false;
  return PresetOperations.updatePreset(presetId, updates || {});
}

async function createOrReplacePreset(args: unknown[]) {
  const [presetData] = args as [any];
  if (presetData?.id && (await PresetOperations.getPreset(presetData.id))) {
    await PresetOperations.updatePreset(presetData.id, presetData);
    return presetData.id;
  }
  return PresetOperations.createPreset(presetData as any);
}

async function renamePreset(args: unknown[]) {
  const [presetId, newName] = args as [string, string];
  if (!presetId || !newName) return false;
  return PresetOperations.updatePreset(presetId, { name: newName });
}

async function replacePreset(args: unknown[]) {
  const [presetId, newPreset] = args as [string, any];
  if (!presetId) return false;
  return PresetOperations.updatePreset(presetId, newPreset || {});
}

// ============================================================================
//                              删除/加载操作
// ============================================================================

async function deletePreset(args: unknown[]) {
  const [presetId] = args as [string];
  if (!presetId) return false;
  return PresetOperations.deletePreset(presetId);
}

async function loadPreset(args: unknown[]) {
  const [presetIdOrName] = args as [string];
  const presets = await PresetOperations.getPresets();
  const targetId =
    Object.keys(presets).find(
      (id) => id === presetIdOrName || presets[id]?.name === presetIdOrName
    ) || presetIdOrName;

  if (!presets[targetId]) return false;

  // 启用目标预设，禁用其他
  for (const id of Object.keys(presets)) {
    presets[id].enabled = id === targetId;
    presets[id].updated_at = new Date().toISOString();
  }
  await PresetOperations.updatePreset(targetId, { enabled: true });
  for (const id of Object.keys(presets)) {
    if (id !== targetId && presets[id].enabled !== false) {
      await PresetOperations.updatePreset(id, { enabled: false });
    }
  }
  return targetId;
}

// ============================================================================
//                              导入操作
// ============================================================================

async function importPreset(args: unknown[]) {
  const [jsonContent, customName] = args as [string | object, string?];
  const parsedJson =
    typeof jsonContent === "string" ? jsonContent : JSON.stringify(jsonContent || {});
  const result = await importPresetFromJson(parsedJson, customName);
  if (!result.success) {
    return { success: false, error: result.error || "Import failed" };
  }
  return { success: true, presetId: result.presetId };
}

// ============================================================================
//                              导出 Handler Map
// ============================================================================

export const presetHandlers: ApiHandlerMap = {
  "preset.getPresetNames": getPresetNames,
  "preset.getPreset": getPreset,
  "preset.createPreset": createPreset,
  "preset.deletePreset": deletePreset,
  "preset.updatePreset": updatePreset,
  "preset.loadPreset": loadPreset,
  "preset.getLoadedPresetName": getLoadedPresetName,
  "preset.createOrReplacePreset": createOrReplacePreset,
  "preset.renamePreset": renamePreset,
  "preset.replacePreset": replacePreset,
  "preset.updatePresetWith": updatePreset,
  "preset.setPreset": updatePreset,
  "preset.getOrderedPrompts": getOrderedPrompts,
  "preset.importPreset": importPreset,
};
