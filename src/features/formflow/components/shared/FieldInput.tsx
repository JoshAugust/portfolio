import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { FieldLabel } from './FieldLabel';
import { FieldError } from './FieldError';

type BaseProps = {
  id: string;
  label: string;
  required: boolean;
  error?: string;
  justification?: string;
};

type InputProps = BaseProps &
  Omit<InputHTMLAttributes<HTMLInputElement>, 'id' | 'required'> & {
    inputType: 'input';
    options?: never;
    rows?: never;
  };

type SelectProps = BaseProps &
  Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id' | 'required'> & {
    inputType: 'select';
    options: Array<{ value: string; label: string }>;
    rows?: never;
  };

type TextareaProps = BaseProps &
  Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id' | 'required'> & {
    inputType: 'textarea';
    options?: never;
    rows?: number;
  };

type FieldInputProps = InputProps | SelectProps | TextareaProps;

const baseInputClass = [
  'w-full rounded-lg border px-3 py-2.5 text-sm',
  'bg-[#1E2333] text-[#F0F2F8] placeholder:text-[#545B72]',
  'border-[#2A3045] focus:border-[#6C63FF] focus:outline-none focus:ring-1 focus:ring-[#6C63FF]',
  'transition-colors duration-150',
].join(' ');

const errorInputClass = 'border-red-500 focus:border-red-400 focus:ring-red-400';

export function FieldInput(props: FieldInputProps) {
  const { id, label, required, error, justification, inputType, ...rest } = props;
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  const ariaProps = {
    id,
    required,
    'aria-required': required,
    'aria-invalid': hasError || undefined,
    'aria-describedby': hasError ? errorId : undefined,
  };

  return (
    <div className="mb-4">
      <FieldLabel htmlFor={id} required={required}>
        {label}
        {justification && (
          <span
            title={justification}
            className="ml-1.5 cursor-help text-[#6C63FF] text-xs"
            aria-label={`More info: ${justification}`}
          >
            ℹ
          </span>
        )}
      </FieldLabel>

      {inputType === 'select' && (
        <select
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
          {...ariaProps}
          className={`${baseInputClass} ${hasError ? errorInputClass : ''} ${(rest as SelectHTMLAttributes<HTMLSelectElement>).className ?? ''}`}
        >
          {(props as SelectProps).options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )}

      {inputType === 'textarea' && (
        <textarea
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
          {...ariaProps}
          rows={(props as TextareaProps).rows ?? 3}
          className={`${baseInputClass} ${hasError ? errorInputClass : ''} resize-none ${(rest as TextareaHTMLAttributes<HTMLTextAreaElement>).className ?? ''}`}
        />
      )}

      {inputType === 'input' && (
        <input
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
          {...ariaProps}
          className={`${baseInputClass} ${hasError ? errorInputClass : ''} ${(rest as InputHTMLAttributes<HTMLInputElement>).className ?? ''}`}
        />
      )}

      {hasError && <FieldError id={errorId} message={error!} />}
    </div>
  );
}
