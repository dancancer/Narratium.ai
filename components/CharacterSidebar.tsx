/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                     Character Sidebar Component                           ║
 * ║                                                                           ║
 * ║  角色侧边栏 - 导航、信息、预设、设置的统一入口                                   ║
 * ║  职责：组合子组件，不包含具体业务逻辑                                           ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

import React, { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/app/i18n";
import { trackButtonClick } from "@/utils/google-analytics";
import { CharacterAvatarBackground } from "@/components/CharacterAvatarBackground";
import DialogueTreeModal from "@/components/DialogueTreeModal";
import AdvancedSettingsEditor from "@/components/AdvancedSettingsEditor";
import PresetInfoModal from "@/components/PresetInfoModal";

/* ─── 子组件 & Hooks ─── */
import {
  SidebarMenuItem,
  ResponseLengthSlider,
  PresetDropdown,
} from "@/components/character-sidebar";
import { usePresetManager } from "@/hooks/usePresetManager";
import { useResponseLength } from "@/hooks/useResponseLength";
import { useMobileDetection } from "@/hooks/useMobileDetection";

/* ─────────────────────────────────────────────────────────────────────────────
 * 类型定义
 * ───────────────────────────────────────────────────────────────────────────── */

interface CharacterSidebarProps {
  character: {
    id: string;
    name: string;
    personality?: string;
    avatar_path?: string;
    scenario?: string;
  };
  isCollapsed: boolean;
  toggleSidebar: () => void;
  onDialogueEdit?: () => void;
  onViewSwitch?: () => void;
}

/* ─────────────────────────────────────────────────────────────────────────────
 * SVG 图标组件 - 集中管理，避免内联重复
 * ───────────────────────────────────────────────────────────────────────────── */

const Icons = {
  Spinner: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 50 50">
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.2" />
      <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="1, 150">
        <animateTransform attributeName="transform" type="rotate" from="0 25 25" to="360 25 25" dur="1s" repeatCount="indefinite" />
      </circle>
    </svg>
  ),
  ArrowLeft: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Activity: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  ),
  Edit: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Github: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  ),
  Settings: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  ),
  Close: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  User: () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="md:w-6 md:h-6">
      <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
};

/* ─────────────────────────────────────────────────────────────────────────────
 * Section Header 组件 - 区块标题
 * ───────────────────────────────────────────────────────────────────────────── */

const SectionHeader: React.FC<{ label: string; isCollapsed: boolean }> = ({ label, isCollapsed }) => (
  <div className={`px-2 py-1 flex justify-between items-center text-xs text-text-muted uppercase tracking-wider font-medium text-3xs md:text-2xs transition-all duration-300 ease-in-out overflow-hidden mx-4 ${isCollapsed ? "opacity-0" : "opacity-100"}`}>
    <span>{label}</span>
  </div>
);

const Divider: React.FC = () => <div className="mx-4 menu-divider my-2" />;

/* ─────────────────────────────────────────────────────────────────────────────
 * 主组件
 * ───────────────────────────────────────────────────────────────────────────── */

