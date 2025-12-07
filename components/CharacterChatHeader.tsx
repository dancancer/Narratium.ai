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
import { ArrowRight, Eye, FileText, Layers, UserRound } from "lucide-react";
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
    <div className="bg-deep border-b border-ink p-4 flex items-center">
      {sidebarCollapsed && (
        <button
          onClick={() => {
            trackButtonClick("page", "切换侧边栏");
            toggleSidebar();
          }}
          className="relative group ml-3 mr-3 px-3 py-1.5 rounded-lg bg-gradient-to-br from-overlay via-deep to-muted-surface border border-ink/60 hover:border-stroke-strong transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20 overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>

          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse"></div>

          <div className="relative z-5 text-ink-soft group-hover:text-amber-300 transition-all duration-300 flex items-center justify-center cursor-pointer">
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:scale-110 group-hover:translate-x-0.5" />
            <span className={`ml-2 text-xs ${fontClass} group-hover:text-amber-300 transition-colors duration-300`}>
              {t("characterChat.expandSidebar")}
            </span>
          </div>

          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-[1px] bg-gradient-to-r from-transparent via-amber-400 to-transparent group-hover:w-3/4 transition-all duration-500"></div>
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
            className={`text-base md:text-lg text-cream-soft magical-text ${serifFontClass} truncate max-w-[120px] md:max-w-[200px]`}
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
            className={`group px-2 py-1.5 md:px-3 md:py-1 md:ml-2 flex items-center rounded-md border transition-all duration-300 shadow-md relative overflow-hidden portal-button ${
              activeView === "worldbook"
                ? "border-success/60 bg-gradient-to-br from-muted-surface to-overlay shadow-[0_0_12px_rgba(88,248,183,0.3)]"
                : "border-ink bg-gradient-to-br from-overlay to-coal hover:from-muted-surface hover:to-overlay hover:shadow-[0_0_12px_rgba(88,248,183,0.2)]"
            }`}
          >
            <div
              className={`relative w-6 h-6 md:mr-2 flex items-center justify-center transition-colors ${
                activeView === "worldbook"
                  ? "text-success"
                  : "text-success group-hover:text-success"
              }`}
            >
              <Eye className="h-5 w-5 eye-icon" strokeWidth={1.5} />
              <span className="absolute inset-0 rounded-full border border-success/40 group-hover:border-success/60 animate-ring-pulse pointer-events-none"></span>
              <span className="absolute w-3 h-3 rounded-full bg-success/40 blur-sm animate-ping-fast top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></span>
            </div>
            <span
              className={`font-medium text-sm transition-all duration-300 ${serifFontClass} hidden md:block ${
                activeView === "worldbook"
                  ? "text-success"
                  : "text-success group-hover:text-success"
              }`}
            >
              {t("characterChat.worldBook")}
            </span>
          </button>

          <button
            onClick={() => {
              trackButtonClick("page", "切换正则编辑器");
              setCharacterView(activeView === "regex" ? "chat" : "regex");
            }}
            data-tour="regex-button"
            className={`group px-2 py-1.5 md:px-3 md:py-1 md:ml-2 flex items-center rounded-md border transition-all duration-300 shadow-md relative overflow-hidden ${
              activeView === "regex"
                ? "border-amber/60 bg-gradient-to-br from-muted-surface to-ember shadow-[0_0_12px_rgba(248,183,88,0.3)]"
                : "border-ink bg-gradient-to-br from-ember to-coal hover:from-muted-surface hover:to-ember hover:shadow-[0_0_12px_rgba(248,183,88,0.2)]"
            }`}
          >
            <div
              className={`relative w-6 h-6 md:mr-2 flex items-center justify-center transition-colors ${
                activeView === "regex"
                  ? "text-amber-soft"
                  : "text-amber group-hover:text-amber-soft"
              }`}
            >
              <Layers className="h-5 w-5" strokeWidth={1.5} />
              <span className="absolute inset-0 rounded-full border border-amber/40 group-hover:border-amber-soft/60 animate-ring-pulse pointer-events-none"></span>
              <span className="absolute w-3 h-3 rounded-full bg-amber-soft/40 blur-sm animate-ping-fast top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></span>
            </div>
            <span
              className={`font-medium text-sm transition-all duration-300 ${serifFontClass} hidden md:block ${
                activeView === "regex"
                  ? "text-amber-soft"
                  : "text-amber-soft/80 group-hover:text-amber-soft"
              }`}
            >
              {t("characterChat.regex")}
            </span>
          </button>

          <button
            onClick={() => {
              trackButtonClick("page", "切换预设编辑器");
              setCharacterView(activeView === "preset" ? "chat" : "preset");
            }}
            data-tour="preset-button"
            className={`group px-2 py-1.5 md:px-3 md:py-1 md:ml-2 flex items-center rounded-md border transition-all duration-300 shadow-md relative overflow-hidden ${
              activeView === "preset"
                ? "border-info/60 bg-gradient-to-br from-overlay to-deep shadow-[0_0_12px_color-mix(in srgb,var(--color-info) 30%,transparent)]"
                : "border-ink bg-gradient-to-br from-deep to-coal hover:from-overlay hover:to-deep hover:shadow-[0_0_12px_color-mix(in srgb,var(--color-info) 20%,transparent)]"
            }`}
          >
            <div
              className={`relative w-6 h-6 md:mr-2 flex items-center justify-center transition-colors ${
                activeView === "preset"
                  ? "text-info"
                  : "text-info group-hover:text-info"
              }`}
            >
              <FileText className="h-5 w-5" strokeWidth={1.5} />
              <span className="absolute inset-0 rounded-full border border-info/40 group-hover:border-info/60 animate-ring-pulse pointer-events-none"></span>
              <span className="absolute w-3 h-3 rounded-full bg-info/40 blur-sm animate-ping-fast top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"></span>
            </div>
            <span
              className={`font-medium text-sm transition-all duration-300 ${serifFontClass} hidden md:block ${
                activeView === "preset"
                  ? "text-info"
                  : "text-info/80 group-hover:text-info"
              }`}
            >
              {t("characterChat.preset")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
