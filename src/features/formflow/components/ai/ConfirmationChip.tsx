/**
 * ConfirmationChip.tsx
 * Compact inline badge showing a completed field's resolved value.
 */

interface ConfirmationChipProps {
  emoji?: string;
  text: string;
  variant?: 'success' | 'warning' | 'neutral';
}

const variantStyles = {
  success: 'border-[#22C55E]/40 text-[#22C55E] bg-[#22C55E]/10',
  warning: 'border-[#F59E0B]/40 text-[#F59E0B] bg-[#F59E0B]/10',
  neutral: 'border-[#2A3045] text-[#8B92A8] bg-[#1E2333]',
} as const;

export function ConfirmationChip({ emoji, text, variant = 'success' }: ConfirmationChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm border ${variantStyles[variant]}`}
    >
      {emoji && <span aria-hidden="true">{emoji}</span>}
      <span>{text}</span>
    </span>
  );
}