const CharacterSidebar: React.FC<CharacterSidebarProps> = ({
  character,
  isCollapsed,
  toggleSidebar,
  onDialogueEdit,
  onViewSwitch,
}) => {
  const { t, fontClass, serifFontClass, language } = useLanguage();
  const { isMobile } = useMobileDetection();

  /* ─── 模态框状态 ─── */
  const [showDialogueTreeModal, setShowDialogueTreeModal] = useState(false);
  const [isAdvancedSettingsOpen, setIsAdvancedSettingsOpen] = useState(false);
  const [showPresetInfoModal, setShowPresetInfoModal] = useState(false);
  const [selectedPresetForInfo, setSelectedPresetForInfo] = useState("");

  /* ─── 提取的 Hooks ─── */
  const presetManager = usePresetManager({ language: language as "zh" | "en" });
  const responseLength = useResponseLength();

  /* ─── 事件处理 ─── */
  const handleOpenPromptEditor = () => {
    trackButtonClick("CharacterSidebar", "切换到预设编辑器");
    window.dispatchEvent(
      new CustomEvent("switchToPresetView", { detail: { characterId: character.id } }),
    );
  };

  const handleToggleSidebar = () => {
    trackButtonClick("CharacterSidebar", "切换角色侧边栏");
    toggleSidebar();
  };

  const handleShowPresetInfo = (presetName: string) => {
    setSelectedPresetForInfo(presetName);
    setShowPresetInfoModal(true);
  };

  /* ─── 截断文本的工具函数 ─── */
  const truncate = (text: string | undefined, limit: number) => {
    if (!text) return "";
    return text.length > limit ? `${text.substring(0, limit)}...` : text;
  };

  const nameLimit = isMobile ? 15 : 20;
  const personalityLimit = isMobile ? 20 : 25;

  /* ─────────────────────────────────────────────────────────────────────────────
   * 渲染
   * ───────────────────────────────────────────────────────────────────────────── */

  return (
    <>
      {/* 移动端遮罩 */}
      {isMobile && !isCollapsed && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40" />
      )}

      <div
        className={`${
          isCollapsed
            ? "w-0 p-0 opacity-0 breathing-bg"
            : isMobile
              ? "fixed inset-0 z-50 w-full text-xs leading-tight breathing-bg"
              : "w-[18rem] text-sm leading-normal breathing-bg"
        } relative overflow-hidden border-r border-ink h-full flex flex-col magic-border transition-all duration-300 ease-in-out`}
      >
        {/* 移动端关闭按钮 */}
        {isMobile && !isCollapsed && (
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={() => { trackButtonClick("CharacterSidebar", "移动端关闭侧边栏"); toggleSidebar(); }}
              className="w-8 h-8 flex items-center justify-center text-cream bg-surface rounded-full border border-stroke shadow-inner transition-all duration-300 hover:bg-muted-surface hover:border-stroke-strong hover:text-amber-400 hover:shadow-[0_0_8px_rgba(251,146,60,0.4)]"
            >
              <Icons.Close />
            </button>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
         * 导航区
         * ═══════════════════════════════════════════════════════════════════════ */}
        <SectionHeader label={t("characterChat.navigation")} isCollapsed={isCollapsed} />
        <div className="transition-all duration-300 ease-in-out px-6 max-h-[500px] opacity-100 mt-4">
          <div className="space-y-1 my-2">
            <SidebarMenuItem
              icon={<Icons.Spinner />}
              label={t("characterChat.backToCharacters")}
              href="/character-cards"
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              fontClass={fontClass}
            />
            <SidebarMenuItem
              icon={<Icons.ArrowLeft />}
              label={t("characterChat.collapseSidebar")}
              onClick={handleToggleSidebar}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              fontClass={fontClass}
            />
          </div>
        </div>

        <Divider />

        {/* ═══════════════════════════════════════════════════════════════════════
         * 角色信息区
         * ═══════════════════════════════════════════════════════════════════════ */}
        <SectionHeader label={t("characterChat.characterInfo")} isCollapsed={isCollapsed} />
        {!isCollapsed && (
          <div className="transition-all duration-300 ease-in-out px-6 max-h-[500px] opacity-100">
            <div className="space-y-1 my-2">
              <div className="menu-item flex p-2 rounded-md hover:bg-muted-surface overflow-hidden transition-all duration-300 group">
                <div className="w-10 h-10 md:w-12 md:h-12 flex-shrink-0 mr-3 flex items-center justify-center text-cream bg-surface rounded-lg border border-stroke shadow-inner transition-all duration-300 group-hover:border-stroke-strong group-hover:text-amber-400 group-hover:shadow-[0_0_8px_rgba(251,146,60,0.4)]">
                  {character.avatar_path ? (
                    <CharacterAvatarBackground avatarPath={character.avatar_path} />
                  ) : (
                    <Icons.User />
                  )}
                </div>
                <div className="flex flex-col justify-center">
                  <span className={`magical-text whitespace-nowrap overflow-hidden text-ellipsis block text-xs md:text-sm text-cream group-hover:text-amber-400 transition-colors duration-300 ${serifFontClass}`}>
                    {truncate(character.name, nameLimit)}
                  </span>
                  <p className={`text-ink-soft text-2xs md:text-xs ${fontClass} whitespace-nowrap overflow-hidden text-ellipsis mt-1`}>
                    {character.personality
                      ? truncate(character.personality, personalityLimit)
                      : t("characterChat.noPersonality")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <Divider />

        {/* ═══════════════════════════════════════════════════════════════════════
         * 操作区
         * ═══════════════════════════════════════════════════════════════════════ */}
        <SectionHeader label={t("characterChat.actions")} isCollapsed={isCollapsed} />
        <div className="transition-all duration-300 ease-in-out px-6 max-h-[500px] opacity-100">
          <div className="space-y-1 my-2">
            <SidebarMenuItem
              icon={<Icons.Activity />}
              label={t("characterChat.Conversation")}
              onClick={() => setShowDialogueTreeModal(true)}
              isCollapsed={isCollapsed}
              isMobile={isMobile}
              fontClass={fontClass}
            />
          </div>
        </div>

        <Divider />

        {/* ═══════════════════════════════════════════════════════════════════════
         * 预设区
         * ═══════════════════════════════════════════════════════════════════════ */}
        {!isCollapsed && (
          <>
            <SectionHeader label={t("characterChat.presets") || "预设"} isCollapsed={false} />
            <div className="space-y-1">
              <div className="mx-6">
                <SidebarMenuItem
                  icon={<Icons.Edit />}
                  label={t("characterChat.presetEditor")}
                  onClick={handleOpenPromptEditor}
                  isMobile={isMobile}
                  fontClass={fontClass}
                />
              </div>
              <div className="relative mx-6">
                <SidebarMenuItem
                  icon={<Icons.Github />}
                  label={t("characterChat.systemPresets")}
                  onClick={presetManager.toggleDropdown}
                  isMobile={isMobile}
                  fontClass={fontClass}
                  accentColor="purple"
                  isActive={presetManager.isDropdownOpen}
                  suffix={
                    <div className="flex items-center justify-center ml-2">
                      <div className={`transition-transform duration-300 ${presetManager.isDropdownOpen ? "rotate-180" : ""}`}>
                        <Icons.ChevronDown />
                      </div>
                    </div>
                  }
                />
                {presetManager.isDropdownOpen && (
                  <PresetDropdown
                    presets={presetManager.presets}
                    selectedPreset={presetManager.selectedPreset}
                    language={language as "zh" | "en"}
                    fontClass={fontClass}
                    onSelect={presetManager.selectPreset}
                    onShowInfo={handleShowPresetInfo}
                    emptyText={t("characterChat.noPresets") || "没有可用的预设"}
                  />
                )}
              </div>
            </div>
            <Divider />
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
         * 高级设置区
         * ═══════════════════════════════════════════════════════════════════════ */}
        <SectionHeader label={t("characterChat.advancedSettings")} isCollapsed={isCollapsed} />
        {!isCollapsed && (
          <div className="transition-all duration-300 ease-in-out px-6 max-h-[500px] opacity-100">
            <div className="space-y-1 my-2">
              <SidebarMenuItem
                icon={<Icons.Settings />}
                label={t("characterChat.advancedSettings")}
                onClick={() => { trackButtonClick("CharacterSidebar", "打开高级设置"); setIsAdvancedSettingsOpen(true); }}
                isMobile={isMobile}
                fontClass={fontClass}
                accentColor="blue"
              />
            </div>
          </div>
        )}

        <Divider />

        {/* ═══════════════════════════════════════════════════════════════════════
         * 响应长度区
         * ═══════════════════════════════════════════════════════════════════════ */}
        <SectionHeader label={t("characterChat.responseLength")} isCollapsed={isCollapsed} />
        {!isCollapsed && (
          <div className="transition-all duration-300 ease-in-out px-6 max-h-[500px] opacity-100">
            <ResponseLengthSlider
              value={responseLength.length}
              min={responseLength.min}
              max={responseLength.max}
              percentage={responseLength.percentage}
              onChange={responseLength.handleChange}
              fontClass={fontClass}
            />
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
       * 模态框
       * ═══════════════════════════════════════════════════════════════════════ */}
      <DialogueTreeModal
        isOpen={showDialogueTreeModal}
        onClose={() => setShowDialogueTreeModal(false)}
        characterId={character.id}
        onDialogueEdit={onDialogueEdit}
      />
      <AdvancedSettingsEditor
        isOpen={isAdvancedSettingsOpen}
        onClose={() => setIsAdvancedSettingsOpen(false)}
        onViewSwitch={onViewSwitch}
      />
      <PresetInfoModal
        isOpen={showPresetInfoModal}
        onClose={() => setShowPresetInfoModal(false)}
        presetName={selectedPresetForInfo}
      />
    </>
  );
};

export default CharacterSidebar;
