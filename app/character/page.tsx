/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Character Page Component                           ║
 * ║                                                                            ║
 * ║  角色交互页面：聊天、世界书、正则脚本、预设管理                               ║
 * ║  使用 Hooks：useCharacterDialogue, useCharacterLoader, useActiveView 等    ║
 * ╚═══════════════════════════════════════════════════════════════════════════╝
 */

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/app/i18n";
import CharacterSidebar from "@/components/CharacterSidebar";
import CharacterChatPanel from "@/components/CharacterChatPanel";
import WorldBookEditor from "@/components/WorldBookEditor";
import RegexScriptEditor from "@/components/RegexScriptEditor";
import PresetEditor from "@/components/PresetEditor";
import CharacterChatHeader from "@/components/CharacterChatHeader";
import UserTour from "@/components/UserTour";
import { useTour } from "@/hooks/useTour";
import { Toast } from "@/components/Toast";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";

// ============================================================================
//                              自定义 Hooks
// ============================================================================

import { useCharacterDialogue } from "@/hooks/useCharacterDialogue";
import { useCharacterLoader } from "@/hooks/useCharacterLoader";
import { useActiveView } from "@/hooks/useActiveView";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { useErrorToast } from "@/hooks/useErrorToast";

// ============================================================================
//                              主组件
// ============================================================================

