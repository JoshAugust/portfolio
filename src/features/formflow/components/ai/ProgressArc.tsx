/**
 * ProgressArc.tsx
 * SVG circular progress indicator showing form step progress.
 */

interface ProgressArcProps {
  currentStep: number;
  totalSteps: number;
  estimatedSecondsRemaining: number;
}

export function ProgressArc({ currentStep, totalSteps, estimatedSecondsRemaining }: ProgressArcProps) {
  const progress = totalSteps > 0 ? currentStep / totalSteps : 0;
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex items-center gap-3">
      <svg
        width={40}
        height={40}
        viewBox="0 0 40 40"
        role="progressbar"
        aria-valuenow={currentStep}
        aria-valuemin={0}
        aria-valuemax={totalSteps}
        aria-label="Registration progress"
      >
        {/* Background circle */}
        <circle
          cx={20}
          cy={20}
          r={radius}
          fill="none"
          stroke="#2A3045"
          strokeWidth={3}
        />
        {/* Progress arc */}
        <circle
          cx={20}
          cy={20}
          r={radius}
          fill="none"
          stroke="#6C63FF"
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 20 20)"
          style={{ transition: 'stroke-dashoffset 0.4s ease' }}
        />
        {/* Center text */}
        <text
          x={20}
          y={20}
          textAnchor="middle"
          dominantBaseline="central"
          className="fill-[#F0F2F8] text-[10px] font-medium"
        >
          {currentStep}/{totalSteps}
        </text>
      </svg>
      <div className="text-xs text-[#8B92A8]">
        <span className="text-[#F0F2F8] font-medium">Step {currentStep} of {totalSteps}</span>
        {estimatedSecondsRemaining > 0 && (
          <span className="ml-1">· ~{estimatedSecondsRemaining}s remaining</span>
        )}
      </div>
    </div>
  );
}
