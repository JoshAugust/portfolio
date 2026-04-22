/**
 * AIDateInput.tsx
 * Date input with chip quick-picks AND text input for natural language dates.
 */

import { useCallback, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as dateResolver from '../../services/resolvers/dateResolver';

interface AIDateInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onResolve: (iso: string, displayText: string) => void;
  disabled?: boolean;
}

const reducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AIDateInput({ id, value, onChange, onResolve, disabled }: AIDateInputProps) {
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [textValue, setTextValue] = useState('');
  const [textError, setTextError] = useState<string | null>(null);

  const eventDates = useMemo(() => dateResolver.getEventDates(), []);

  const handleChipClick = useCallback((result: dateResolver.DateParseResult) => {
    setSelectedChip(result.iso);
    setTextValue('');
    setTextError(null);
    onChange(result.iso);
    onResolve(result.iso, result.displayText);
  }, [onChange, onResolve]);

  const handleTextBlur = useCallback(() => {
    if (!textValue.trim()) return;

    const parsed = dateResolver.parse(textValue);
    if (parsed) {
      setSelectedChip(parsed.iso);
      setTextError(null);
      onChange(parsed.iso);
      onResolve(parsed.iso, parsed.displayText);
    } else {
      setTextError("We couldn't parse that — try 'April 26' or pick a day above.");
    }
  }, [textValue, onChange, onResolve]);

  const handleTextKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleTextBlur();
    }
  }, [handleTextBlur]);

  return (
    <div>
      {/* Chip quick-picks */}
      <div className="flex flex-wrap gap-2 mb-3" role="group" aria-label="Quick date picks">
        {eventDates.map((d) => {
          const chipLabel = dateResolver.getChipLabel(d);
          const isSelected = selectedChip === d.iso;

          return (
            <motion.button
              key={d.iso}
              type="button"
              onClick={() => handleChipClick(d)}
              disabled={disabled}
              whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                isSelected
                  ? 'bg-[#6C63FF] border-[#6C63FF] text-white'
                  : 'border-[#2A3045] text-[#8B92A8] hover:border-[#6C63FF]/50 hover:text-[#F0F2F8]'
              }`}
              aria-pressed={isSelected}
            >
              {chipLabel}
            </motion.button>
          );
        })}
      </div>

      {/* Text input fallback */}
      <div>
        <p className="text-xs text-[#545B72] mb-1.5">Or type a date...</p>
        <input
          id={id}
          type="text"
          value={textValue}
          onChange={e => {
            setTextValue(e.target.value);
            setTextError(null);
          }}
          onBlur={handleTextBlur}
          onKeyDown={handleTextKeyDown}
          placeholder={`"Saturday", "the 26th", "April 26"...`}
          disabled={disabled}
          autoComplete="off"
          className="w-full rounded-lg border px-3 py-2.5 text-sm bg-[#1E2333] text-[#F0F2F8] placeholder:text-[#545B72] border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors duration-150"
          aria-invalid={!!textError || undefined}
          aria-describedby={textError ? `${id}-error` : undefined}
        />
        {textError && (
          <p id={`${id}-error`} role="alert" className="mt-1 text-xs text-[#EF4444] flex items-center gap-1">
            <span aria-hidden="true">⚠</span>
            {textError}
          </p>
        )}
      </div>

      {/* Selected confirmation */}
      {value && selectedChip && (
        <div aria-live="polite" className="mt-2">
          <span className="text-xs text-[#22C55E]">
            {eventDates.find(d => d.iso === selectedChip)?.displayText}
          </span>
        </div>
      )}
    </div>
  );
}
