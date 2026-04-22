/**
 * claudeService.ts
 * Live Anthropic Claude API calls from the browser.
 *
 * - Uses claude-3-5-haiku-20241022
 * - Uses tool_use for guaranteed structured output
 * - Requires 'anthropic-dangerous-direct-browser-access: true' header
 * - Rate limited to 10 calls / 60 seconds
 * - Silently falls back to demoAIService on any error
 */

import type { AISuggestion, FieldConfig } from '../types';
import { claudeRateLimiter } from './rateLimiter';
import * as demoAIService from './demoAIService';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-3-5-haiku-20241022';

// ─── Tool Schema ──────────────────────────────────────────────────────────────

const FIELD_RESOLUTION_TOOL = {
  name: 'field_resolution',
  description: 'Resolve user input for a form field into structured data.',
  input_schema: {
    type: 'object',
    properties: {
      resolvedValue: {
        type: 'string',
        description: 'The normalised/resolved value (e.g. ISO country code, E.164 phone, ISO date)',
      },
      displayText: {
        type: 'string',
        description: 'Human-friendly display text for the UI (e.g. "✓ United Kingdom 🇬🇧")',
      },
      confidence: {
        type: 'string',
        enum: ['high', 'medium', 'low'],
        description: 'Confidence level of the resolution',
      },
      explanation: {
        type: 'string',
        description: 'Brief explanation of the resolution (optional)',
      },
      chips: {
        type: 'array',
        description: 'For extraction fields (dietary, sessions): array of extracted values',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string' },
            value: { type: 'string' },
            selected: { type: 'boolean' },
            aiSuggested: { type: 'boolean' },
          },
          required: ['label', 'value', 'selected', 'aiSuggested'],
        },
      },
      requiresConfirmation: {
        type: 'boolean',
        description: 'Whether the user should confirm this resolution',
      },
    },
    required: ['resolvedValue', 'displayText', 'confidence', 'requiresConfirmation'],
  },
};

// ─── Prompt builders ──────────────────────────────────────────────────────────

function buildSystemPrompt(): string {
  return `You are FormFlow's AI field resolver. Your job is to parse and normalise user form input.

Rules:
- Always use the field_resolution tool to return structured data
- Be permissive: accept any reasonable format of input
- For country fields: resolve to ISO 3166-1 alpha-2 codes
- For phone fields: resolve to E.164 format
- For date fields: resolve to ISO 8601 (YYYY-MM-DD)
- For email fields: detect common typos and suggest corrections
- For name fields: parse into first and last name
- For dietary fields: extract dietary requirements as chips
- For session fields: match to session track IDs based on user interests
- Confidence should reflect how certain you are: high if clear match, medium if reasonable inference, low if guessing
- requiresConfirmation should be true only for corrections (email typos, ambiguous resolutions)
- Keep displayText concise and human-friendly`;
}

function buildUserPrompt(config: FieldConfig, rawValue: string, context?: Record<string, string>): string {
  const lines = [
    `Field: ${config.label}`,
    `Type: ${config.type}`,
    `User input: "${rawValue}"`,
  ];

  if (config.justification) {
    lines.push(`Purpose: ${config.justification}`);
  }

  if (context && Object.keys(context).length > 0) {
    lines.push(`Previously entered fields: ${JSON.stringify(context)}`);
  }

  if (config.type === 'textarea' && config.id.includes('session')) {
    lines.push(`Available session tracks: AI & Machine Learning (ai_ml), Product Design (product_design), UX Research (ux_research), Engineering Leadership (engineering), Startups & Funding (startups)`);
  }

  return lines.join('\n');
}

// ─── API call ─────────────────────────────────────────────────────────────────

interface ClaudeToolInput {
  resolvedValue: string;
  displayText: string;
  confidence: 'high' | 'medium' | 'low';
  explanation?: string;
  chips?: Array<{ label: string; value: string; selected: boolean; aiSuggested: boolean }>;
  requiresConfirmation: boolean;
}

/**
 * Call Claude API with structured tool_use output.
 * Returns null on any error (rate limit, network, invalid key, etc.).
 */
async function callClaude(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
): Promise<ClaudeToolInput | null> {
  const rateLimitResult = claudeRateLimiter.check();
  if (!rateLimitResult.allowed) {
    const resetSec = Math.ceil(rateLimitResult.resetInMs / 1000);
    console.warn(`[FormFlow] Rate limit exceeded. Resets in ${resetSec}s. Falling back to demo mode.`);
    return null;
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: systemPrompt,
      tools: [FIELD_RESOLUTION_TOOL],
      tool_choice: { type: 'tool', name: 'field_resolution' },
      messages: [
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (response.status === 401) {
    // Bubble up 401 so the caller can notify the user
    throw new ApiKeyError('Invalid Anthropic API key. Please check your key and try again.');
  }

  if (!response.ok) {
    console.warn(`[FormFlow] Claude API error: ${response.status} ${response.statusText}`);
    return null;
  }

  const data = await response.json() as {
    content: Array<{
      type: string;
      name?: string;
      input?: ClaudeToolInput;
    }>;
  };

  // Find the tool_use block
  const toolUse = data.content.find(block => block.type === 'tool_use' && block.name === 'field_resolution');
  if (!toolUse?.input) {
    console.warn('[FormFlow] Claude returned no tool_use block');
    return null;
  }

  return toolUse.input;
}

// ─── Error types ──────────────────────────────────────────────────────────────

export class ApiKeyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ApiKeyError';
  }
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Resolve a form field using Claude (live AI mode).
 *
 * Falls back to demoAIService on any error except 401 (invalid key).
 * On 401: throws ApiKeyError so the UI can prompt for a new key.
 *
 * @param config - Field configuration
 * @param rawValue - Raw user input
 * @param apiKey - Anthropic API key
 * @param context - Optional map of previously resolved fields
 */
export async function resolve(
  config: FieldConfig,
  rawValue: string,
  apiKey: string,
  context?: Record<string, string>,
): Promise<AISuggestion | null> {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;

  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(config, trimmed, context);

  let toolInput: ClaudeToolInput | null = null;

  try {
    toolInput = await callClaude(systemPrompt, userPrompt, apiKey);
  } catch (err) {
    if (err instanceof ApiKeyError) {
      throw err; // Re-throw so UI can handle key invalidation
    }
    console.warn('[FormFlow] Claude call failed, falling back to demo:', err);
    // Fall through to demo fallback below
  }

  if (!toolInput) {
    // Silent fallback to demo mode
    return demoAIService.resolve(config, rawValue);
  }

  return {
    fieldId: config.id,
    type: toolInput.requiresConfirmation ? 'correction' : 'resolution',
    rawInput: rawValue,
    resolvedValue: toolInput.resolvedValue,
    displayText: toolInput.displayText,
    confidence: toolInput.confidence,
    chips: toolInput.chips,
    requiresConfirmation: toolInput.requiresConfirmation,
    latencyMs: 0, // Actual network latency — not simulated
  };
}

/**
 * Convenience: get remaining API calls before rate limit.
 */
export function getRemainingCalls(): number {
  return claudeRateLimiter.getRemainingCalls();
}
