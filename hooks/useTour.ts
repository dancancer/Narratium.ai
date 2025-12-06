import { useState, useEffect } from "react";
import { useLanguage } from "@/app/i18n";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorage";

export interface TourStep {
  target: string;
  title: string;
  content: string;
  position: "top" | "bottom" | "left" | "right";
  allowSkip?: boolean;
  isLanguageSelection?: boolean;
}

const TOUR_STORAGE_KEY = "narratium_tour_completed";
const CHARACTER_TOUR_STORAGE_KEY = "narratium_character_tour_completed";

export function useTour() {
  const [isTourVisible, setIsTourVisible] = useState(false);
  const [currentTourSteps, setCurrentTourSteps] = useState<TourStep[]>([]);
  const { t, language } = useLanguage();
  const { value: homeTourCompleted, setValue: setHomeTourCompleted, remove: resetHomeTour } = useLocalStorageBoolean(TOUR_STORAGE_KEY, false);
  const { value: characterTourCompleted, setValue: setCharacterTourCompleted, remove: resetCharacterTour } = useLocalStorageBoolean(CHARACTER_TOUR_STORAGE_KEY, false);

  useEffect(() => {
    if (!homeTourCompleted) {
      setTimeout(() => {
        startHomeTour();
      }, 2000);
    }
  }, [homeTourCompleted]);

  useEffect(() => {
    if (isTourVisible) {
      const isHomeTour = currentTourSteps.length > 0 && currentTourSteps[0].target === "body";
      const isCharacterTour = !isHomeTour;

      if (isHomeTour) {
        startHomeTour();
      } else if (isCharacterTour) {
        startCharacterTour();
      }
    }
  }, [language]);

  const startHomeTour = () => {
    if (homeTourCompleted) return;
    const homeSteps: TourStep[] = [
      {
        target: "body",
        title: "选择语言 | Choose Your Language",
        content: "请选择您偏好的语言 | Please select your preferred language",
        position: "bottom",
        allowSkip: false,
        isLanguageSelection: true,
      },
      {
        target: "body",
        title: t("tour.welcome"),
        content: t("tour.welcomeDescription"),
        position: "bottom",
      },
      {
        target: "[data-tour='login-button']",
        title: t("tour.loginTitle"),
        content: t("tour.loginDescription"),
        position: "top",
      },
      {
        target: "[data-tour='settings-button']",
        title: t("tour.settingsTitle"),
        content: t("tour.settingsDescription"),
        position: "bottom",
      },
    ];
    
    setCurrentTourSteps(homeSteps);
    setIsTourVisible(true);
  };

  const startCharacterTour = () => {
    if (characterTourCompleted) {
      return;
    }

    const characterSteps: TourStep[] = [
      {
        target: "[data-tour='worldbook-button']",
        title: t("tour.worldbookTitle"),
        content: t("tour.worldbookDescription"),
        position: "bottom",
      },
      {
        target: "[data-tour='regex-button']",
        title: t("tour.regexTitle"),
        content: t("tour.regexDescription"),
        position: "bottom",
      },
      {
        target: "[data-tour='preset-button']",
        title: t("tour.presetTitle"),
        content: t("tour.presetDescription"),
        position: "bottom",
      },
      {
        target: "[data-tour='chat-input']",
        title: t("tour.chatTitle"),
        content: t("tour.chatDescription"),
        position: "top",
      },
    ];
    
    setCurrentTourSteps(characterSteps);
    setIsTourVisible(true);
  };

  const completeTour = () => {
    setIsTourVisible(false);
    if (currentTourSteps.length > 0 && currentTourSteps[0].target === "body") {
      setHomeTourCompleted(true);
    }
  };

  const skipTour = () => {
    setIsTourVisible(false);  
    if (currentTourSteps.length > 0 && currentTourSteps[0].target === "body") {
      setHomeTourCompleted(true);
    }
  };

  const resetTour = () => {
    resetHomeTour();
    resetCharacterTour();
    setIsTourVisible(false);
  };

  return {
    isTourVisible,
    currentTourSteps,
    startHomeTour,
    startCharacterTour,
    completeTour,
    skipTour,
    resetTour,
  };
} 
