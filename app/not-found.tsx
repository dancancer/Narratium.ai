"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Circle } from "lucide-react";
import { useLanguage } from "./i18n";
import "./styles/fantasy-ui.css";

export default function NotFound() {
  const { t, fontClass, titleFontClass, serifFontClass } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen login-fantasy-bg">
      <div className="absolute inset-0 z-0 opacity-35 bg-[url('/background_yellow.png')] bg-cover bg-center bg-no-repeat" />

      <div className="absolute inset-0 z-1 opacity-45 bg-[url('/background_red.png')] bg-cover bg-center bg-no-repeat mix-blend-multiply" />

      <div className="absolute inset-0 pointer-events-none">
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

      <div className="relative z-10 w-full max-w-2xl px-6 py-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8 relative">
            <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-2 border-ink opacity-20"></div>
              <div className="absolute inset-4 rounded-full border-2 border-ink opacity-30"></div>
              <div className="absolute inset-8 rounded-full border-2 border-ink opacity-40"></div>
              <span className={`text-5xl font-bold text-amber-soft ${titleFontClass}`}>404</span>
            </div>
          </div>

          <h1 className={`text-3xl mb-3 text-cream-soft magical-login-text ${serifFontClass}`}>
            {t("notFound.title")}
          </h1>
          <h2 className={`text-xl mb-6 text-amber-soft ${serifFontClass}`}>
            {t("notFound.subtitle")}
          </h2>

          <p className={`mb-10 text-ink-soft ${fontClass}`}>
            {t("notFound.message")}
          </p>

          <div className="flex items-center justify-center space-x-4">
            <Link href="/">
              <motion.div
                className={`portal-button text-amber-soft hover:text-highlight px-4 py-2 text-sm border border-ink rounded-md cursor-pointer ${fontClass}`}
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {t("notFound.backToHome")}
              </motion.div>
            </Link>
            <span className="mx-1 text-ink">•</span>
            <div className={`text-xs text-ink-soft ${fontClass}`}>
              {t("notFound.exploreMore")}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
