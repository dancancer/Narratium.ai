/**
 * Character Card Grid Component
 * 
 * This component provides a grid layout display for character cards with the following features:
 * - Responsive grid layout (1-3 columns based on screen size)
 * - Animated card appearance with staggered loading
 * - Interactive card tilt effect with glare
 * - Quick action buttons for chat, edit, and delete
 * - Avatar display with fallback
 * - Character name and personality preview
 * 
 * The component handles:
 * - Character card rendering and layout
 * - Interactive animations and effects
 * - Action button event handling
 * - Responsive design adaptation
 * 
 * Dependencies:
 * - framer-motion: For animations
 * - react-parallax-tilt: For card tilt effect
 * - CharacterAvatarBackground: For avatar display
 * - useLanguage: For internationalization
 */

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import { ArrowUp, PencilLine, Trash2, UserRound } from "lucide-react";
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

interface CharacterCardGridProps {
  characters: Character[];
  onEditClick: (character: Character, e: React.MouseEvent) => void;
  onDeleteClick: (characterId: string) => void;
  onMoveToTopClick: (characterId: string) => void;
}

/**
 * Main grid component for displaying character cards
 * 
 * @param {CharacterCardGridProps} props - Component props
 * @returns {JSX.Element} The rendered grid of character cards
 */
const CharacterCardGrid: React.FC<CharacterCardGridProps> = ({
  characters,
  onEditClick,
  onDeleteClick,
  onMoveToTopClick,
}) => {
  const { t, fontClass, serifFontClass } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, staggerChildren: 0.1 }}
      className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4"
    >
      {characters.map((character, index) => (
        <motion.div
          key={character.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="scale-[0.75] sm:scale-[0.85]"
        >
          <Tilt
            tiltMaxAngleX={-15}
            tiltMaxAngleY={-15}
            glareEnable={true}
            glareMaxOpacity={0.1}
            glareColor="var(--color-cream)"
            glarePosition="all"
            glareBorderRadius="8px"
            scale={1.02}
            transitionSpeed={2000}
            className="h-full"
          >
            <div className="relative session-card h-full transition-all duration-300">
              {/* Action buttons for each card */}
              <div className="absolute top-1 right-1 sm:top-2 sm:right-2 flex space-x-0.5 sm:space-x-1 z-10">
                {/* move character to top of the screen */}
                <button
                  onClick={(e) => {e.stopPropagation(); trackButtonClick("move_to_top_character_btn", "置顶角色"); onMoveToTopClick(character.id);}}
                  className="p-2 sm:p-1.5 bg-muted-surface hover:bg-muted-surface rounded-full text-primary-soft hover:text-highlight transition-colors"
                  title={t("characterCardsPage.move_to_top")}
                  aria-label={t("characterCardsPage.move_to_top")}
                >
                  <ArrowUp className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
                <button
                  onClick={(e) => {trackButtonClick("edit_character_btn", "编辑角色"); onEditClick(character, e);}}
                  className="p-2 sm:p-1.5 bg-muted-surface hover:bg-muted-surface rounded-full text-primary-soft hover:text-highlight transition-colors"
                  title={t("characterCardsPage.edit")}
                  aria-label={t("characterCardsPage.edit")}
                >
                  <PencilLine className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    trackButtonClick("delete_character_btn", "删除角色");
                    e.stopPropagation();
                    onDeleteClick(character.id);
                  }}
                  className="p-2 sm:p-1.5 bg-muted-surface hover:bg-muted-surface rounded-full text-primary-soft hover:text-highlight transition-colors"
                  title={t("characterCardsPage.delete")}
                  aria-label={t("characterCardsPage.delete")}
                >
                  <Trash2 className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
                </button>
              </div>
            
              {/* Character card content */}
              <Link
                href={`/character?id=${character.id}`}
                className="block h-full flex flex-col"
              >
                <div className="relative w-full overflow-hidden rounded aspect-[4/5]">
                  {character.avatar_path ? (
                    <CharacterAvatarBackground avatarPath={character.avatar_path} />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted-surface">
                      <UserRound className="h-16 w-16 sm:h-24 sm:w-24 text-ink" strokeWidth={1.5} />
                    </div>
                  )}
                </div>
              
                <div className="p-2 sm:p-4">
                  <h2 className={`text-sm sm:text-lg text-cream-soft line-clamp-1 magical-text `}>{character.name}</h2>
                  <div className={`text-2xs sm:text-xs text-ink-soft mt-1 sm:mt-2 italic ${fontClass}`}>
                    <span className="inline-block mr-1 opacity-70">✨</span>
                    <span className="line-clamp-2">{character.personality}</span>
                  </div>
                </div>
              </Link>
            </div>
          </Tilt>
        </motion.div>
      ))}
    </motion.div>
  );
};

export default CharacterCardGrid; 
