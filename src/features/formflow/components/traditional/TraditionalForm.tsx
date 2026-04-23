/**
 * TraditionalForm.tsx
 * Left-side panel of the FormFlow comparison.
 * Deliberately bad UX — all 15 fields visible at once, submit-only validation,
 * US-centric phone format, giant country dropdown, error banner at top.
 *
 * This is the foil. Every pain point here is intentional.
 */

import { useReducer, useRef, useEffect } from 'react';
import { useFormFlow } from '../../context/FormFlowContext';
import { TRADITIONAL_FORM_CONFIG } from '../../data/formConfigs';
import {
  validateTraditionalForm,
  getOrderedErrorMessages,
} from '../../hooks/useTraditionalValidation';
import { TraditionalField } from './TraditionalField';

// ─── State ──────────────────────────────────────────────────────────────────

interface TraditionalFormState {
  values: Record<string, string>;
  errors: Record<string, string>;
  submitted: boolean;
  hasEverSubmitted: boolean;
}

type Action =
  | { type: 'SET_VALUE'; fieldId: string; value: string }
  | { type: 'SET_ERRORS'; errors: Record<string, string> }
  | { type: 'SUBMIT_ATTEMPT' }
  | { type: 'SUBMIT_SUCCESS' }
  | { type: 'RESET' };

const FIELD_IDS = TRADITIONAL_FORM_CONFIG.fields.map((f) => f.id);

function buildInitialValues(): Record<string, string> {
  return Object.fromEntries(FIELD_IDS.map((id) => [id, '']));
}

