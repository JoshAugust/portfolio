/**
 * countryResolver.ts
 * Resolves free-text country input to an ISO 3166-1 alpha-2 code.
 *
 * Resolution chain:
 * 1. Exact alias match (case-insensitive)
 * 2. Fuse.js fuzzy search on name + aliases (threshold: 0.3)
 */

import Fuse from 'fuse.js';
import { COUNTRIES } from '../../data/countries';
import type { CountryEntry } from '../../types';

export interface CountryResolveResult {
  code: string;
  name: string;
  flag: string;
  displayText: string;
  matchedAlias?: string;
  fuzzyScore?: number;
}

// Pre-build a flat lookup map of alias → CountryEntry
const ALIAS_MAP = new Map<string, CountryEntry>();
for (const country of COUNTRIES) {
  for (const alias of country.aliases) {
    ALIAS_MAP.set(alias.toLowerCase().trim(), country);
  }
  // Also index by ISO code (lowercase)
  ALIAS_MAP.set(country.code.toLowerCase(), country);
}

// Pre-build Fuse.js index for fuzzy search
// We flatten aliases so each alias is a searchable item
interface FuseItem {
  alias: string;
  code: string;
}

const fuseItems: FuseItem[] = [];
for (const country of COUNTRIES) {
  fuseItems.push({ alias: country.name, code: country.code });
  for (const alias of country.aliases) {
    fuseItems.push({ alias, code: country.code });
  }
}

const fuse = new Fuse(fuseItems, {
  keys: ['alias'],
  threshold: 0.3,
  includeScore: true,
});

/**
 * Look up a CountryEntry by its ISO alpha-2 code.
 */
function findByCode(code: string): CountryEntry | undefined {
  return COUNTRIES.find(c => c.code === code.toUpperCase());
}

/**
 * Resolve a user-typed string to a country.
 *
 * @example
 * resolve('England') → { code: 'GB', name: 'United Kingdom', flag: '🇬🇧', ... }
 * resolve('Austrailia') → { code: 'AU', name: 'Australia', flag: '🇦🇺', ... }
 * resolve('US') → { code: 'US', name: 'United States', flag: '🇺🇸', ... }
 */
export function resolve(input: string): CountryResolveResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const normalized = trimmed.toLowerCase();

  // Step 1: exact alias match
  const exactMatch = ALIAS_MAP.get(normalized);
  if (exactMatch) {
    return {
      code: exactMatch.code,
      name: exactMatch.name,
      flag: exactMatch.flag,
      displayText: `${exactMatch.flag} ${exactMatch.name}`,
      matchedAlias: trimmed,
    };
  }

  // Step 2: Fuse.js fuzzy search
  const fuseResults = fuse.search(trimmed);
  if (fuseResults.length > 0) {
    const best = fuseResults[0];
    const country = findByCode(best.item.code);
    if (country) {
      return {
        code: country.code,
        name: country.name,
        flag: country.flag,
        displayText: `${country.flag} ${country.name}`,
        matchedAlias: best.item.alias,
        fuzzyScore: best.score,
      };
    }
  }

  return null;
}

/**
 * Get suggestions for a partial input (for autocomplete UI).
 * Returns up to `limit` results sorted by Fuse score.
 */
export function suggest(input: string, limit = 5): CountryResolveResult[] {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length < 1) return [];

  const results = fuse.search(trimmed, { limit: limit * 3 });

  // Deduplicate by country code, keeping best score
  const seen = new Map<string, CountryResolveResult>();
  for (const r of results) {
    const country = findByCode(r.item.code);
    if (!country) continue;
    if (!seen.has(country.code)) {
      seen.set(country.code, {
        code: country.code,
        name: country.name,
        flag: country.flag,
        displayText: `${country.flag} ${country.name}`,
        matchedAlias: r.item.alias,
        fuzzyScore: r.score,
      });
    }
    if (seen.size >= limit) break;
  }

  return Array.from(seen.values());
}