export default function CharacterPage() {
  const searchParams = useSearchParams();
  const characterId = searchParams.get("id");
  const { t, fontClass, serifFontClass } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // ========== Tour Hook ==========
  const {
    isTourVisible,
    currentTourSteps,
    startCharacterTour,
    completeTour,
    skipTour,
  } = useTour();
  const { value: hasSeenCharacterTour, setValue: setHasSeenCharacterTour } =
    useLocalStorageBoolean("narratium_character_tour_completed", false);

  // ========== 自定义 Hooks ==========
  const { isMobile } = useMobileDetection();
  const { activeView, switchToView, toggleWorldBook, toggleRegexEditor, backToChat } = useActiveView();
  const { toast: errorToast, showToast: showErrorToast, hideToast: hideErrorToast } = useErrorToast();

  // ========== 对话 Hook ==========
  const dialogue = useCharacterDialogue({
    characterId,
    onError: showErrorToast,
    t,
  });

  // ========== 加载 Hook ==========
  const loader = useCharacterLoader({
    characterId,
    initializeNewDialogue: dialogue.initializeNewDialogue,
    t,
  });

  // ========== 业务状态 ==========
  const [userInput, setUserInput] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeModes, setActiveModes] = useState<Record<string, any>>({
    "story-progress": false,
    perspective: { active: false, mode: "novel" },
    "scene-setting": false,
  });

  // ========== 同步加载数据到对话状态 ==========
  useEffect(() => {
    if (loader.dialogueData) {
      dialogue.setMessages(loader.dialogueData.messages);
      dialogue.setSuggestedInputs(loader.dialogueData.suggestedInputs);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader.dialogueData]);

  // ========== Tour 触发 ==========
  useEffect(() => {
    if (loader.character && !loader.isLoading && !loader.isInitializing && !loader.error) {
      if (!hasSeenCharacterTour) {
        setTimeout(() => startCharacterTour(), 2000);
      }
    }
  }, [
    hasSeenCharacterTour,
    loader.character,
    loader.error,
    loader.isInitializing,
    loader.isLoading,
    startCharacterTour,
  ]);

  // ========== 事件监听 ==========
  useEffect(() => {
    const handleSwitchToPresetView = (event: any) => {
      switchToView("preset");
      const detail = event.detail;
      if (detail) {
        if (detail.presetId) {
          sessionStorage.setItem("activate_preset_id", detail.presetId);
        } else if (detail.presetName) {
          sessionStorage.setItem("activate_preset_name", detail.presetName);
        }
      }
    };

    const handleCloseCharacterSidebar = () => {
      setSidebarCollapsed(true);
    };

    const handleDisplayUsernameChanged = () => {
      if (characterId) {
        dialogue.fetchLatestDialogue();
      }
    };

    window.addEventListener("switchToPresetView", handleSwitchToPresetView);
    window.addEventListener("closeCharacterSidebar", handleCloseCharacterSidebar);
    window.addEventListener("displayUsernameChanged", handleDisplayUsernameChanged);

    return () => {
      window.removeEventListener("switchToPresetView", handleSwitchToPresetView);
      window.removeEventListener("closeCharacterSidebar", handleCloseCharacterSidebar);
      window.removeEventListener("displayUsernameChanged", handleDisplayUsernameChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId, switchToView]);

  // ========== 提交消息 ==========
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!userInput.trim() || dialogue.isSending) return;

      const hints: string[] = [];

      if (activeModes["story-progress"]) {
        hints.push(t("characterChat.storyProgressHint"));
      }
      if (activeModes["perspective"].active) {
        const hintKey =
          activeModes["perspective"].mode === "novel"
            ? "characterChat.novelPerspectiveHint"
            : "characterChat.protagonistPerspectiveHint";
        hints.push(t(hintKey));
      }
      if (activeModes["scene-setting"]) {
        hints.push(t("characterChat.sceneTransitionHint"));
      }

      let message: string;
      if (hints.length > 0) {
        message = `
      <input_message>
      ${t("characterChat.playerInput")}：${userInput}
      </input_message>
      <response_instructions>
      ${t("characterChat.responseInstructions")}：${hints.join(" ")}
      </response_instructions>
        `.trim();
      } else {
        message = `
      <input_message>
      ${t("characterChat.playerInput")}：${userInput}
      </input_message>
        `.trim();
      }

      setUserInput("");
      await dialogue.handleSendMessage(message);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userInput, dialogue.isSending, dialogue.handleSendMessage, activeModes, t],
  );

  // ========== 侧边栏切换 ==========
  const toggleSidebar = useCallback(() => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);

    if (isMobile && !newState) {
      window.dispatchEvent(new CustomEvent("closeModelSidebar"));
    }
  }, [sidebarCollapsed, isMobile]);

  // ========== 渲染：加载状态 ==========
  if (loader.isLoading || loader.isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center h-full fantasy-bg">
        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-t-amber-bright border-r-amber-soft border-b-ink-soft border-l-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-ink-soft border-r-amber-bright border-b-amber-soft border-l-transparent animate-spin-slow"></div>
        </div>
        <p className={`text-cream ${serifFontClass} text-center mb-2`}>
          {loader.loadingPhase}
        </p>
        {loader.isInitializing && (
          <p className={`text-ink-soft text-xs mt-4 max-w-xs text-center ${fontClass}`}>
            {t("characterChat.loadingTimeHint")}
          </p>
        )}
      </div>
    );
  }

  // ========== 渲染：错误状态 ==========
  if (loader.error || !loader.character) {
    return (
      <div className="flex flex-col items-center justify-center h-full fantasy-bg">
        <h1 className="text-2xl text-cream mb-4">{t("characterChat.error")}</h1>
        <p className="text-amber-soft mb-6">
          {loader.error || t("characterChat.characterNotFound")}
        </p>
        <a
          href="/character-cards"
          className="bg-muted-surface hover:bg-muted-surface text-cream font-medium py-2 px-4 rounded border border-ink"
        >
          {t("characterChat.backToCharacters")}
        </a>
      </div>
    );
  }

  // ========== 渲染：主界面 ==========
  return (
    <div className="flex h-full relative fantasy-bg overflow-hidden [left:var(--app-sidebar-width,0)]">
      <CharacterSidebar
        character={loader.character}
        isCollapsed={sidebarCollapsed}
        toggleSidebar={toggleSidebar}
        onDialogueEdit={() => dialogue.fetchLatestDialogue()}
        onViewSwitch={() => {
          switchToView("worldbook");
          setTimeout(() => switchToView("chat"), 1000);
        }}
      />

      <div
        className={`${sidebarCollapsed ? "w-full" : "hidden md:block md:w-3/4"} fantasy-bg h-full transition-all duration-300 ease-in-out flex flex-col`}
      >
        <CharacterChatHeader
          character={loader.character}
          serifFontClass={serifFontClass}
          sidebarCollapsed={sidebarCollapsed}
          activeView={activeView}
          toggleSidebar={toggleSidebar}
          onSwitchToView={switchToView}
          onToggleView={toggleWorldBook}
          onToggleRegexEditor={toggleRegexEditor}
        />

        {activeView === "chat" ? (
          <CharacterChatPanel
            character={loader.character}
            messages={dialogue.messages}
            openingMessages={dialogue.openingMessages}
            openingIndex={dialogue.openingIndex}
            openingLocked={dialogue.openingLocked}
            userInput={userInput}
            setUserInput={setUserInput}
            isSending={dialogue.isSending}
            suggestedInputs={dialogue.suggestedInputs}
            onSubmit={handleSubmit}
            onSuggestedInput={setUserInput}
            onTruncate={dialogue.truncateMessagesAfter}
            onRegenerate={dialogue.handleRegenerate}
            onOpeningNavigate={dialogue.handleOpeningNavigate}
            fontClass={fontClass}
            serifFontClass={serifFontClass}
            t={t}
            activeModes={activeModes}
            setActiveModes={setActiveModes}
          />
        ) : activeView === "worldbook" ? (
          <WorldBookEditor
            onClose={backToChat}
            characterName={loader.character?.name || ""}
            characterId={characterId || ""}
          />
        ) : activeView === "preset" ? (
          <PresetEditor
            onClose={backToChat}
            characterName={loader.character?.name || ""}
            characterId={characterId || ""}
          />
        ) : (
          <RegexScriptEditor
            onClose={backToChat}
            characterName={loader.character?.name || ""}
            characterId={characterId || ""}
          />
        )}
      </div>

      <UserTour
        steps={currentTourSteps}
        isVisible={isTourVisible}
        onComplete={() => {
          completeTour();
          setHasSeenCharacterTour(true);
        }}
        onSkip={() => {
          skipTour();
          setHasSeenCharacterTour(true);
        }}
      />

      <Toast
        type="error"
        message={errorToast.message}
        isVisible={errorToast.isVisible}
        onClose={hideErrorToast}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
