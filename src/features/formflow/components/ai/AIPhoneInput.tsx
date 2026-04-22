/**
 * AIPhoneInput.tsx
 * Phone input with ghost text overlay showing E.164 formatted version.
 */

import { useCallback, useMemo, useRef } from 'react';
import * as phoneResolver from '../../services/resolvers/phoneResolver';

interface AIPhoneInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AIPhoneInput({
  id,
  value,
  onChange,
  onBlur,
  placeholder = 'Any format — we\'ll sort it out',
  disabled,
}: AIPhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  // Try to parse the current value for ghost text
  const ghostText = useMemo(() => {
    if (!value || value.trim().length < 4) return null;
    const result = phoneResolver.normalize(value);
    if (!result) return null;
    return result.formatted;
  }, [value]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onBlur();
    }
  }, [onBlur]);

  return (
    <div className="relative">
      {/* Ghost text overlay */}
      {ghostText && (
        <div
          aria-hidden="true"
          className="absolute inset-0 flex items-center px-3 py-2.5 pointer-events-none"
        >
          <span className="text-sm text-[#6C63FF]/40 font-mono">
            {ghostText}
          </span>
        </div>
      )}

      <input
        ref={inputRef}
        id={id}
        type="tel"
        value={value}
        onChange={e => onChange(e.target.value)}
        onBlur={onBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="tel"
        className="w-full rounded-lg border px-3 py-2.5 text-sm bg-[#1E2333] text-[#F0F2F8] placeholder:text-[#545B72] border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors duration-150 relative z-10"
        style={{ background: ghostText ? 'transparent' : undefined }}
      />

      {/* Show formatted result hint below */}
      {ghostText && (
        <p className="mt-1 text-xs text-[#545B72]" aria-hidden="true">
          → {ghostText}
        </p>
      )}
    </div>
  );
}
