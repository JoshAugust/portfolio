/**
 * AIField.tsx
 * AI-enhanced field wrapper — handles progressive reveal, state machine rendering,
 * thinking indicators, suggestion bubbles, and confirmation chips.
 */

import { useCallback, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { AISuggestion, FieldConfig, FieldState, SuggestionChip } from '../../types';
import { FieldLabel } from '../shared/FieldLabel';
import { FieldError } from '../shared/FieldError';
import { AIThinkingIndicator } from './AIThinkingIndicator';
import { AISuggestionBubble } from './AISuggestionBubble';
import { ConfirmationChip } from './ConfirmationChip';
import { AICountryInput } from './AICountryInput';
import { AIDateInput } from './AIDateInput';
import { AIPhoneInput } from './AIPhoneInput';
import { AISessionInput } from './AISessionInput';
import { AIDietaryInput } from './AIDietaryInput';
import { useStruggleDetection } from '../../hooks/useStruggleDetection';
import { AI_TIMING } from '../../config/timing';

interface AIFieldProps {
  config: FieldConfig;
  state: FieldState;
  onResolve: (suggestion: AISuggestion) => void;
  onAccept: () => void;
  onReject: () => void;
  onChange: (value: string) => void;
  onBlur: () => void;
  onSetFieldState: (updater: (prev: FieldState) => FieldState) => void;
  isActive: boolean;
  isCompleted: boolean;
  sessionChips: SuggestionChip[];
  dietaryChips: SuggestionChip[];
  onSessionChipsChange: (tracks: string[], chips: SuggestionChip[]) => void;
  onDietaryChipRemove: (value: string) => void;
}

const reducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AIField({
  config,
  state,
  onResolve,
  onAccept,
  onReject,
  onChange,
  onBlur,
  onSetFieldState,
  isActive,
  isCompleted,
  sessionChips,
  dietaryChips,
  onSessionChipsChange,
  onDietaryChipRemove,
}: AIFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { isStruggling, attachListeners, detachListeners } = useStruggleDetection(config.id);

  // Auto-focus when field becomes active
  useEffect(() => {
    if (isActive && inputRef.current) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, AI_TIMING.autoAdvanceDelay / 2);
      return () => clearTimeout(timer);
    }
  }, [isActive]);

  // Attach struggle detection to the input
  useEffect(() => {
    if (inputRef.current && isActive) {
      attachListeners(inputRef.current);
      return () => detachListeners();
    }
  }, [isActive, attachListeners, detachListeners]);

  // ─── Completed state: render as confirmation chip ─────────────────
  if (isCompleted && !isActive) {
    const chipText = state.displayValue || state.resolvedValue || state.rawValue;
    const chipEmoji = state.suggestion?.emoji;
    const variant = state.suggestion?.type === 'correction' ? 'warning' as const : 'success' as const;

    return (
      <motion.div
        initial={reducedMotion ? undefined : { opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        transition={{ duration: 0.2 }}
        className="mb-2"
      >
        <span className="text-xs text-[#545B72] mr-2">{config.label}</span>
        <ConfirmationChip emoji={chipEmoji} text={chipText || ''} variant={variant} />
      </motion.div>
    );
  }

  // ─── Not active and not completed: hidden ─────────────────────────
  if (!isActive) return null;

  // ─── Active state: full input ─────────────────────────────────────
  const errorId = `${config.id}-error`;
  const isProcessing = state.status === 'processing';
  const hasSuggestion = state.status === 'suggestion' && state.suggestion !== null;
  const hasError = state.status === 'error' && !!state.errorMessage;

  const handleCountryResolve = useCallback((code: string, displayText: string, emoji: string) => {
    onSetFieldState(prev => ({
      ...prev,
      status: 'validated',
      resolvedValue: code,
      displayValue: displayText,
      suggestion: {
        fieldId: config.id,
        type: 'resolution',
        rawInput: prev.rawValue,
        resolvedValue: code,
        displayText,
        emoji,
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: 0,
      },
      resolvedAt: Date.now(),
    }));
  }, [config.id, onSetFieldState]);

  const handleDateResolve = useCallback((iso: string, displayText: string) => {
    onSetFieldState(prev => ({
      ...prev,
      status: 'validated',
      rawValue: iso,
      resolvedValue: iso,
      displayValue: displayText,
      resolvedAt: Date.now(),
    }));
  }, [onSetFieldState]);

  const renderInput = () => {
    switch (config.type) {
      case 'country':
        return (
          <AICountryInput
            id={config.id}
            value={state.rawValue}
            onChange={onChange}
            onResolve={handleCountryResolve}
            placeholder={config.placeholder}
            disabled={isProcessing}
          />
        );

      case 'date':
        return (
          <AIDateInput
            id={config.id}
            value={state.rawValue}
            onChange={onChange}
            onResolve={handleDateResolve}
            disabled={isProcessing}
          />
        );

      case 'phone':
        return (
          <AIPhoneInput
            id={config.id}
            value={state.rawValue}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={config.placeholder}
            disabled={isProcessing}
          />
        );

      case 'textarea':
        if (config.id === 'sessions' || config.id.includes('session')) {
          return (
            <AISessionInput
              id={config.id}
              value={state.rawValue}
              onChange={onChange}
              onResolve={onSessionChipsChange}
              chips={sessionChips}
              disabled={isProcessing}
            />
          );
        }
        if (config.id === 'dietary' || config.id.includes('diet')) {
          return (
            <AIDietaryInput
              id={config.id}
              value={state.rawValue}
              onChange={onChange}
              onBlur={onBlur}
              chips={dietaryChips}
              onRemoveChip={onDietaryChipRemove}
              disabled={isProcessing}
            />
          );
        }
        return (
          <textarea
            id={config.id}
            value={state.rawValue}
            onChange={e => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={config.placeholder}
            disabled={isProcessing}
            rows={3}
            className="w-full rounded-lg border px-3 py-2.5 text-sm bg-[#1E2333] text-[#F0F2F8] placeholder:text-[#545B72] border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors duration-150 resize-none"
          />
        );

      default:
        return (
          <input
            ref={inputRef}
            id={config.id}
            type={config.type === 'email' ? 'email' : 'text'}
            value={state.rawValue}
            onChange={e => onChange(e.target.value)}
            onBlur={onBlur}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onBlur();
              }
            }}
            placeholder={config.placeholder}
            disabled={isProcessing}
            autoComplete={config.autocomplete || 'off'}
            aria-required={config.required}
            aria-invalid={hasError || undefined}
            aria-describedby={hasError ? errorId : undefined}
            className="w-full rounded-lg border px-3 py-2.5 text-sm bg-[#1E2333] text-[#F0F2F8] placeholder:text-[#545B72] border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF] transition-colors duration-150"
          />
        );
    }
  };

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      className="mb-4"
    >
      <FieldLabel htmlFor={config.id} required={config.required}>
        {config.label}
        {config.justification && (
          <span
            title={config.justification}
            className="ml-1.5 cursor-help text-[#6C63FF] text-xs"
            aria-label={`More info: ${config.justification}`}
          >
            ℹ
          </span>
        )}
      </FieldLabel>

      {renderInput()}

      {/* Thinking indicator */}
      <AIThinkingIndicator
        visible={isProcessing}
        mode={isProcessing ? 'dots' : 'shimmer'}
      />

      {/* Suggestion bubble */}
      <AnimatePresence>
        {hasSuggestion && (
          <AISuggestionBubble
            suggestion={state.suggestion}
            onAccept={onAccept}
            onReject={onReject}
          />
        )}
      </AnimatePresence>

      {/* Error message */}
      {hasError && <FieldError id={errorId} message={state.errorMessage!} />}

      {/* Struggle detection help */}
      {isStruggling && config.justification && (
        <motion.p
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-1.5 text-xs text-[#6C63FF]"
          aria-live="polite"
        >
          This one can be tricky — {config.justification}
        </motion.p>
      )}
    </motion.div>
  );
}
