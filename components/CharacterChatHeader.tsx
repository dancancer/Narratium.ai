/**
 * Character Chat Header Component
 *
 * This component provides the header interface for character chat interactions with the following features:
 * - Character avatar and name display
 * - View switching controls (chat, worldbook, regex, preset)
 * - Sidebar toggle functionality
 * - Responsive design with mobile adaptation
 * - Interactive button states and animations
 *
 * The component handles:
 * - Header layout and positioning
 * - View navigation controls
 * - Sidebar collapse/expand functionality
 * - Character information display
 * - Button interactions and tracking
 *
 * Dependencies:
 * - useLanguage: For internationalization
 * - CharacterAvatarBackground: For avatar display
 * - trackButtonClick: For analytics tracking
 */

"use client";

import { useState, useEffect } from "react";
import { ArrowRight, BookText, SlidersHorizontal, Regex, UserRound } from "lucide-react";
import { CharacterAvatarBackground } from "@/components/CharacterAvatarBackground";
import { trackButtonClick } from "@/utils/google-analytics";
import { useLanguage } from "@/app/i18n";
import { useUIStore } from "@/lib/store/ui-store";

/**
 * Interface definitions for the component's props
 */
interface Props {
  character: {
    name: string;
    avatar_path?: string;
  };
  serifFontClass: string;
  sidebarCollapsed: boolean;
  activeView: "chat" | "worldbook" | "regex" | "preset";
  toggleSidebar: () => void;
}

/**
 * Character chat header component
 *
 * Provides the main header interface for character interactions with:
 * - Character information display
 * - Navigation controls for different views
 * - Sidebar toggle functionality
 * - Responsive design adaptation
 *
 * @param {Props} props - Component props
 * @returns {JSX.Element} The character chat header interface
 */
export default function CharacterChatHeader({
  character,
  serifFontClass,
  sidebarCollapsed,
  activeView,
  toggleSidebar,
}: Props) {
  const { t, fontClass } = useLanguage();
  const setCharacterView = useUIStore((state) => state.setCharacterView);

  return (
    <div className="bg-deep border-b border-border p-4 flex items-center">
      {sidebarCollapsed && (
        <button
          onClick={() => {
            trackButtonClick("page", "切换侧边栏");
            toggleSidebar();
          }}
          className="relative group ml-3 mr-3 px-3 py-1.5 rounded-md bg-gradient-to-br from-overlay via-deep to-muted-surface border border-border/60 hover:border-stroke-strong transition-all duration-300 hover:scale-105 hover:  overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-primary-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>

          <div className="relative z-5 text-ink-soft group-hover:text-primary-300 transition-all duration-300 flex items-center justify-center cursor-pointer">
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5" />
            <span className={`ml-2 text-xs ${fontClass} group-hover:text-primary-300 transition-colors duration-300`}>
              {t("characterChat.expandSidebar")}
            </span>
          </div>

          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-primary-400 to-transparent group-hover:w-3/4 transition-all duration-500"></div>
        </button>
      )}

      <div className="flex flex-col md:flex-row md:items-center space-y-2 md:space-y-0 md:space-x-4 flex-1">
        <div className="flex items-center space-x-4">
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden">
            {character.avatar_path ? (
              <CharacterAvatarBackground avatarPath={character.avatar_path} />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-muted-surface">
                <UserRound className="h-4 w-4 md:h-5 md:w-5 text-ink" strokeWidth={1.5} />
              </div>
            )}
          </div>

          <h2
            className={"text-base md:text-lg text-cream-soft magical-text  truncate max-w-[120px] md:max-w-[200px]"}
          >
            {character.name}
          </h2>
        </div>

        <div className="flex flex-wrap gap-2 md:gap-0">
          <button
            onClick={() => {
              trackButtonClick("page", "切换世界书");
              setCharacterView(activeView === "worldbook" ? "chat" : "worldbook");
            }}
            data-tour="worldbook-button"
            className="group px-2 py-1.5 md:px-3 md:py-1 md:ml-2 flex items-center rounded-md border border-border transition-colors duration-200 bg-muted hover:bg-muted/80"
          >
            <div
              className="w-6 h-6 md:mr-2 flex items-center justify-center text-foreground"
            >
              <BookText className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <span className="font-medium text-sm transition-colors duration-200 hidden md:block text-foreground">
              {t("characterChat.worldBook")}
            </span>
          </button>

          <button
            onClick={() => {
              trackButtonClick("page", "切换正则编辑器");
              setCharacterView(activeView === "regex" ? "chat" : "regex");
            }}
            data-tour="regex-button"
            className="group px-2 py-1.5 md:px-3 md:py-1 md:ml-2 flex items-center rounded-md border border-border transition-colors duration-200 bg-muted hover:bg-muted/80"
          >
            <div
              className="w-6 h-6 md:mr-2 flex items-center justify-center text-foreground"
            >
              <Regex className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <span className="font-medium text-sm transition-colors duration-200 hidden md:block text-foreground">
              {t("characterChat.regex")}
            </span>
          </button>

          <button
            onClick={() => {
              trackButtonClick("page", "切换预设编辑器");
              setCharacterView(activeView === "preset" ? "chat" : "preset");
            }}
            data-tour="preset-button"
            className="group px-2 py-1.5 md:px-3 md:py-1 md:ml-2 flex items-center rounded-md border border-border transition-colors duration-200 bg-muted hover:bg-muted/80"
          >
            <div
              className="w-6 h-6 md:mr-2 flex items-center justify-center text-foreground"
            >
              <SlidersHorizontal className="h-5 w-5" strokeWidth={1.5} />
            </div>
            <span className="font-medium text-sm transition-colors duration-200 hidden md:block text-foreground">
              {t("characterChat.preset")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
