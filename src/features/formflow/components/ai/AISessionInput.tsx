/**
 * AISessionInput.tsx
 * Textarea for session interests with togglable session track chips.
 */

import { useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import { SESSION_TRACKS } from '../../data/sessionTracks';
import type { SuggestionChip } from '../../types';

interface AISessionInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onResolve: (selectedTracks: string[], chips: SuggestionChip[]) => void;
  chips: SuggestionChip[];
  disabled?: boolean;
}

const reducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AISessionInput({
  id,
  value,
  onChange,
  onResolve,
  chips,
  disabled,
}: AISessionInputProps) {
  const [hasResolved, setHasResolved] = useState(false);

  const handleBlur = useCallback(() => {
    if (!value.trim() || hasResolved) return;
    // Resolution happens via the parent's useAIField — we just signal blur
    setHasResolved(true);
  }, [value, hasResolved]);

  const toggleChip = useCallback((trackId: string) => {
    const updated = chips.map(c =>
      c.value === trackId ? { ...c, selected: !c.selected } : c
    );
    const selectedIds = updated.filter(c => c.selected).map(c => c.value);
    onResolve(selectedIds, updated);
  }, [chips, onResolve]);

  return (
    <div>
      <textarea
        id={id}
        value={value}
        onChange={e => {
          onChange(e.target.value);
          if (hasResolved) setHasResolved(false);
        }}
        onBlur={handleBlur}
        placeholder="Tell us what you're into — AI, design, startups..."
        disabled={disabled}
        rows={2}
        className="w-full rounded-lg border px-3 py-2.5 text-sm bg-[#1E2333] text-[#F0F2F8] placeholder:text-[#545B72] border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors duration-150 resize-none"
      />

      {/* Session track chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2" role="group" aria-label="Session tracks">
          {chips.map((chip) => (
            <motion.button
              key={chip.value}
              type="button"
              onClick={() => toggleChip(chip.value)}
              disabled={disabled}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                chip.selected
                  ? 'bg-[#6C63FF]/20 border-[#6C63FF] text-[#F0F2F8]'
                  : 'border-[#2A3045] text-[#545B72] hover:border-[#6C63FF]/50'
              }`}
              aria-pressed={chip.selected}
            >
              {chip.aiSuggested && chip.selected && <span className="mr-1 text-[#6C63FF]">✦</span>}
              {chip.label.replace('✦ ', '')}
              {chip.selected && <span className="ml-1">✓</span>}
            </motion.button>
          ))}
        </div>
      )}

      {/* Show all tracks if none have been suggested yet */}
      {chips.length === 0 && !value.trim() && (
        <div className="flex flex-wrap gap-2 mt-2 opacity-50" aria-label="Available session tracks">
          {SESSION_TRACKS.map(track => (
            <span
              key={track.id}
              className="px-3 py-1.5 rounded-full text-xs border border-[#2A3045] text-[#545B72]"
            >
              {track.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
