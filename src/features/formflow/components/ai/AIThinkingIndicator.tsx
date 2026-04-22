/**
 * AIThinkingIndicator.tsx
 * Shows shimmer bar or animated dots during AI processing.
 */

import { AnimatePresence, motion } from 'framer-motion';

interface AIThinkingIndicatorProps {
  visible: boolean;
  mode: 'shimmer' | 'dots';
}

const reducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function AIThinkingIndicator({ visible, mode }: AIThinkingIndicatorProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reducedMotion ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          aria-live="polite"
          aria-label="AI is processing your input"
          role="status"
        >
          {mode === 'shimmer' ? <Shimmer /> : <Dots />}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Shimmer() {
  return (
    <div
      className="h-0.5 w-full rounded-full mt-1 overflow-hidden"
      aria-hidden="true"
    >
      <div
        className="h-full w-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(108,99,255,0.3) 50%, transparent 100%)',
          backgroundSize: '200% 100%',
          animation: reducedMotion ? 'none' : 'shimmer 1.2s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
}

function Dots() {
  return (
    <div className="flex items-center gap-1 mt-2" aria-hidden="true">
      {[0, 1, 2].map(i => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-[#6C63FF]"
          animate={reducedMotion ? undefined : {
            scale: [1, 1.4, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            repeat: Infinity,
            delay: i * 0.15,
          }}
        />
      ))}
      <span className="text-xs text-[#8B92A8] ml-1.5">Processing...</span>
    </div>
  );
}
