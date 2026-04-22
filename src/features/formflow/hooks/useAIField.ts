/**
 * useAIField.ts
 * Core AI pipeline hook + state machine for AI-enhanced form fields.
 *
 * State machine:
 * EMPTY → onChange → TYPING
 * TYPING → onBlur → PROCESSING
 * PROCESSING → (suggestion found, requiresConfirmation) → SUGGESTION
 * PROCESSING → (suggestion found, auto-accept) → VALIDATED
 * PROCESSING → (no suggestion, valid) → VALIDATED
 * PROCESSING → (validation failed) → ERROR
 * SUGGESTION → onAccept → VALIDATED
 * SUGGESTION → onReject → TYPING
 */

import { useCallback, useRef, useState } from 'react';
import type { AISuggestion, FieldConfig, FieldState, FormFlowContextValue } from '../types';
import * as demoAIService from '../services/demoAIService';
import * as claudeService from '../services/claudeService';

function createInitialState(fieldId: string): FieldState {
  return {
    fieldId,
    status: 'empty',
    rawValue: '',
    resolvedValue: null,
    displayValue: null,
    suggestion: null,
    errorMessage: null,
    touchedAt: null,
    resolvedAt: null,
  };
}

export function useAIField(config: FieldConfig, context: FormFlowContextValue) {
  const [state, setState] = useState<FieldState>(() => createInitialState(config.id));
  const processingRef = useRef(false);

  const onChange = useCallback((value: string) => {
    setState(prev => ({
      ...prev,
      rawValue: value,
      status: value.trim() ? 'typing' : 'empty',
      suggestion: null,
      errorMessage: null,
    }));
  }, []);

  const onBlur = useCallback(async () => {
    const currentRaw = state.rawValue.trim();
    if (!currentRaw) {
      if (config.validation.required) {
        setState(prev => ({
          ...prev,
          status: 'error',
          errorMessage: 'This field is required.',
        }));
      }
      return;
    }

    // Avoid double-processing
    if (processingRef.current) return;
    processingRef.current = true;

    setState(prev => ({
      ...prev,
      status: 'processing',
      touchedAt: prev.touchedAt ?? Date.now(),
    }));

    try {
      let suggestion: AISuggestion | null = null;

      // Route to live Claude service if in live mode with an API key
      if (context.mode === 'live' && context.apiKey) {
        try {
          suggestion = await claudeService.resolve(config, currentRaw, context.apiKey);
        } catch (err) {
          if (err instanceof claudeService.ApiKeyError) {
            // Key is invalid — clear it and fall back to demo
            context.clearApiKey();
            console.warn('[FormFlow] API key invalid, cleared. Falling back to demo mode.');
          }
          // Fall through to demo fallback
          suggestion = await demoAIService.resolve(config, currentRaw);
        }
      } else {
        // Demo mode — no network calls
        suggestion = await demoAIService.resolve(config, currentRaw);
      }

      if (suggestion) {
        if (suggestion.requiresConfirmation) {
          setState(prev => ({
            ...prev,
            status: 'suggestion',
            suggestion,
          }));
        } else {
          // Auto-accept
          setState(prev => ({
            ...prev,
            status: 'validated',
            suggestion,
            resolvedValue: suggestion!.resolvedValue,
            displayValue: suggestion!.displayText,
            resolvedAt: Date.now(),
          }));
        }
      } else {
        // No suggestion — validate directly
        setState(prev => ({
          ...prev,
          status: 'validated',
          resolvedValue: currentRaw,
          displayValue: currentRaw,
          resolvedAt: Date.now(),
        }));
      }
    } catch {
      setState(prev => ({
        ...prev,
        status: 'validated',
        resolvedValue: currentRaw,
        displayValue: currentRaw,
        resolvedAt: Date.now(),
      }));
    } finally {
      processingRef.current = false;
    }
  }, [state.rawValue, config, context]);

  const onAcceptSuggestion = useCallback(() => {
    setState(prev => {
      if (!prev.suggestion) return prev;
      return {
        ...prev,
        status: 'validated',
        rawValue: prev.suggestion.resolvedValue,
        resolvedValue: prev.suggestion.resolvedValue,
        displayValue: prev.suggestion.displayText,
        resolvedAt: Date.now(),
      };
    });
  }, []);

  const onRejectSuggestion = useCallback(() => {
    setState(prev => ({
      ...prev,
      status: 'typing',
      suggestion: null,
    }));
  }, []);

  // Allow direct state override (for specialized inputs like date chips, session chips)
  const setFieldState = useCallback((updater: (prev: FieldState) => FieldState) => {
    setState(updater);
  }, []);

  return {
    state,
    onChange,
    onBlur,
    onAcceptSuggestion,
    onRejectSuggestion,
    setFieldState,
  };
}
