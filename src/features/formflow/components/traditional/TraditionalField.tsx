/**
 * TraditionalField.tsx
 * Generic field wrapper for the Traditional Form.
 * Routes to FieldInput (text/email/date/select/textarea) or CountryDropdown.
 * NO inline validation — errors are only injected from submit attempt.
 */

import type { FieldConfig } from '../../types';
import { FieldInput } from '../shared/FieldInput';
import { CountryDropdown } from './CountryDropdown';

interface TraditionalFieldProps {
  config: FieldConfig;
  value: string;
  error?: string;
  onChange: (value: string) => void;
  /** Called when user leaves the field (for stat tracking only — NOT for validation) */
  onBlur?: () => void;
}

export function TraditionalField({
  config,
  value,
  error,
  onChange,
  onBlur,
}: TraditionalFieldProps) {
  if (config.type === 'country') {
    return (
      <CountryDropdown
        fieldId={config.id}
        value={value}
        error={error}
        required={config.required}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
      />
    );
  }

  if (config.type === 'select') {
    return (
      <FieldInput
        inputType="select"
        id={config.id}
        label={config.label}
        required={config.required}
        error={error}
        value={value}
        autoComplete={config.autocomplete}
        options={(config.options ?? []).map((o) => ({
          value: o.value,
          label: o.label,
        }))}
        onChange={(e) => onChange((e.target as HTMLSelectElement).value)}
        onBlur={onBlur}
      />
    );
  }

  if (config.type === 'textarea') {
    return (
      <FieldInput
        inputType="textarea"
        id={config.id}
        label={config.label}
        required={config.required}
        error={error}
        value={value}
        placeholder={config.placeholder}
        autoComplete={config.autocomplete}
        rows={3}
        onChange={(e) => onChange((e.target as HTMLTextAreaElement).value)}
        onBlur={onBlur}
      />
    );
  }

  // Default: text / email / phone / date → <input>
  const inputTypeMap: Record<string, string> = {
    text: 'text',
    email: 'email',
    phone: 'tel',
    date: 'date',
  };

  return (
    <FieldInput
      inputType="input"
      id={config.id}
      label={config.label}
      required={config.required}
      error={error}
      value={value}
      type={inputTypeMap[config.type] ?? 'text'}
      placeholder={config.placeholder}
      autoComplete={config.autocomplete}
      onChange={(e) => onChange((e.target as HTMLInputElement).value)}
      onBlur={onBlur}
    />
  );
}
