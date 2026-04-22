/**
 * demoAIService.ts
 * Pre-computed + library-based AI simulation.
 * Makes zero network requests — everything is local.
 *
 * Resolution chain:
 * 1. Check precomputedResponses for exact/regex match
 * 2. Route by field type to the appropriate resolver
 * 3. Simulate latency with jitter
 * 4. Return AISuggestion or null
 */

import type { AISuggestion, FieldConfig, SuggestionChip } from '../types';
import { PRECOMPUTED_RESPONSES, DEMO_LATENCY, withJitter } from '../data/precomputedResponses';
import { SESSION_TRACKS } from '../data/sessionTracks';
import * as emailResolver from './resolvers/emailResolver';
import * as phoneResolver from './resolvers/phoneResolver';
import * as dateResolver from './resolvers/dateResolver';
import * as countryResolver from './resolvers/countryResolver';
import * as nameResolver from './resolvers/nameResolver';
import * as dietaryResolver from './resolvers/dietaryResolver';

/**
 * Simulated delay with jitter.
 */
function simulateLatency(base: number, jitter: number): Promise<void> {
  const delay = withJitter(base, jitter);
  return new Promise(resolve => setTimeout(resolve, delay));
}

/**
 * Check precomputed responses for a given fieldId and input.
 * Supports both string equality and RegExp matching.
 */
function checkPrecomputed(fieldId: string, rawValue: string): AISuggestion | null {
  const entries = PRECOMPUTED_RESPONSES[fieldId];
  if (!entries) return null;

  for (const entry of entries) {
    let matched = false;
    if (typeof entry.inputPattern === 'string') {
      matched = entry.inputPattern.toLowerCase() === rawValue.trim().toLowerCase();
    } else {
      matched = entry.inputPattern.test(rawValue);
    }

    if (matched) {
      // For email patterns that have empty resolvedValue, fill it in
      const response = { ...entry.response, rawInput: rawValue };
      if (response.resolvedValue === '' && fieldId === 'email') {
        const typo = emailResolver.checkTypo(rawValue);
        if (typo) {
          response.resolvedValue = typo.correctedEmail;
          response.displayText = `Did you mean ${typo.correctedEmail}?`;
        } else {
          response.resolvedValue = rawValue.trim();
        }
      }
      return response as AISuggestion;
    }
  }

  return null;
}

/**
 * Match session tracks by keyword scoring.
 * Returns matched tracks sorted by score, pre-selected.
 */
