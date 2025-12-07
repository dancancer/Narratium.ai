"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star, Circle } from "lucide-react";
import { useLanguage } from "../app/i18n";
import UserTour from "@/components/UserTour";
import { useTour } from "@/hooks/useTour";

/**
 * Main content component for the home page
 * Renders the landing page with animations and interactive elements
 * 
 * @returns {JSX.Element} The rendered home page content
 */
export default function HomeContent() {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const { isTourVisible, currentTourSteps, completeTour, skipTour } = useTour();

  useEffect(() => {
    setMounted(true);
    const yellowImg = new Image();
    const redImg = new Image();
    
    yellowImg.src = "/background_yellow.png";
    redImg.src = "/background_red.png";
    
    Promise.all([
      new Promise(resolve => yellowImg.onload = resolve),
      new Promise(resolve => redImg.onload = resolve),
    ]).then(() => {
      setImagesLoaded(true);
    });
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center h-full login-fantasy-bg relative">
      <div
        className={`absolute inset-0 z-0 opacity-35 transition-opacity duration-500 bg-[url('/background_yellow.png')] bg-cover bg-center bg-no-repeat ${
          imagesLoaded ? "opacity-35" : "opacity-0"
        }`}
      />

      <div
        className={`absolute inset-0 z-1 opacity-45 transition-opacity duration-500 bg-[url('/background_red.png')] bg-cover bg-center bg-no-repeat mix-blend-multiply ${
          imagesLoaded ? "opacity-45" : "opacity-0"
        }`}
      />
      <div className="absolute inset-0 pointer-events-none z-10">
        <div className="absolute top-10 left-10 opacity-5">
          <Star size={24} fill="var(--color-amber-bright)" color="var(--color-amber-bright)" />
        </div>
        <div className="absolute top-20 right-20 opacity-5">
          <Star size={20} fill="var(--color-amber-bright)" color="var(--color-amber-bright)" />
        </div>
        <div className="absolute bottom-20 left-1/4 opacity-5">
          <Circle size={16} color="var(--color-sky)" />
        </div>
        <div className="absolute bottom-10 right-1/4 opacity-5">
          <Circle size={24} color="var(--color-ink-soft)" />
        </div>
      </div>

      <div className="text-center max-w-2xl px-4 relative z-20 animate-in fade-in slide-in-from-bottom-5 duration-700">
        <h1 className="text-5xl font-cinzel mb-6 bg-clip-text text-transparent bg-gradient-to-r from-amber-500 via-orange-400 to-yellow-300 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]">
        Narratium
        </h1>
        <p
          className={`text-xl mb-12 tracking-wide bg-gradient-to-r from-[var(--color-ink-soft)] via-[var(--color-amber)] to-[var(--color-danger)] bg-clip-text text-transparent [text-shadow:0_0_2px_color-mix(in_srgb,var(--color-amber)_30%,transparent)] ${serifFontClass}`}
        >
          {t("homePage.slogan")}
        </p>

        <div className="flex flex-col md:flex-row gap-4 justify-center mt-6">
          <Link href="/character-cards">
            <div className={`portal-button text-amber-soft hover:text-highlight text-sm px-6 py-2 border border-ink rounded-md cursor-pointer ${fontClass} tracking-wide shadow-inner transition-all duration-200 hover:scale-105 hover:bg-[rgba(40,35,30,0.6)]`}>
              {t("homePage.immediatelyStart")}
            </div>
          </Link>
        </div>
      </div>
      <UserTour
        steps={currentTourSteps}
        isVisible={isTourVisible}
        onComplete={completeTour}
        onSkip={skipTour}
      />
    </div>
  );
} 
