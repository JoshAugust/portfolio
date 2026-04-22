/**
 * AIForm.tsx
 * The AI-enhanced form — right side of the comparison.
 * Progressive reveal, auto-advance, AI field resolution.
 */

import { useCallback, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useFormFlow } from '../../context/FormFlowContext';
import { useAIField } from '../../hooks/useAIField';
import { AI_FORM_CONFIG } from '../../data/formConfigs';
import { AI_TIMING } from '../../config/timing';
import type { AISuggestion, FieldState, SuggestionChip } from '../../types';
import { AIField } from './AIField';
import { ProgressArc } from './ProgressArc';
import { SuccessCard } from './SuccessCard';

// Field order: name → email → phone → country → date → sessions → dietary
const FIELD_IDS = AI_FORM_CONFIG.fields.map(f => f.id);
const TOTAL_STEPS = FIELD_IDS.length;

interface FieldSlot {
  hook: ReturnType<typeof useAIField>;
  sessionChips: SuggestionChip[];
  dietaryChips: SuggestionChip[];
}

/** Wrapper component that manages all field hooks at the top level */
function AIFormInner() {
  const context = useFormFlow();
  const [currentStep, setCurrentStep] = useState(0);
  const [showAllFields, setShowAllFields] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [startTime] = useState(Date.now());

  // Session & dietary chips state (lifted up so we can share between field and form)
  const [sessionChips, setSessionChips] = useState<SuggestionChip[]>([]);
  const [dietaryChips, setDietaryChips] = useState<SuggestionChip[]>([]);

  // Create hooks for each field
  const field0 = useAIField(AI_FORM_CONFIG.fields[0], context);
  const field1 = useAIField(AI_FORM_CONFIG.fields[1], context);
  const field2 = useAIField(AI_FORM_CONFIG.fields[2], context);
  const field3 = useAIField(AI_FORM_CONFIG.fields[3], context);
  const field4 = useAIField(AI_FORM_CONFIG.fields[4], context);
  const field5 = useAIField(AI_FORM_CONFIG.fields[5], context);
  const field6 = useAIField(AI_FORM_CONFIG.fields[6], context);

  const fieldHooks = useMemo(() => [field0, field1, field2, field3, field4, field5, field6], [field0, field1, field2, field3, field4, field5, field6]);

  const allFieldStates = useMemo(() => {
    const map: Record<string, FieldState> = {};
    FIELD_IDS.forEach((id, i) => {
      map[id] = fieldHooks[i].state;
    });
    return map;
  }, [fieldHooks]);

  // Track which fields have been completed
  const completedSteps = useMemo(() => {
    return FIELD_IDS.map((_, i) => {
      const s = fieldHooks[i].state.status;
      return s === 'validated' || s === 'accepted';
    });
  }, [fieldHooks]);

  const completedCount = completedSteps.filter(Boolean).length;

  // Auto-advance when field is validated
  const advanceToNext = useCallback((fromStep: number) => {
    setTimeout(() => {
      // Find next uncompleted step
      for (let i = fromStep + 1; i < TOTAL_STEPS; i++) {
        const s = fieldHooks[i].state.status;
        if (s !== 'validated' && s !== 'accepted') {
          setCurrentStep(i);
          return;
        }
      }
      // All done
      if (completedSteps.every(Boolean)) {
        setCompleted(true);
        context.dispatchStat({ form: 'ai', type: 'SUBMITTED' });
      }
    }, AI_TIMING.autoAdvanceDelay);
  }, [fieldHooks, completedSteps, context]);

  // Handle field events
  const handleResolve = useCallback((stepIndex: number) => (_suggestion: AISuggestion) => {
    context.dispatchStat({ form: 'ai', type: 'FIELD_COMPLETED' });
    advanceToNext(stepIndex);
  }, [context, advanceToNext]);

  const handleAccept = useCallback((stepIndex: number) => () => {
    fieldHooks[stepIndex].onAcceptSuggestion();
    context.dispatchStat({ form: 'ai', type: 'FIELD_COMPLETED' });
    advanceToNext(stepIndex);
  }, [fieldHooks, context, advanceToNext]);

  const handleReject = useCallback((stepIndex: number) => () => {
    fieldHooks[stepIndex].onRejectSuggestion();
  }, [fieldHooks]);

  const handleChange = useCallback((stepIndex: number) => (value: string) => {
    fieldHooks[stepIndex].onChange(value);
    // Dispatch START on first interaction
    if (!context.stats.ai.startedAt) {
      context.dispatchStat({ form: 'ai', type: 'START' });
    }
  }, [fieldHooks, context]);

  const handleBlur = useCallback((stepIndex: number) => async () => {
    const hook = fieldHooks[stepIndex];
    await hook.onBlur();
    // Check if field was auto-validated (no confirmation needed)
    // We use a small delay to let state update propagate
    setTimeout(() => {
      const s = hook.state.status;
      if (s === 'validated' || s === 'accepted') {
        context.dispatchStat({ form: 'ai', type: 'FIELD_COMPLETED' });
        advanceToNext(stepIndex);
      }
    }, 100);
  }, [fieldHooks, context, advanceToNext]);

  // Watch for field validation changes to auto-advance
  // (for fields that auto-validate like country, date, etc.)
  const prevCompletedRef = useMemo(() => ({ count: 0 }), []);
  if (completedCount > prevCompletedRef.count && completedCount > 0) {
    prevCompletedRef.count = completedCount;
    // If all fields are done
    if (completedCount === TOTAL_STEPS && !completed) {
      setCompleted(true);
      context.dispatchStat({ form: 'ai', type: 'SUBMITTED' });
    }
  }

  const handleSessionChipsChange = useCallback((tracks: string[], chips: SuggestionChip[]) => {
    setSessionChips(chips);
    const hook = fieldHooks[5]; // sessions is index 5
    hook.setFieldState(prev => ({
      ...prev,
      status: 'validated',
      resolvedValue: JSON.stringify(tracks),
      displayValue: chips.filter(c => c.selected).map(c => c.label.replace('✦ ', '')).join(', '),
      suggestion: {
        fieldId: prev.fieldId,
        type: 'extraction',
        rawInput: prev.rawValue,
        resolvedValue: JSON.stringify(tracks),
        displayText: `Sessions: ${chips.filter(c => c.selected).map(c => c.label.replace('✦ ', '')).join(', ')}`,
        chips,
        confidence: 'high',
        requiresConfirmation: false,
        latencyMs: 0,
      },
      resolvedAt: Date.now(),
    }));
  }, [fieldHooks]);

  const handleDietaryChipRemove = useCallback((chipValue: string) => {
    setDietaryChips(prev => prev.filter(c => c.value !== chipValue));
  }, []);

  const handleSetFieldState = useCallback((stepIndex: number) =>
    (updater: (prev: FieldState) => FieldState) => {
      fieldHooks[stepIndex].setFieldState(updater);
      // After setting state, check if we should advance
      setTimeout(() => {
        context.dispatchStat({ form: 'ai', type: 'FIELD_COMPLETED' });
        advanceToNext(stepIndex);
      }, 50);
    }, [fieldHooks, context, advanceToNext]);

  // Handle submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (completedCount === TOTAL_STEPS) {
      setCompleted(true);
      context.dispatchStat({ form: 'ai', type: 'SUBMITTED' });
    }
  }, [completedCount, context]);

  // Update session/dietary chips when AI resolves them
  const field5State = fieldHooks[5].state;
  const field6State = fieldHooks[6].state;

  // Sync chips from AI resolution
  if (field5State.suggestion?.chips && sessionChips.length === 0 && field5State.status === 'validated') {
    setSessionChips(field5State.suggestion.chips);
  }
  if (field6State.suggestion?.chips && dietaryChips.length === 0 && field6State.status === 'validated') {
    setDietaryChips(field6State.suggestion.chips);
  }

  const elapsedMs = completed ? (Date.now() - startTime) : 0;
  const estimatedSecsRemaining = (TOTAL_STEPS - completedCount) * 12;

  if (completed) {
    return <SuccessCard formData={allFieldStates} elapsedMs={elapsedMs} />;
  }

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      {/* Progress arc */}
      <ProgressArc
        currentStep={completedCount}
        totalSteps={TOTAL_STEPS}
        estimatedSecondsRemaining={estimatedSecsRemaining}
      />

      {/* Show all fields link */}
      {!showAllFields && currentStep < TOTAL_STEPS && (
        <button
          type="button"
          onClick={() => setShowAllFields(true)}
          className="text-xs text-[#6C63FF] hover:text-[#F0F2F8] transition-colors"
        >
          Show all fields
        </button>
      )}

      {/* Fields */}
      <div>
        <AnimatePresence mode="sync">
          {AI_FORM_CONFIG.fields.map((fieldConfig, i) => {
            const isActive = showAllFields || i === currentStep;
            const isFieldCompleted = completedSteps[i];

            // Hide future fields unless showAllFields
            if (!showAllFields && !isFieldCompleted && i !== currentStep) {
              return null;
            }

            return (
              <AIField
                key={fieldConfig.id}
                config={fieldConfig}
                state={fieldHooks[i].state}
                onResolve={handleResolve(i)}
                onAccept={handleAccept(i)}
                onReject={handleReject(i)}
                onChange={handleChange(i)}
                onBlur={handleBlur(i)}
                onSetFieldState={handleSetFieldState(i)}
                isActive={isActive && !isFieldCompleted}
                isCompleted={isFieldCompleted}
                sessionChips={i === 5 ? sessionChips : []}
                dietaryChips={i === 6 ? dietaryChips : []}
                onSessionChipsChange={handleSessionChipsChange}
                onDietaryChipRemove={handleDietaryChipRemove}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* Submit button */}
      {(showAllFields || currentStep >= TOTAL_STEPS - 1) && completedCount === TOTAL_STEPS && (
        <button
          type="submit"
          className="w-full py-3 rounded-lg bg-[#6C63FF] text-white font-medium hover:bg-[#5B53EE] transition-colors"
        >
          {AI_FORM_CONFIG.submitLabel}
        </button>
      )}
    </form>
  );
}

export default function AIForm() {
  return <AIFormInner />;
}
