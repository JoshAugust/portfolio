import type { ReactNode } from 'react';

interface FieldLabelProps {
  htmlFor: string;
  required: boolean;
  children: ReactNode;
}

export function FieldLabel({ htmlFor, required, children }: FieldLabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-[#F0F2F8] dark:text-[#F0F2F8] mb-1"
    >
      {children}
      {required ? (
        <span aria-hidden="true" className="ml-1 text-red-400">*</span>
      ) : (
        <span className="ml-1.5 text-xs text-[#8B92A8] font-normal">(optional)</span>
      )}
    </label>
  );
}
