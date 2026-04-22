/**
 * emailResolver.ts
 * Detects common email domain typos and suggests corrections.
 */

import { EMAIL_TYPO_MAP } from '../../data/emailDomains';

export interface EmailTypoResult {
  hasTypo: boolean;
  originalDomain: string;
  correctedDomain: string;
  correctedEmail: string;
}

/**
 * Check if an email address has a common domain typo.
 *
 * @example
 * checkTypo('josh@gmial.com')
 * // → { hasTypo: true, originalDomain: 'gmial.com', correctedDomain: 'gmail.com', correctedEmail: 'josh@gmail.com' }
 */
export function checkTypo(email: string): EmailTypoResult | null {
  const trimmed = email.trim().toLowerCase();
  const atIdx = trimmed.lastIndexOf('@');

  if (atIdx === -1) return null;

  const local = trimmed.slice(0, atIdx);
  const domain = trimmed.slice(atIdx + 1);

  const corrected = EMAIL_TYPO_MAP[domain];
  if (!corrected) return null;

  return {
    hasTypo: true,
    originalDomain: domain,
    correctedDomain: corrected,
    correctedEmail: `${local}@${corrected}`,
  };
}

/**
 * Validate basic email format.
 */
export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim();
  // RFC-5322 simplified check
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}
