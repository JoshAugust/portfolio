/**
 * AISuggestionBubble.tsx
 * Rounded card below the input with AI suggestion and accept/reject controls.
 */

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AISuggestion } from '../../types';

interface AISuggestionBubbleProps {
  suggestion: AISuggestion | null;
  onAccept: () => void;
  onReject: () => void;
}

const reducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AISuggestionBubble({ suggestion, onAccept, onReject }: AISuggestionBubbleProps) {
  // Keyboard: Enter = accept, Escape = reject
  useEffect(() => {
    if (!suggestion) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onAccept();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onReject();
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [suggestion, onAccept, onReject]);

  return (
    <AnimatePresence>
      {suggestion && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={reducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, y: -4, scale: 0.98 }}
          transition={
            reducedMotion
              ? { duration: 0.15 }
              : { type: 'spring', stiffness: 300, damping: 24 }
          }
          className="mt-2 rounded-lg border-l-2 border-[#6C63FF] bg-[#1E2333] px-3 py-2.5"
        >
          <p className="text-sm text-[#F0F2F8]">
            {suggestion.emoji && <span className="mr-1.5">{suggestion.emoji}</span>}
            {suggestion.displayText}
          </p>

          {suggestion.requiresConfirmation ? (
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={onAccept}
                className="px-3 py-1 text-xs font-medium rounded-md bg-[#6C63FF] text-white hover:bg-[#5B53EE] transition-colors"
              >
                Yes
              </button>
              <button
                onClick={onReject}
                className="px-3 py-1 text-xs font-medium rounded-md text-[#8B92A8] hover:text-[#F0F2F8] transition-colors"
              >
                No, keep it
              </button>
              <span className="text-[10px] text-[#545B72] ml-auto">
                Enter ↵ accept · Esc reject
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 mt-1">
              <span className="text-xs text-[#22C55E]">✓</span>
              <span className="text-xs text-[#8B92A8]">Auto-confirmed</span>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