function reducer(
  state: TraditionalFormState,
  action: Action
): TraditionalFormState {
  switch (action.type) {
    case 'SET_VALUE':
      return {
        ...state,
        values: { ...state.values, [action.fieldId]: action.value },
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.errors };
    case 'SUBMIT_ATTEMPT':
      return { ...state, submitted: true, hasEverSubmitted: true };
    case 'SUBMIT_SUCCESS':
      return { ...state, submitted: true };
    case 'RESET':
      return {
        values: buildInitialValues(),
        errors: {},
        submitted: false,
        hasEverSubmitted: false,
      };
    default:
      return state;
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export default function TraditionalForm() {
  const { dispatchStat } = useFormFlow();
  const errorBannerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [state, dispatch] = useReducer(reducer, {
    values: buildInitialValues(),
    errors: {},
    submitted: false,
    hasEverSubmitted: false,
  });

  // Track which fields have been completed (blurred with a value) for stats
  const completedFields = useRef(new Set<string>());
  const hasStarted = useRef(false);

  // When errors appear on submit, scroll the error banner into view
  useEffect(() => {
    const hasErrors = Object.keys(state.errors).length > 0;
    if (state.submitted && hasErrors && errorBannerRef.current) {
      errorBannerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.errors, state.submitted]);

  function handleChange(fieldId: string, value: string) {
    // Signal START on first keystroke
    if (!hasStarted.current) {
      hasStarted.current = true;
      dispatchStat({ form: 'traditional', type: 'START' });
    }
    dispatch({ type: 'SET_VALUE', fieldId, value });
  }

  function handleBlur(fieldId: string) {
    const value = state.values[fieldId];
    // Track field completion (first time field is blurred with a value)
    if (value && !completedFields.current.has(fieldId)) {
      completedFields.current.add(fieldId);
      dispatchStat({ form: 'traditional', type: 'FIELD_COMPLETED' });
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const isRetry = state.hasEverSubmitted;
    dispatch({ type: 'SUBMIT_ATTEMPT' });

    const errors = validateTraditionalForm(state.values);
    dispatch({ type: 'SET_ERRORS', errors });

    const hasErrors = Object.keys(errors).length > 0;

    if (hasErrors) {
      // Signal error and retry stats
      dispatchStat({ form: 'traditional', type: 'ERROR_SHOWN' });
      if (isRetry) {
        dispatchStat({ form: 'traditional', type: 'RETRY' });
      }
      return;
    }

    // Success
    dispatchStat({ form: 'traditional', type: 'SUBMITTED' });
    dispatch({ type: 'SUBMIT_SUCCESS' });
  }

  const hasErrors = Object.keys(state.errors).length > 0;
  const orderedErrors = getOrderedErrorMessages(state.errors, FIELD_IDS);

  // The "terms" field is special — it's a checkbox, not a standard field
  const nonTermsFields = TRADITIONAL_FORM_CONFIG.fields.filter(
    (f) => f.id !== 'terms'
  );

  return (
    <div className="p-4 sm:p-6">
      {/* ── Error Banner (appears at TOP on submit failure) ─────────────── */}
      {state.submitted && hasErrors && (
        <div
          ref={errorBannerRef}
          role="alert"
          aria-live="assertive"
          className="mb-6 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3"
        >
          <p className="mb-2 font-semibold text-red-400 text-sm flex items-center gap-2">
            <span aria-hidden="true">⚠</span>
            Please fix the following errors:
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {orderedErrors.map((msg, i) => (
              <li key={i} className="text-red-300 text-xs">
                {msg}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────────────────── */}
      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        {/* All 15 fields visible at once — no progressive reveal */}
        {nonTermsFields.map((field) => (
          <TraditionalField
            key={field.id}
            config={field}
            value={state.values[field.id] ?? ''}
            error={state.errors[field.id]}
            onChange={(value) => handleChange(field.id, value)}
            onBlur={() => handleBlur(field.id)}
          />
        ))}

        {/* ── Terms Checkbox ────────────────────────────────────────────── */}
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <input
              id="terms"
              type="checkbox"
              required
              aria-required="true"
              aria-invalid={state.errors['terms'] ? true : undefined}
              aria-describedby={state.errors['terms'] ? 'terms-error' : undefined}
              checked={state.values['terms'] === 'agreed'}
              onChange={(e) =>
                handleChange('terms', e.target.checked ? 'agreed' : '')
              }
              onBlur={() => handleBlur('terms')}
              className={[
                'mt-0.5 h-4 w-4 rounded border accent-[#6C63FF]',
                'border-[#2A3045] bg-[#1E2333]',
                'focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-1 focus:ring-offset-[#161A24]',
                state.errors['terms'] ? 'border-red-500' : '',
              ].join(' ')}
            />
            <label
              htmlFor="terms"
              className="text-sm text-[#8B92A8] leading-relaxed cursor-pointer"
            >
              I agree to the{' '}
              <span className="text-[#6C63FF] underline underline-offset-2 cursor-pointer">
                Terms &amp; Conditions
              </span>{' '}
              and{' '}
              <span className="text-[#6C63FF] underline underline-offset-2 cursor-pointer">
                Privacy Policy
              </span>
              <span aria-hidden="true" className="ml-0.5 text-red-400">
                {' '}*
              </span>
            </label>
          </div>
          {state.errors['terms'] && (
            <p
              id="terms-error"
              role="alert"
              className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400"
            >
              <span aria-hidden="true">⚠</span>
              {state.errors['terms']}
            </p>
          )}
        </div>

        {/* ── Submit Button ──────────────────────────────────────────────── */}
        <button
          type="submit"
          className={[
            'mt-4 w-full rounded-lg px-6 py-3.5 font-semibold text-sm',
            'bg-[#6C63FF] text-white',
            'hover:bg-[#5B52E0] active:bg-[#4A42CC]',
            'transition-colors duration-150',
            'focus:outline-none focus:ring-2 focus:ring-[#6C63FF] focus:ring-offset-2 focus:ring-offset-[#161A24]',
          ].join(' ')}
        >
          {TRADITIONAL_FORM_CONFIG.submitLabel}
        </button>
      </form>

      {/* ── Success State ─────────────────────────────────────────────────── */}
      {state.submitted && !hasErrors && (
        <div
          role="status"
          aria-live="polite"
          className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-4 text-center"
        >
          <p className="text-green-400 font-semibold text-sm">
            ✓ Registration submitted
          </p>
          <p className="mt-1 text-[#8B92A8] text-xs">
            You made it through all 15 fields. How did that feel?
          </p>
          <button
            type="button"
            onClick={() => dispatch({ type: 'RESET' })}
            className="mt-3 text-xs text-[#6C63FF] underline underline-offset-2 hover:text-[#8B85FF] transition-colors"
          >
            Start again
          </button>
        </div>
      )}
    </div>
  );
}
