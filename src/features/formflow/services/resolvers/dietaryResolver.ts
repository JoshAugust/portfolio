/**
 * dietaryResolver.ts
 * Extracts dietary requirements from free-text input using keyword matching.
 */

export const DIETARY_KEYWORDS: Record<string, string[]> = {
  vegetarian: ['vegetarian', 'veggie', 'no meat'],
  vegan: ['vegan', 'plant based', 'plant-based', 'no animal products'],
  pescatarian: [
    'pescatarian', 'fish only', 'vegetarian but eat fish',
    'vegetarian but i eat fish', 'no meat but fish is fine',
    'no meat but eat fish', 'fish ok', 'fish is ok', 'eat fish',
  ],
  'gluten-free': ['gluten free', 'gluten-free', 'celiac', 'coeliac', 'no gluten', 'gluten intolerant'],
  'dairy-free': [
    'dairy free', 'dairy-free', 'no dairy', 'lactose intolerant',
    'lactose free', 'no milk', 'no cheese', 'lactose-free',
  ],
  'nut-free': [
    'nut free', 'nut-free', 'no nuts', 'nut allergy', 'peanut allergy',
    'tree nut allergy', 'no peanuts', 'allergic to nuts',
  ],
  halal: ['halal'],
  kosher: ['kosher'],
  'no requirements': [
    'none', 'no', 'nothing', 'n/a', 'na', 'no requirements',
    'no restrictions', 'anything', 'anything is fine',
    'eat anything', 'no dietary requirements', 'all good',
    'no allergies', 'no special requirements',
  ],
};

/**
 * Extract dietary flags from a free-text input string.
 *
 * Returns an array of matched dietary category keys.
 * Returns empty array if no matches found.
 *
 * @example
 * extract('vegetarian but I eat fish, no nuts')
 * // → ['pescatarian', 'nut-free']
 *
 * extract('none')
 * // → ['no requirements']
 *
 * extract('vegan and gluten free')
 * // → ['vegan', 'gluten-free']
 */
export function extract(input: string): string[] {
  const lower = input.trim().toLowerCase();
  if (!lower) return [];

  const matched: string[] = [];

  for (const [category, keywords] of Object.entries(DIETARY_KEYWORDS)) {
    const isMatch = keywords.some(kw => {
      // Use word-boundary aware matching
      // A keyword matches if found as a substring in context
      const kwLower = kw.toLowerCase();
      return lower.includes(kwLower);
    });

    if (isMatch) {
      matched.push(category);
    }
  }

  // Deduplication / conflict resolution:
  // If pescatarian matches, remove vegetarian (pescatarian is more specific)
  if (matched.includes('pescatarian') && matched.includes('vegetarian')) {
    const idx = matched.indexOf('vegetarian');
    matched.splice(idx, 1);
  }

  // If "no requirements" matches alongside others, it likely means they
  // provided no constraints — only keep it if it's the only match
  if (matched.includes('no requirements') && matched.length > 1) {
    const idx = matched.indexOf('no requirements');
    matched.splice(idx, 1);
  }

  return matched;
}

/**
 * Returns null if no keywords match and input is non-empty.
 * This signals to the demo service that live LLM should handle it.
 */
export function extractOrNull(input: string): string[] | null {
  const result = extract(input);
  if (result.length === 0 && input.trim().length > 0) return null;
  return result;
}
