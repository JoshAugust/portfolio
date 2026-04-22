/**
 * AICountryInput.tsx
 * Free-text country input with live fuzzy search suggestions.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import * as countryResolver from '../../services/resolvers/countryResolver';

interface AICountryInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onResolve: (code: string, displayText: string, emoji: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function AICountryInput({
  id,
  value,
  onChange,
  onResolve,
  placeholder = 'Type anything — "England", "US", "🇳🇬"...',
  disabled,
}: AICountryInputProps) {
  const [suggestions, setSuggestions] = useState<countryResolver.CountryResolveResult[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);

  // Live fuzzy search as user types
  useEffect(() => {
    if (!value.trim() || value.trim().length < 1) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const results = countryResolver.suggest(value, 5);
    setSuggestions(results);
    setIsOpen(results.length > 0);
    setActiveIndex(-1);
  }, [value]);

  const selectCountry = useCallback((result: countryResolver.CountryResolveResult) => {
    onChange(result.name);
    onResolve(result.code, `${result.flag} ${result.name}`, result.flag);
    setSuggestions([]);
    setIsOpen(false);
  }, [onChange, onResolve]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      selectCountry(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  }, [isOpen, suggestions, activeIndex, selectCountry]);

  const listboxId = `${id}-listbox`;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
        autoComplete="off"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => {
          // Delay to allow click on suggestion
          setTimeout(() => setIsOpen(false), 200);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-lg border px-3 py-2.5 text-sm bg-[#1E2333] text-[#F0F2F8] placeholder:text-[#545B72] border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors duration-150"
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          ref={listboxRef}
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-1 w-full rounded-lg border border-[#2A3045] bg-[#161A24] shadow-lg overflow-hidden"
        >
          {suggestions.map((s, i) => (
            <li
              key={s.code}
              id={`${listboxId}-option-${i}`}
              role="option"
              aria-selected={i === activeIndex}
              onMouseDown={(e) => {
                e.preventDefault();
                selectCountry(s);
              }}
              onMouseEnter={() => setActiveIndex(i)}
              className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 ${
                i === activeIndex ? 'bg-[#6C63FF]/20 text-[#F0F2F8]' : 'text-[#8B92A8] hover:bg-[#1E2333]'
              }`}
            >
              <span aria-hidden="true">{s.flag}</span>
              <span>{s.name}</span>
              {s.matchedAlias && s.matchedAlias.toLowerCase() !== s.name.toLowerCase() && (
                <span className="text-[10px] text-[#545B72] ml-auto">
                  ({s.matchedAlias})
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
