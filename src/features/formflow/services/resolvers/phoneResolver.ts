/**
 * phoneResolver.ts
 * Normalises phone numbers to E.164 format using libphonenumber-js.
 * Accepts any format — messy input is a feature, not a bug.
 */

import { parsePhoneNumber, isValidPhoneNumber, type CountryCode } from 'libphonenumber-js';

export interface PhoneNormalizeResult {
  e164: string;
  formatted: string;
  region: string;
  countryName: string;
  lineType?: string;
}

/**
 * Attempt to parse a phone number, trying multiple country hints.
 * Default hint: GB (most demo-critical inputs are UK numbers).
 */
const COUNTRY_HINTS: CountryCode[] = ['GB', 'US', 'AU', 'CA', 'IN', 'DE', 'FR', 'NG', 'NL'];

/**
 * Map country codes to display names.
 */
const COUNTRY_DISPLAY: Record<string, string> = {
  GB: 'UK',
  US: 'US',
  AU: 'AU',
  CA: 'Canada',
  IN: 'India',
  DE: 'Germany',
  FR: 'France',
  NG: 'Nigeria',
  NL: 'Netherlands',
  ZA: 'South Africa',
  BR: 'Brazil',
  JP: 'Japan',
  KR: 'South Korea',
  SG: 'Singapore',
  NZ: 'New Zealand',
  IE: 'Ireland',
  ES: 'Spain',
  IT: 'Italy',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  PL: 'Poland',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  PT: 'Portugal',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
};

/**
 * Normalise a phone number string to E.164 + human-friendly format.
 *
 * @example
 * normalize('07911 123 456')
 * // → { e164: '+447911123456', formatted: '+44 7911 123456', region: 'GB', countryName: 'UK' }
 *
 * normalize('(212) 555-0100')
 * // → { e164: '+12125550100', formatted: '+1 212 555 0100', region: 'US', countryName: 'US' }
 */
export function normalize(phone: string): PhoneNormalizeResult | null {
  const cleaned = phone.trim();
  if (!cleaned) return null;

  // If it starts with '+', parse without country hint
  if (cleaned.startsWith('+')) {
    try {
      const parsed = parsePhoneNumber(cleaned);
      if (parsed && parsed.isValid()) {
        return buildResult(parsed);
      }
    } catch {
      // fall through to hints
    }
  }

  // Try each country hint in order
  for (const country of COUNTRY_HINTS) {
    try {
      const parsed = parsePhoneNumber(cleaned, country);
      if (parsed && parsed.isValid()) {
        return buildResult(parsed);
      }
    } catch {
      // try next hint
    }
  }

  return null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildResult(parsed: any): PhoneNormalizeResult {
  const e164 = parsed.format('E.164') as string;
  const international = parsed.formatInternational() as string;
  const region = (parsed.country ?? 'XX') as string;
  const countryName = COUNTRY_DISPLAY[region] ?? region;

  return {
    e164,
    formatted: international,
    region,
    countryName,
  };
}

/**
 * Quick validity check (used by resolvers without full parse).
 */
export function isLikelyPhone(input: string): boolean {
  // Has at least 7 digits
  const digits = input.replace(/\D/g, '');
  return digits.length >= 7;
}

/**
 * Get display label for phone confirmation chip.
 *
 * @example
 * getDisplayLabel({ countryName: 'UK', formatted: '+44 7911 123456' })
 * // → 'UK Mobile: +44 7911 123456 ✓'
 */
export function getDisplayLabel(result: PhoneNormalizeResult): string {
  return `✓ ${result.countryName} Mobile: ${result.formatted}`;
}
