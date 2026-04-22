/**
 * dateResolver.ts
 * Parses natural language date expressions using chrono-node.
 * Scoped to the Apex Summit event window: April 25–27 2026.
 */

import * as chrono from 'chrono-node';

export interface DateParseResult {
  date: Date;
  iso: string;              // YYYY-MM-DD
  displayText: string;      // "Saturday, April 26, 2026 ✓"
  isInEventWindow: boolean; // Apr 25–27 2026
  dayOfWeek: string;
}

// Event window constants
const EVENT_START = new Date(2026, 3, 25); // April 25 2026 (month is 0-indexed)
const EVENT_END   = new Date(2026, 3, 27); // April 27 2026

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Parse a natural-language date expression.
 *
 * @example
 * parse('next Saturday') → DateParseResult for upcoming Saturday
 * parse('the 26th')      → DateParseResult for April 26 (contextual)
 * parse('April 26')      → DateParseResult for April 26 2026
 */
export function parse(input: string, referenceDate?: Date): DateParseResult | null {
  const ref = referenceDate ?? new Date();
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Use chrono to parse
  const results = chrono.parse(trimmed, ref, { forwardDate: true });
  if (!results.length) return null;

  const result = results[0];
  const date = result.start.date();

  return buildResult(date);
}

/**
 * Build a DateParseResult from a JS Date.
 */
export function buildResult(date: Date): DateParseResult {
  const dayOfWeek = DAY_NAMES[date.getDay()];
  const month = MONTH_NAMES[date.getMonth()];
  const day = date.getDate();
  const year = date.getFullYear();

  const iso = `${year}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const displayText = `✓ ${dayOfWeek}, ${month} ${day}, ${year}`;

  const isInEventWindow = date >= EVENT_START && date <= EVENT_END;

  return {
    date,
    iso,
    displayText,
    isInEventWindow,
    dayOfWeek,
  };
}

/**
 * Returns the three event dates as quick-pick chips.
 */
export function getEventDates(): DateParseResult[] {
  return [
    buildResult(new Date(2026, 3, 25)),
    buildResult(new Date(2026, 3, 26)),
    buildResult(new Date(2026, 3, 27)),
  ];
}

/**
 * Get short chip label: "Fri Apr 25"
 */
export function getChipLabel(result: DateParseResult): string {
  const shortDay = result.dayOfWeek.slice(0, 3);
  const month = MONTH_NAMES[result.date.getMonth()].slice(0, 3);
  return `${shortDay} ${month} ${result.date.getDate()}`;
}
