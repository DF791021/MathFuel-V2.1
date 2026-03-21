import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Lightbulb, Bot, Sparkles, ChevronDown, Lock,
  ThumbsUp, ThumbsDown,
} from "lucide-react";

const MAX_HINTS = 3;

const ENCOURAGEMENTS = [
  "Think about it a little more...",
  "You're getting warmer!",
  "Almost there — one more clue!",
];

const HINT_STYLES = [
  {
    bg: "bg-amber-50",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-600",
    labelColor: "text-amber-600",
    textColor: "text-amber-800",
    label: "Gentle Nudge",
    emoji: "💡",
  },
  {
    bg: "bg-orange-50",
    border: "border-orange-200",
    iconBg: "bg-orange-100",
    iconColor: "text-orange-600",
    labelColor: "text-orange-600",
    textColor: "text-orange-800",
    label: "Bigger Clue",
    emoji: "🔍",
  },
  {
    bg: "bg-rose-50",
    border: "border-rose-200",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    labelColor: "text-rose-600",
    textColor: "text-rose-800",
    label: "Strong Hint",
    emoji: "🎯",
  },
];

/* ─── Rating Buttons (inline) ─── */
function MiniRating({
  rating,
  onRate,
}: {
  rating: "up" | "down" | null;
  onRate: (r: "up" | "down") => void;
}) {
  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onRate("up")}
              aria-label="Helpful"
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                rating === "up"
                  ? "bg-green-100 text-green-600 scale-110 ring-2 ring-green-300"
                  : "hover:bg-green-50 text-muted-foreground/50 hover:text-green-500"
              }`}
            >
              <ThumbsUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Helpful!
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => onRate("down")}
              aria-label="Not helpful"
              className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                rating === "down"
                  ? "bg-red-100 text-red-500 scale-110 ring-2 ring-red-300"
                  : "hover:bg-red-50 text-muted-foreground/50 hover:text-red-400"
              }`}
            >
              <ThumbsDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Not helpful
          </TooltipContent>
        </Tooltip>
        <AnimatePresence>
          {rating && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-[9px] sm:text-[10px] text-muted-foreground ml-0.5"
            >
              Thanks!
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

/* ─── Animated Hint Button ─── */
function HintButton({
  hintsUsed,
  isLoading,
  isOnCooldown,
  allUsed,
  onClick,
}: {
  hintsUsed: number;
  isLoading: boolean;
  isOnCooldown: boolean;
  allUsed: boolean;
  onClick: () => void;
}) {
  const disabled = isLoading || isOnCooldown || allUsed;
  const showPulse = hintsUsed === 0 && !isLoading;

  return (
    <div className="relative">
      {/* Pulse ring when no hints used yet — invitation */}
      {showPulse && (
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-amber-400/60"
          animate={{
            scale: [1, 1.08, 1],
            opacity: [0.7, 0.3, 0.7],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      <Button
        variant="outline"
        onClick={onClick}
        disabled={disabled}
        className={`relative h-11 sm:h-12 gap-1.5 sm:gap-2 px-3 sm:px-4 transition-all duration-300 ${
          allUsed
            ? "opacity-50 border-muted"
            : hintsUsed === 0
            ? "border-amber-300 hover:border-amber-400 hover:bg-amber-50 shadow-sm shadow-amber-100"
            : "border-amber-200 hover:bg-amber-50"
        }`}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-4 h-4 sm:w-5 sm:h-5"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </motion.div>
        ) : allUsed ? (
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
        ) : (
          <motion.div
            animate={
              showPulse
                ? { rotate: [0, -15, 15, -10, 10, 0] }
                : {}
            }
            transition={{
              duration: 1.5,
              repeat: showPulse ? Infinity : 0,
              repeatDelay: 3,
            }}
          >
            <Lightbulb className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </motion.div>
        )}

        <span className="text-xs sm:text-sm font-medium">
          {isLoading
            ? "Thinking..."
            : isOnCooldown
            ? "Wait..."
            : allUsed
            ? "All hints used"
            : hintsUsed === 0
            ? "Need a Hint?"
            : `Hint ${hintsUsed}/${MAX_HINTS}`}
        </span>

        {/* Hint counter dots */}
        {!allUsed && hintsUsed > 0 && (
          <div className="flex gap-0.5 ml-1">
            {Array.from({ length: MAX_HINTS }).map((_, i) => (
              <motion.div
                key={i}
                initial={i === hintsUsed - 1 ? { scale: 0 } : {}}
                animate={{ scale: 1 }}
                className={`w-1.5 h-1.5 rounded-full ${
                  i < hintsUsed ? "bg-amber-400" : "bg-muted"
                }`}
              />
            ))}
          </div>
        )}
      </Button>
    </div>
  );
}

/* ─── Single Hint Card ─── */
function HintCard({
  hint,
  index,
  total,
  rating,
  onRate,
}: {
  hint: string;
  index: number;
  total: number;
  rating: "up" | "down" | null;
  onRate: (r: "up" | "down") => void;
}) {
  const style = HINT_STYLES[Math.min(index, HINT_STYLES.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1], // custom ease-out
      }}
      className={`relative rounded-xl ${style.bg} ${style.border} border overflow-hidden`}
    >
      {/* Progress stripe at top */}
      <div className="h-1 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />

      <div className="p-3 sm:p-4">
        <div className="flex gap-2.5 sm:gap-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full ${style.iconBg} flex items-center justify-center`}
            >
              <span className="text-base sm:text-lg">{style.emoji}</span>
            </motion.div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] sm:text-xs font-semibold ${style.labelColor} uppercase tracking-wide`}>
                {style.label}
              </span>
              <Badge
                variant="secondary"
                className={`text-[8px] sm:text-[10px] py-0 px-1.5 ${style.bg} ${style.labelColor} border ${style.border}`}
              >
                {index + 1}/{total > MAX_HINTS ? MAX_HINTS : total}
              </Badge>
            </div>

            {/* Hint text with typewriter-like reveal */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className={`text-sm sm:text-base ${style.textColor} leading-relaxed font-medium`}
            >
              {hint}
            </motion.p>

            {/* Rating row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-2 flex items-center gap-2"
            >
              <span className="text-[9px] sm:text-[10px] text-muted-foreground/60">
                Helpful?
              </span>
              <MiniRating rating={rating} onRate={onRate} />
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Encouragement Bubble ─── */
function EncouragementBubble({ index }: { index: number }) {
  const text = ENCOURAGEMENTS[Math.min(index, ENCOURAGEMENTS.length - 1)];

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.15, duration: 0.35 }}
      className="flex items-center justify-center gap-1.5 py-1.5"
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <Bot className="w-3.5 h-3.5 text-primary/50" />
      </motion.div>
      <span className="text-[11px] sm:text-xs text-muted-foreground italic">
        {text}
      </span>
    </motion.div>
  );
}

/* ═══════════════════════════════════════════════════
   MAIN EXPORT: HintSystem
   ═══════════════════════════════════════════════════ */
export interface HintSystemProps {
  visibleHints: string[];
  hintsViewed: number;
  isLoadingHint: boolean;
  onGetHint: () => void;
  hintRatings: Record<number, "up" | "down">;
  onRateHint: (index: number, rating: "up" | "down", text: string) => void;
}

export default function HintSystem({
  visibleHints,
  hintsViewed,
  isLoadingHint,
  onGetHint,
  hintRatings,
  onRateHint,
}: HintSystemProps) {
  const [cooldown, setCooldown] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const allUsed = hintsViewed >= MAX_HINTS;

  // Brief cooldown after each hint to prevent spam
  useEffect(() => {
    if (hintsViewed > 0) {
      setCooldown(true);
      const timer = setTimeout(() => setCooldown(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [hintsViewed]);

  const handleClick = useCallback(() => {
    if (!cooldown && !isLoadingHint && !allUsed) {
      onGetHint();
    }
  }, [cooldown, isLoadingHint, allUsed, onGetHint]);

  return (
    <div className="space-y-3">
      {/* Hint Button */}
      <HintButton
        hintsUsed={hintsViewed}
        isLoading={isLoadingHint}
        isOnCooldown={cooldown}
        allUsed={allUsed}
        onClick={handleClick}
      />

      {/* Hint Cards */}
      <AnimatePresence mode="sync">
        {visibleHints.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Collapse toggle */}
            {visibleHints.length > 1 && (
              <button
                onClick={() => setExpanded((e) => !e)}
                className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground hover:text-foreground transition-colors mb-2"
              >
                <motion.div
                  animate={{ rotate: expanded ? 0 : -90 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-3 h-3" />
                </motion.div>
                {expanded ? "Hide" : "Show"} hints ({visibleHints.length})
              </button>
            )}

            <AnimatePresence>
              {expanded && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  {visibleHints.map((hint, i) => (
                    <div key={i}>
                      {/* Encouragement between hints */}
                      {i > 0 && <EncouragementBubble index={i - 1} />}
                      <HintCard
                        hint={hint}
                        index={i}
                        total={MAX_HINTS}
                        rating={hintRatings[i] ?? null}
                        onRate={(r) => onRateHint(i, r, hint)}
                      />
                    </div>
                  ))}

                  {/* "All hints used" message */}
                  {allUsed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-center py-2"
                    >
                      <p className="text-[11px] sm:text-xs text-muted-foreground">
                        All hints revealed — give it your best shot! 🚀
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
