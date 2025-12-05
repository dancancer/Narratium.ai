/**
 * Character Card Carousel Component
 * 
 * This component provides a 3D carousel display for character cards with the following features:
 * - 3D circular carousel layout with perspective
 * - Smooth rotation animations
 * - Dynamic card scaling and opacity based on position
 * - Interactive navigation controls
 * - Card tilt effect with glare
 * - Quick action buttons for chat, edit, and delete
 * 
 * The component handles:
 * - 3D carousel rendering and layout
 * - Rotation animations and transitions
 * - Card positioning and perspective
 * - Navigation controls
 * - Responsive design adaptation
 * 
 * Dependencies:
 * - framer-motion: For animations
 * - useLanguage: For internationalization
 * - CharacterAvatarBackground: For avatar display
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { ArrowLeft, ArrowRight, MessageCircle, PencilLine, Trash2, UserRound } from "lucide-react";
import { useLanguage } from "@/app/i18n";
import { CharacterAvatarBackground } from "@/components/CharacterAvatarBackground";
import { trackButtonClick } from "@/utils/google-analytics";

/**
 * Interface definitions for the component's data structures
 */
interface Character {
  id: string;
  name: string;
  personality: string;
  scenario?: string;
  first_mes?: string;
  creatorcomment?: string;
  created_at: string;
  avatar_path?: string;
}

interface CharacterCardCarouselProps {
  characters: Character[];
  onEditClick: (character: Character, e: React.MouseEvent) => void;
  onDeleteClick: (characterId: string) => void;
}

/**
 * Main carousel component for displaying character cards in a 3D circular layout
 * 
 * @param {CharacterCardCarouselProps} props - Component props
 * @returns {JSX.Element} The rendered 3D carousel of character cards
 */
