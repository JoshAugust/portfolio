import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFormFlow } from '../context/FormFlowContext';

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function formatMs(ms: number): string {
  if (!ms || ms < 1000) return '—';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

export function ComparisonStats() {
  const { stats } = useFormFlow();
  const [showCompletionChip, setShowCompletionChip] = useState(false);
  const chipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chipShownRef = useRef(false);

  const tradTime =
    stats.traditional.startedAt && stats.traditional.completedAt
      ? stats.traditional.completedAt - stats.traditional.startedAt
      : null;

  const aiTime =
    stats.ai.startedAt && stats.ai.completedAt
      ? stats.ai.completedAt - stats.ai.startedAt
      : null;

  // Show sliding chip 1.5s after AI form completion, auto-dismiss after 5s
  useEffect(() => {
    if (stats.ai.completedAt && !chipShownRef.current) {
      chipShownRef.current = true;
      chipTimerRef.current = setTimeout(() => {
        setShowCompletionChip(true);
        dismissTimerRef.current = setTimeout(() => {
          setShowCompletionChip(false);
        }, 5000);
      }, 1500);
    }
    return () => {
      if (chipTimerRef.current) clearTimeout(chipTimerRef.current);
      if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    };
  }, [stats.ai.completedAt]);

  return (
    <section
      className="border-t border-[#2A3045] bg-[#161A24] py-6 px-4 relative"
      aria-label="Comparison statistics"
    >
      {/* Completion chip — slides up from below, auto-dismisses */}
      <AnimatePresence>
        {showCompletionChip && aiTime && (
          <motion.div
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 20 }}
            transition={reducedMotion ? { duration: 0.15 } : { type: 'spring', stiffness: 280, damping: 22 }}
            className="flex justify-center mb-4"
            aria-live="polite"
          >
            <button
              type="button"
              onClick={() => setShowCompletionChip(false)}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-sm bg-[#10B981]/10 border border-[#10B981]/40 text-[#F0F2F8] hover:bg-[#10B981]/20 transition-colors"
              aria-label="Dismiss comparison result"
            >
              <span className="text-[#10B981]">⚡</span>
              <span>
                AI form: <span className="font-semibold text-[#10B981]">{formatMs(aiTime)}</span>
                {' '}&middot; Traditional avg: <span className="font-semibold text-amber-400">3m 41s</span>
              </span>
              <span className="text-[#545B72] text-xs ml-1" aria-hidden="true">×</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-[1240px] mx-auto">
        {/* Key stats bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {[
            { value: '$260B', label: 'in annual abandoned ecommerce revenue' },
            { value: '70.22%', label: 'average cart abandonment rate' },
            { value: '78% vs 42%', label: 'first-try success: compliant vs non-compliant' },
            { value: '95.9%', label: 'of top websites fail basic accessibility' },
            { value: '0', label: 'competitors with AI at fill-time' },
          ].map((stat) => (
            <div
              key={stat.value}
              className="text-center p-3 rounded-lg border border-[#2A3045] bg-[#1E2333]"
            >
              <p className="text-xl font-bold text-[#6C63FF]">{stat.value}</p>
              <p className="text-xs text-[#8B92A8] mt-1 leading-tight">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Live run stats */}
        <div className="grid grid-cols-2 divide-x divide-[#2A3045]">
          {/* Traditional */}
          <div className="pr-4 space-y-1">
            <p className="text-xs font-semibold text-[#8B92A8] uppercase tracking-wide mb-2">
              Traditional Form — Live Stats
            </p>
            <StatRow label="Fields completed" value={`${stats.traditional.fieldsCompleted} / ${stats.traditional.fieldsTotal}`} />
            <StatRow label="Errors shown" value={String(stats.traditional.errorsShown)} warn={stats.traditional.errorsShown > 0} />
            <StatRow label="Retries" value={String(stats.traditional.retriesTotal)} warn={stats.traditional.retriesTotal > 0} />
            <StatRow
              label="Time elapsed"
              value={tradTime ? formatMs(tradTime) : (stats.traditional.startedAt ? 'In progress…' : '—')}
            />
          </div>

          {/* AI */}
          <div className="pl-4 space-y-1">
            <p className="text-xs font-semibold text-[#8B92A8] uppercase tracking-wide mb-2">
              FormFlow AI — Live Stats
            </p>
            <StatRow label="Fields completed" value={`${stats.ai.fieldsCompleted} / ${stats.ai.fieldsTotal}`} />
            <StatRow label="Errors shown" value={String(stats.ai.errorsShown)} />
            <StatRow label="Retries" value={String(stats.ai.retriesTotal)} />
            <StatRow
              label="Time elapsed"
              value={aiTime ? formatMs(aiTime) : (stats.ai.startedAt ? 'In progress…' : '—')}
              good={aiTime !== null}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatRow({
  label,
  value,
  warn = false,
  good = false,
}: {
  label: string;
  value: string;
  warn?: boolean;
  good?: boolean;
}) {
  const valueClass = warn
    ? 'text-amber-400'
    : good
    ? 'text-green-400'
    : 'text-[#F0F2F8]';

  return (
    <div className="flex justify-between items-center text-xs py-0.5">
      <span className="text-[#8B92A8]">{label}</span>
      <span className={`font-mono font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}
