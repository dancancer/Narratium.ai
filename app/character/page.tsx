/**
 * ╔═══════════════════════════════════════════════════════════════════════════╗
 * ║                         Character Page Component                           ║
 * ║                                                                            ║
 * ║  角色交互页面：聊天、世界书、正则脚本、预设管理                               ║
 * ║  状态管理：Zustand Store 统一管理视图切换（单一数据源）                      ║
 * ║  使用 Hooks：useCharacterDialogue, useCharacterLoader                      ║
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
import { toast } from "@/lib/store/toast-store";
import LoginModal from "@/components/LoginModal";
import { useAuth } from "@/hooks/useAuth";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";

// ============================================================================
//                              自定义 Hooks
// ============================================================================

import { useCharacterDialogue } from "@/hooks/useCharacterDialogue";
import { useCharacterLoader } from "@/hooks/useCharacterLoader";
import { useMobileDetection } from "@/hooks/useMobileDetection";
import { useUIStore } from "@/lib/store/ui-store";
import { useUserStore } from "@/lib/store/user-store";

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
  
  // ========== Zustand Store - 单一数据源 ==========
  const characterView = useUIStore((state) => state.characterView);
  const setCharacterView = useUIStore((state) => state.setCharacterView);
  const presetViewPayload = useUIStore((state) => state.presetViewPayload);
  const resetPresetViewPayload = useUIStore((state) => state.resetPresetViewPayload);
  const characterSidebarOpen = useUIStore((state) => state.characterSidebarOpen);
  const setCharacterSidebarOpen = useUIStore((state) => state.setCharacterSidebarOpen);
  const setModelSidebarOpen = useUIStore((state) => state.setModelSidebarOpen);
  const displayUsername = useUserStore((state) => state.displayUsername);

  // ========== 对话 Hook ==========
  const dialogue = useCharacterDialogue({
    characterId,
    onError: toast.error,
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
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [activeModes, setActiveModes] = useState<Record<string, any>>({
    "story-progress": false,
    perspective: { active: false, mode: "novel" },
    "scene-setting": false,
  });

  // 派生状态：直接从 Store 计算，消除冗余
  const sidebarCollapsed = !characterSidebarOpen;

  // ═══════════════════════════════════════════════════════════════
  // 同步加载数据到对话状态
  // 
  // 【设计说明】为什么不依赖 setMessages 和 setSuggestedInputs？
  // 1. React 保证 setState 函数引用永久稳定（不会重建）
  // 2. 我们的意图是"当 dialogueData 变化时同步"，而不是"当 setter 变化时"
  // 3. 这是 React 官方推荐的"派生状态同步"模式
  // 4. 添加 setter 到依赖数组不会改变行为，只会增加噪音
  // 
  // 参考：https://react.dev/reference/react/useState#setstate-caveats
  // ═══════════════════════════════════════════════════════════════
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

  // ========== 监听 Store 变化 ==========

  // 处理预设视图的 payload
  useEffect(() => {
    if (presetViewPayload && characterView === "preset") {
      if (presetViewPayload.presetId) {
        sessionStorage.setItem("activate_preset_id", presetViewPayload.presetId);
      } else if (presetViewPayload.presetName) {
        sessionStorage.setItem("activate_preset_name", presetViewPayload.presetName);
      }
      resetPresetViewPayload();
    }
  }, [presetViewPayload, characterView, resetPresetViewPayload]);

  // ═══════════════════════════════════════════════════════════════
  // 响应用户名变化，重新加载对话
  // 
  // 【修复】只依赖 displayUsername 和 characterId
  // - dialogue.fetchLatestDialogue 是稳定的函数引用（useCallback）
  // - 不应该依赖整个 dialogue 对象，会导致无限循环
  // - 只在用户名或角色 ID 变化时重新加载
  // ═══════════════════════════════════════════════════════════════
  useEffect(() => {
    if (characterId) {
      dialogue.fetchLatestDialogue();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayUsername, characterId]);

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
    const willBeOpen = !characterSidebarOpen;
    setCharacterSidebarOpen(willBeOpen);

    // 移动端：打开角色侧边栏时关闭模型侧边栏
    if (isMobile && willBeOpen) {
      setModelSidebarOpen(false);
    }
  }, [characterSidebarOpen, isMobile, setCharacterSidebarOpen, setModelSidebarOpen]);

  // ========== 渲染：加载状态 ==========
  if (loader.isLoading || loader.isInitializing) {
    return (
      <div className="flex flex-col justify-center items-center h-full ">
        <div className="relative w-12 h-12 flex items-center justify-center mb-4">
          <div className="absolute inset-0 rounded-full border-2 border-t-primary-bright border-r-primary-soft border-b-ink-soft border-l-transparent animate-spin"></div>
          <div className="absolute inset-2 rounded-full border-2 border-t-ink-soft border-r-primary-bright border-b-primary-soft border-l-transparent animate-spin-slow"></div>
        </div>
        <p className={"text-cream  text-center mb-2"}>
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
      <div className="flex flex-col items-center justify-center h-full ">
        <h1 className="text-2xl text-cream mb-4">{t("characterChat.error")}</h1>
        <p className="text-primary-soft mb-6">
          {loader.error || t("characterChat.characterNotFound")}
        </p>
        <a
          href="/character-cards"
          className="bg-muted-surface hover:bg-muted-surface text-cream font-medium py-2 px-4 rounded border border-border"
        >
          {t("characterChat.backToCharacters")}
        </a>
      </div>
    );
  }

  // ========== 渲染：主界面 ==========
  return (
    <div className="flex h-full relative  overflow-hidden [left:var(--app-sidebar-width,0)]">
      {/* 侧边栏容器：固定宽度，内部元素通过 transform 滑动 */}
      <div className={`${isMobile ? "" : sidebarCollapsed ? "w-0" : "w-[18rem]"} flex-shrink-0 transition-[width] duration-300 ease-out`}>
        <CharacterSidebar
          character={loader.character}
          isCollapsed={sidebarCollapsed}
          toggleSidebar={toggleSidebar}
          onDialogueEdit={() => dialogue.fetchLatestDialogue()}
          onViewSwitch={() => {
            setCharacterView("worldbook");
            setTimeout(() => setCharacterView("chat"), 1000);
          }}
        />
      </div>

      {/* 主内容区：flex-1 自动填充剩余空间 */}
      <div className="flex-1  h-full flex flex-col min-w-0">
        <CharacterChatHeader
          character={loader.character}
          serifFontClass={serifFontClass}
          sidebarCollapsed={sidebarCollapsed}
          activeView={characterView}
          toggleSidebar={toggleSidebar}
        />

        {characterView === "chat" ? (
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
        ) : characterView === "worldbook" ? (
          <WorldBookEditor
            onClose={() => setCharacterView("chat")}
            characterName={loader.character?.name || ""}
            characterId={characterId || ""}
          />
        ) : characterView === "preset" ? (
          <PresetEditor
            onClose={() => setCharacterView("chat")}
            characterName={loader.character?.name || ""}
            characterId={characterId || ""}
          />
        ) : (
          <RegexScriptEditor
            onClose={() => setCharacterView("chat")}
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
}
