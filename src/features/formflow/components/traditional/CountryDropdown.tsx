/**
 * CountryDropdown.tsx
 * A native <select> with 195 countries, sorted alphabetically.
 * "England" is NOT an option — only "United Kingdom".
 * This is deliberately painful UX — 195 items requiring scrolling.
 */

import { type SelectHTMLAttributes, useId } from 'react';
import { FieldLabel } from '../shared/FieldLabel';
import { FieldError } from '../shared/FieldError';
import { COUNTRIES } from '../../data/countries';

// Sort all countries alphabetically by canonical name.
// Note: "England" is absent — only "United Kingdom" appears (GB).
const SORTED_COUNTRIES = [...COUNTRIES].sort((a, b) =>
  a.name.localeCompare(b.name)
);

interface CountryDropdownProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'required'> {
  /** The field id — must be unique. If omitted, a generated id is used. */
  fieldId?: string;
  error?: string;
  required?: boolean;
}

const baseSelectClass = [
  'w-full rounded-lg border px-3 py-2.5 text-sm',
  'bg-[#1E2333] text-[#F0F2F8]',
  'border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF]',
  'transition-colors duration-150',
  // Native selects need explicit appearance for consistent cross-browser styling
  'appearance-none',
].join(' ');

const errorSelectClass = 'border-red-500 focus:border-red-400 focus:ring-red-400';

export function CountryDropdown({
  fieldId,
  error,
  required = false,
  ...rest
}: CountryDropdownProps) {
  const generatedId = useId();
  const id = fieldId ?? generatedId;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  return (
    <div className="mb-4">
      <FieldLabel htmlFor={id} required={required}>
        Country
      </FieldLabel>

      {/* Wrapper for custom dropdown arrow */}
      <div className="relative">
        <select
          {...rest}
          id={id}
          required={required}
          aria-required={required}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          autoComplete="country"
          className={`${baseSelectClass} ${hasError ? errorSelectClass : ''} pr-8 ${rest.className ?? ''}`}
        >
          <option value="">— Select Country —</option>
          {SORTED_COUNTRIES.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>

        {/* Custom dropdown arrow */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#8B92A8] text-xs"
        >
          ▼
        </span>
      </div>

      {hasError && <FieldError id={errorId} message={error!} />}
    </div>
  );
}
