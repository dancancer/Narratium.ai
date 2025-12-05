/**
 * Mobile Bottom Navigation Component
 * 
 * This component provides a mobile-specific bottom navigation bar with the following features:
 * - Responsive mobile navigation interface
 * - Home, character cards, creator, and login/logout navigation
 * - User authentication state management
 * - Smooth transitions and hover effects
 * - Safe area handling for devices with home indicators
 * 
 * The component handles:
 * - Mobile device detection and responsive behavior
 * - User authentication state from localStorage
 * - Navigation routing and active state management
 * - Logout functionality and state clearing
 * - Responsive design adaptation
 * 
 * Dependencies:
 * - useLanguage: For internationalization
 * - useRouter, usePathname: For navigation
 * - fantasy-ui.css: For styling
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Home, IdCard, LogIn, Sparkles, UserRound } from "lucide-react";
import { useLanguage } from "@/app/i18n";
import { useAuth } from "@/hooks/useAuth";
import "@/app/styles/fantasy-ui.css";

/**
 * Interface definitions for the component's props
 */
interface MobileBottomNavProps {
  openLoginModal: () => void;
  openAccountModal?: () => void;
}

/**
 * Mobile bottom navigation component
 * 
 * Provides a mobile-specific navigation interface with:
 * - Bottom navigation bar with key app sections
 * - User authentication state management
 * - Responsive design with safe area handling
 * - Smooth animations and transitions
 * 
 * @param {MobileBottomNavProps} props - Component props
 * @returns {JSX.Element | null} The mobile bottom navigation or null on desktop
 */
export default function MobileBottomNav({ openLoginModal, openAccountModal }: MobileBottomNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();
  const [isMobile, setIsMobile] = useState(false);
  const { t, fontClass } = useLanguage();

  useEffect(() => {
    const checkIfMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
    };

    checkIfMobile();
    
    window.addEventListener("resize", checkIfMobile);
    
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Only show on mobile devices
  if (!isMobile) {
    return null;
  }

  const handleOpenAccount = () => {
    if (openAccountModal) {
      openAccountModal();
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background with blur effect */}
      <div className="absolute inset-0 bg-deep/95 backdrop-blur-md border-t border-ink/50"></div>
      
      {/* Navigation items */}
      <div className="relative flex items-center justify-around px-2 py-3">
        {/* Home */}
        <Link
          href="/"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
            isActive("/") 
              ? "text-amber-bright bg-overlay/50" 
              : "text-ink-soft hover:text-amber-bright hover:bg-overlay/30"
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center mb-1">
            <Home className="h-5 w-5" />
          </div>
          <span className={`text-2xs ${fontClass}`}>{t("sidebar.home")}</span>
        </Link>

        {/* Character Cards */}
        <Link
          href="/character-cards"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
            isActive("/character-cards") 
              ? "text-amber-bright bg-overlay/50" 
              : "text-ink-soft hover:text-amber-bright hover:bg-overlay/30"
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center mb-1">
            <IdCard className="h-5 w-5" />
          </div>
          <span className={`text-2xs ${fontClass}`}>{t("sidebar.characterCards")}</span>
        </Link>

        {/* Creator */}
        <Link
          href="/creator-input"
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
            isActive("/creator-input") 
              ? "text-amber-bright bg-overlay/50" 
              : "text-ink-soft hover:text-amber-bright hover:bg-overlay/30"
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center mb-1">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className={`text-2xs ${fontClass}`}>{t("sidebar.creator")}</span>
        </Link>

        {/* Login/User */}
        <button
          onClick={isAuthenticated ? handleOpenAccount : openLoginModal}
          className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-300 ${
            isAuthenticated 
              ? "text-amber-bright hover:bg-overlay/30" 
              : "text-ink-soft hover:text-amber-bright hover:bg-overlay/30"
          }`}
        >
          <div className="w-6 h-6 flex items-center justify-center mb-1">
            {isAuthenticated ? (
              <UserRound className="h-5 w-5" />
            ) : (
              <LogIn className="h-5 w-5" />
            )}
          </div>
          <span className={`text-2xs ${fontClass}`}>
            {isAuthenticated ? t("sidebar.openAccount") : t("sidebar.nologin")}
          </span>
        </button>
      </div>

      {/* Bottom safe area for devices with home indicator */}
      <div className="h-safe-area-inset-bottom bg-deep/95 mobile-bottom-nav"></div>
    </div>
  );
} 
