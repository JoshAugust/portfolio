/**
 * precomputedResponses.ts
 * Pre-computed AI response mappings for demo mode.
 * These cover the "hero moments" shown in the build spec.
 */

import type { PrecomputedDatabase } from '../types';

/**
 * Simulated latency timing (ms).
 * Format: [base, jitter]
 */
export const DEMO_LATENCY = {
  name:     { base: 80,  jitter: 20 },
  email:    { base: 150, jitter: 30 },
  phone:    { base: 50,  jitter: 10 },
  country:  { base: 120, jitter: 25 },
  date:     { base: 100, jitter: 20 },
  dietary:  { base: 200, jitter: 40 },
  sessions: { base: 350, jitter: 70 },
} as const;

/**
 * Apply jitter to a base delay: base ± jitter
 */
export function withJitter(base: number, jitter: number): number {
  return base + (Math.random() - 0.5) * 2 * jitter;
}

/**
 * Pre-computed responses keyed by fieldId.
 * Each entry is an array of pattern→response pairs.
 * The demo service checks these before falling through to resolvers.
 */
export const PRECOMPUTED_RESPONSES: PrecomputedDatabase = {
  name: [
    {
      inputPattern: /^josh\s+augustine$/i,
      response: {
        fieldId: 'name',
        type: 'resolution',
        resolvedValue: JSON.stringify({ first: 'Josh', last: 'Augustine' }),
        displayText: '✓ First: Josh · Last: Augustine',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(80, 20),
      },
    },
    {
      inputPattern: /^cher$/i,
      response: {
        fieldId: 'name',
        type: 'resolution',
        resolvedValue: JSON.stringify({ first: 'Cher', last: null }),
        displayText: '✓ Name: Cher (mononym recorded)',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(80, 20),
      },
    },
  ],
  email: [
    {
      inputPattern: /^(.+)@gmial\.com$/i,
      response: {
        fieldId: 'email',
        type: 'correction',
        resolvedValue: '',  // will be filled by resolver
        displayText: 'Did you mean @gmail.com?',
        confidence: 'high',
        requiresConfirmation: true,
        latencyMs: withJitter(150, 30),
      },
    },
    {
      inputPattern: /^(.+)@gmail\.com$/i,
      response: {
        fieldId: 'email',
        type: 'confirmation',
        resolvedValue: '',  // will be filled by resolver
        displayText: '✓ Valid email address',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(150, 30),
      },
    },
  ],
  phone: [
    {
      inputPattern: /^07911\s*123\s*456$/,
      response: {
        fieldId: 'phone',
        type: 'resolution',
        resolvedValue: '+447911123456',
        displayText: '✓ UK Mobile: +44 7911 123456',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(50, 10),
      },
    },
    {
      inputPattern: /^\(212\)\s*555-0100$/,
      response: {
        fieldId: 'phone',
        type: 'resolution',
        resolvedValue: '+12125550100',
        displayText: '✓ US: +1 212 555 0100',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(50, 10),
      },
    },
  ],
  country: [
    {
      inputPattern: /^england$/i,
      response: {
        fieldId: 'country',
        type: 'resolution',
        resolvedValue: 'GB',
        displayText: '🇬🇧 United Kingdom',
        emoji: '🇬🇧',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(120, 25),
      },
    },
    {
      inputPattern: /^(uk|britain|great britain|united kingdom)$/i,
      response: {
        fieldId: 'country',
        type: 'resolution',
        resolvedValue: 'GB',
        displayText: '🇬🇧 United Kingdom',
        emoji: '🇬🇧',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(120, 25),
      },
    },
    {
      inputPattern: /^(us|usa|america|united states)$/i,
      response: {
        fieldId: 'country',
        type: 'resolution',
        resolvedValue: 'US',
        displayText: '🇺🇸 United States',
        emoji: '🇺🇸',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(120, 25),
      },
    },
    {
      inputPattern: /^(holland|netherlands)$/i,
      response: {
        fieldId: 'country',
        type: 'resolution',
        resolvedValue: 'NL',
        displayText: '🇳🇱 Netherlands',
        emoji: '🇳🇱',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(120, 25),
      },
    },
    {
      inputPattern: /^austrailia$/i,
      response: {
        fieldId: 'country',
        type: 'resolution',
        resolvedValue: 'AU',
        displayText: '🇦🇺 Australia',
        emoji: '🇦🇺',
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(120, 25),
      },
    },
  ],
  dietary: [
    {
      inputPattern: /vegetarian.*fish|no meat.*fish|pescatarian/i,
      response: {
        fieldId: 'dietary',
        type: 'extraction',
        resolvedValue: JSON.stringify(['pescatarian', 'nut-free']),
        displayText: 'Extracted: Pescatarian, Nut-free',
        chips: [
          { label: 'Pescatarian', value: 'pescatarian', selected: true, aiSuggested: true },
          { label: 'Nut-free', value: 'nut-free', selected: true, aiSuggested: true },
        ],
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(200, 40),
      },
    },
    {
      inputPattern: /^(none|no|nothing|n\/a|na|no requirements|anything)$/i,
      response: {
        fieldId: 'dietary',
        type: 'confirmation',
        resolvedValue: JSON.stringify(['no requirements']),
        displayText: 'No dietary requirements noted',
        chips: [
          { label: 'No requirements', value: 'no requirements', selected: true, aiSuggested: false },
        ],
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: withJitter(200, 40),
      },
    },
  ],
};
