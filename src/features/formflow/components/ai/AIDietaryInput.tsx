/**
 * AIDietaryInput.tsx
 * Free-text dietary input with extracted flags as removable chips.
 */

import { useCallback } from 'react';
import { motion } from 'framer-motion';
import type { SuggestionChip } from '../../types';

interface AIDietaryInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  chips: SuggestionChip[];
  onRemoveChip: (chipValue: string) => void;
  disabled?: boolean;
}

const reducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AIDietaryInput({
  id,
  value,
  onChange,
  onBlur,
  chips,
  onRemoveChip,
  disabled,
}: AIDietaryInputProps) {
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onBlur();
    }
  }, [onBlur]);

  return (
    <div>
      <input
        id={id}
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder="e.g. vegetarian, no nuts — or 'none'"
        disabled={disabled}
        autoComplete="off"
        className="w-full rounded-lg border px-3 py-2.5 text-sm bg-[#1E2333] text-[#F0F2F8] placeholder:text-[#545B72] border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors duration-150"
      />

      {/* Extracted dietary chips */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2" role="list" aria-label="Dietary requirements">
          {chips.map((chip) => (
            <motion.span
              key={chip.value}
              role="listitem"
              initial={reducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reducedMotion ? undefined : { opacity: 0, scale: 0.9 }}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#22C55E]"
            >
              {chip.label} ✓
              <button
                type="button"
                onClick={() => onRemoveChip(chip.value)}
                className="ml-0.5 hover:text-white transition-colors"
                aria-label={`Remove ${chip.label}`}
              >
                ×
              </button>
            </motion.span>
          ))}
        </div>
      )}
    </div>
  );
}
