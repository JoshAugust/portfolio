/**
 * nameResolver.ts
 * Parses a name string into first and last components.
 *
 * Heuristics:
 * - 1 word  → mononym { first: word, last: null }
 * - 2 words → { first: words[0], last: words[1] }
 * - 3+ words → { first: words[0], last: remaining joined }
 */

export interface NameParseResult {
  first: string;
  last: string | null;
  isMononym: boolean;
  displayText: string;
}

/**
 * Parse a full name string into first/last components.
 *
 * @example
 * parse('Josh Augustine') → { first: 'Josh', last: 'Augustine', isMononym: false }
 * parse('Cher')           → { first: 'Cher', last: null, isMononym: true }
 * parse('Mary Van Buren') → { first: 'Mary', last: 'Van Buren', isMononym: false }
 */
export function parse(input: string): NameParseResult | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Split on whitespace, filter empty tokens
  const parts = trimmed.split(/\s+/).filter(Boolean);

  if (parts.length === 0) return null;

  if (parts.length === 1) {
    return {
      first: parts[0],
      last: null,
      isMononym: true,
      displayText: `✓ Name: ${parts[0]} (mononym recorded)`,
    };
  }

  const first = parts[0];
  const last = parts.slice(1).join(' ');

  return {
    first,
    last,
    isMononym: false,
    displayText: `✓ First: ${first} · Last: ${last}`,
  };
}