function resolveSessionTracks(input: string): SuggestionChip[] {
  const lower = input.toLowerCase();
  const scores: Array<{ id: string; name: string; score: number }> = [];

  for (const track of SESSION_TRACKS) {
    let score = 0;
    for (const keyword of track.keywords) {
      if (lower.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }
    if (score > 0) {
      scores.push({ id: track.id, name: track.name, score });
    }
  }

  scores.sort((a, b) => b.score - a.score);

  return scores.map(s => ({
    label: `✦ ${s.name}`,
    value: s.id,
    selected: true,
    aiSuggested: true,
  }));
}

/**
 * Core resolution function.
 * Handles all field types in demo mode.
 *
 * @param config - The field configuration
 * @param rawValue - The raw user input
 * @returns AISuggestion or null
 */
export async function resolve(
  config: FieldConfig,
  rawValue: string,
): Promise<AISuggestion | null> {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  // Step 1: Check precomputed responses (fast path for demo "hero moments")
  const precomputed = checkPrecomputed(config.id, trimmed);
  if (precomputed) {
    await simulateLatency(precomputed.latencyMs, 0);
    return precomputed;
  }

  // Step 2: Route by field type
  switch (config.type) {
    case 'text': {
      // Name parsing (assume all text fields are names unless specified otherwise)
      await simulateLatency(DEMO_LATENCY.name.base, DEMO_LATENCY.name.jitter);
      const result = nameResolver.parse(trimmed);
      if (!result) return null;
      return {
        fieldId: config.id,
        type: 'resolution',
        rawInput: rawValue,
        resolvedValue: JSON.stringify({ first: result.first, last: result.last }),
        displayText: result.displayText,
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: DEMO_LATENCY.name.base,
      };
    }

    case 'email': {
      await simulateLatency(DEMO_LATENCY.email.base, DEMO_LATENCY.email.jitter);
      const typo = emailResolver.checkTypo(trimmed);
      if (typo) {
        return {
          fieldId: config.id,
          type: 'correction',
          rawInput: rawValue,
          resolvedValue: typo.correctedEmail,
          displayText: `Did you mean ${typo.correctedEmail}?`,
          confidence: 'high',
          requiresConfirmation: true,
          latencyMs: DEMO_LATENCY.email.base,
        };
      }
      // Valid email — just confirm
      if (emailResolver.isValidEmailFormat(trimmed)) {
        return {
          fieldId: config.id,
          type: 'confirmation',
          rawInput: rawValue,
          resolvedValue: trimmed,
          displayText: `✓ ${trimmed}`,
          confidence: 'high',
          requiresConfirmation: false,
          latencyMs: DEMO_LATENCY.email.base,
        };
      }
      return null;
    }

    case 'phone': {
      await simulateLatency(DEMO_LATENCY.phone.base, DEMO_LATENCY.phone.jitter);
      const result = phoneResolver.normalize(trimmed);
      if (!result) return null;
      return {
        fieldId: config.id,
        type: 'resolution',
        rawInput: rawValue,
        resolvedValue: result.e164,
        displayText: phoneResolver.getDisplayLabel(result),
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: DEMO_LATENCY.phone.base,
      };
    }

    case 'country': {
      await simulateLatency(DEMO_LATENCY.country.base, DEMO_LATENCY.country.jitter);
      const result = countryResolver.resolve(trimmed);
      if (!result) return null;
      return {
        fieldId: config.id,
        type: 'resolution',
        rawInput: rawValue,
        resolvedValue: result.code,
        displayText: result.displayText,
        emoji: result.flag,
        confidence: result.fuzzyScore !== undefined && result.fuzzyScore > 0.1 ? 'medium' : 'high',
        requiresConfirmation: false,
        latencyMs: DEMO_LATENCY.country.base,
      };
    }

    case 'date': {
      await simulateLatency(DEMO_LATENCY.date.base, DEMO_LATENCY.date.jitter);
      const result = dateResolver.parse(trimmed);
      if (!result) return null;
      return {
        fieldId: config.id,
        type: 'resolution',
        rawInput: rawValue,
        resolvedValue: result.iso,
        displayText: result.displayText,
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: DEMO_LATENCY.date.base,
      };
    }

    case 'textarea': {
      // Detect whether this is a dietary or session field by ID
      if (config.id === 'dietary' || config.id.includes('diet')) {
        await simulateLatency(DEMO_LATENCY.dietary.base, DEMO_LATENCY.dietary.jitter);
        const flags = dietaryResolver.extractOrNull(trimmed);
        if (flags === null) return null; // unrecognised — defer to LLM in live mode
        if (flags.length === 0) return null;

        const chips: SuggestionChip[] = flags.map(flag => ({
          label: flag === 'no requirements' ? 'No requirements' : capitalise(flag),
          value: flag,
          selected: true,
          aiSuggested: false,
        }));

        return {
          fieldId: config.id,
          type: 'extraction',
          rawInput: rawValue,
          resolvedValue: JSON.stringify(flags),
          displayText: `Extracted: ${flags.map(capitalise).join(', ')}`,
          chips,
          confidence: 'high',
          requiresConfirmation: false,
          latencyMs: DEMO_LATENCY.dietary.base,
        };
      }

      // Default: session track matching
      if (config.id === 'sessions' || config.id.includes('session')) {
        await simulateLatency(DEMO_LATENCY.sessions.base, DEMO_LATENCY.sessions.jitter);
        const chips = resolveSessionTracks(trimmed);
        if (chips.length === 0) return null;

        const trackNames = chips.map(c => c.label.replace('✦ ', '')).join(', ');
        return {
          fieldId: config.id,
          type: 'extraction',
          rawInput: rawValue,
          resolvedValue: JSON.stringify(chips.map(c => c.value)),
          displayText: `Suggested sessions: ${trackNames}`,
          chips,
          confidence: 'high',
          requiresConfirmation: false,
          latencyMs: DEMO_LATENCY.sessions.base,
        };
      }

      return null;
    }

    default:
      return null;
  }
}

function capitalise(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