const CharacterCardCarousel: React.FC<CharacterCardCarouselProps> = ({
  characters,
  onEditClick,
  onDeleteClick,
}) => {
  const { t, fontClass, serifFontClass } = useLanguage();
  const [currentCenterIndex, setCurrentCenterIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate carousel parameters based on number of cards
  const cardCount = Math.min(characters.length, 8);
  const angleStep = cardCount > 0 ? 360 / cardCount : 120;
  const translateZDistance = cardCount <= 3 ? 30 : Math.max(25, 30 - (cardCount - 3) * 2);

  /**
   * Handle carousel rotation to the left
   * Prevents multiple rotations during animation
   */
  const handleRotateLeft = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentCenterIndex(prev => (prev + 1) % cardCount);
    setTimeout(() => setIsAnimating(false), 800);
  };

  /**
   * Handle carousel rotation to the right
   * Prevents multiple rotations during animation
   */
  const handleRotateRight = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setCurrentCenterIndex(prev => (prev - 1 + cardCount) % cardCount);
    setTimeout(() => setIsAnimating(false), 800);
  };

  return (
    <div className="relative w-full h-[70vh] max-h-[600px] my-12 pt-40 flex items-center justify-center [perspective:1500px]">
      {/* 3D carousel container */}
      <div 
        className="w-full h-full absolute transform-style-preserve-3d"
        style={{
          transformOrigin: "center center 0px",
          transformStyle: "preserve-3d",
          transform: `translateZ(-${translateZDistance}vw)`,
        }}
      >
        {characters.slice(0, cardCount).map((character, index) => {
          // Calculate card position and visual properties
          const relativePosition = (index - currentCenterIndex + cardCount) % cardCount;
          const rotateY = relativePosition * angleStep;

          const isCentered = relativePosition === 0;
          const isBackface = rotateY > 90 && rotateY < 270;
          const isSideface = !isCentered && !isBackface;

          // Determine card appearance based on position
          let opacityClass, boxShadowClass, scale;
          if (isCentered) {
            opacityClass = "opacity-100";
            boxShadowClass = "shadow-[0_8px_25px_rgba(0,0,0,0.4)]";
            scale = 1;
          } else if (isSideface) {
            opacityClass = "opacity-70";
            boxShadowClass = "shadow-[0_4px_15px_rgba(0,0,0,0.2)]";
            scale = 0.9;
          } else {
            opacityClass = "opacity-40";
            boxShadowClass = "shadow-[0_2px_10px_rgba(0,0,0,0.1)]";
            scale = 0.8;
          }
          
          return (
            <motion.div
              key={character.id}
              className={`absolute flex items-center justify-center max-w-[280px] max-h-[350px] w-[40vw] h-[50vw] left-[calc(50%-10vw)] top-[calc(50%-15vw)] rounded-[8px] ${boxShadowClass} ${opacityClass}`}
              style={{
                transform: `rotateY(${rotateY}deg) translateZ(${translateZDistance}vw) scale(${scale})`,
                transformOrigin: "center center",
                transition: isAnimating ? "all 0.8s cubic-bezier(0.77, 0, 0.175, 1)" : "opacity 0.3s ease, filter 0.3s ease, box-shadow 0.3s ease",
              }}
            >
              {/* Character card content */}
              <div className="relative session-card h-full w-full transition-all duration-300 overflow-hidden rounded">
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex space-x-1 z-10">
                  <Link
                    href={`/character?id=${character.id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 bg-muted-surface hover:bg-muted-surface rounded-full text-amber-soft hover:text-highlight transition-colors"
                    title={t("characterCardsPage.chat")}
                    aria-label={t("characterCardsPage.chat")}
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-amber-soft hover:text-highlight transition-colors" />
                  </Link>
                  <button
                    onClick={(e) => {trackButtonClick("edit_character_btn", "编辑角色"); onEditClick(character, e);}}
                    className="p-1.5 bg-muted-surface hover:bg-muted-surface rounded-full text-amber-soft hover:text-highlight transition-colors"
                    title={t("characterCardsPage.edit")}
                    aria-label={t("characterCardsPage.edit")}
                  >
                    <PencilLine className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      trackButtonClick("delete_character_btn", "删除角色");
                      e.stopPropagation();
                      onDeleteClick(character.id);
                    }}
                    className="p-1.5 bg-muted-surface hover:bg-muted-surface rounded-full text-amber-soft hover:text-highlight transition-colors"
                    title={t("characterCardsPage.delete")}
                    aria-label={t("characterCardsPage.delete")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                    
                <Link
                  href={`/character?id=${character.id}`}
                  className="block h-full flex flex-col"
                >
                  {/* Character avatar */}
                  <div className="relative w-full overflow-hidden rounded aspect-[4/5]">
                    {character.avatar_path ? (
                      <CharacterAvatarBackground avatarPath={character.avatar_path} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted-surface">
                        <UserRound className="h-24 w-24 text-ink" strokeWidth={1.5} />
                      </div>
                    )}
                  </div>
                
                  {/* Character info */}
                  <div className="p-4 relative">
                    <h2 className={`text-lg text-cream-soft line-clamp-1 magical-text ${serifFontClass}`}>{character.name}</h2>
                    <div className={`text-xs text-ink-soft mt-2 italic ${fontClass}`}>
                      <span className="inline-block mr-1 opacity-70">✨</span>
                      <span className="line-clamp-2">{character.personality}</span>
                    </div>

                    {/* Navigation controls for centered card */}
                    {isCentered && cardCount > 1 && (
                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2 z-30">
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRotateLeft();
                          }}
                          disabled={isAnimating}
                          className="p-2 bg-muted-surface/90 hover:bg-muted-surface/95 rounded-full text-amber-soft hover:text-highlight transition-all duration-300 backdrop-blur-sm border border-muted-surface/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          aria-label="向左旋转"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleRotateRight();
                          }}
                          disabled={isAnimating}
                          className="p-2 bg-muted-surface/90 hover:bg-muted-surface/95 rounded-full text-amber-soft hover:text-highlight transition-all duration-300 backdrop-blur-sm border border-muted-surface/50 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                          aria-label="向右旋转"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </Link>
              </div>
            </motion.div>
          );
        })}
      </div>
      <style jsx>{`
        .transform-style-preserve-3d {
          transform-style: preserve-3d;
        }
      `}</style>
    </div>
  );
};

export default CharacterCardCarousel;
