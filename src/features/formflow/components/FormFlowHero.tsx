import { useRef } from 'react';
import { motion } from 'framer-motion';

const HEADLINE = 'Every AI form tool optimises the build side. FormFlow optimises the fill side.';
const SUBHEADLINE =
  'An AI layer that accepts human input — natural language, any format, any dialect — and returns structured data. No dropdowns. No format errors. No abandoned forms.';

const words = HEADLINE.split(' ');

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function FormFlowHero() {
  const comparisonRef = useRef<HTMLDivElement | null>(null);

  const scrollToComparison = () => {
    const el = document.getElementById('formflow-comparison');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="min-h-[min(50vh,400px)] sm:min-h-[min(60vh,480px)] flex flex-col items-center justify-center text-center px-6 relative overflow-hidden"
      aria-labelledby="formflow-hero-headline"
    >
      {/* Animated dot grid background */}
      <div
        className="pointer-events-none absolute inset-0 overflow-hidden"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(108,99,255,0.08) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: reducedMotion ? 'none' : 'dot-drift 60s linear infinite',
        }}
      />

      {/* Radial gradient overlay — sits on top of dots */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(108,99,255,0.15) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      {/* Keyframe injection */}
      <style>{`
        @keyframes dot-drift {
          0%   { background-position: 0 0; }
          100% { background-position: 0 -400px; }
        }
      `}</style>

      <div className="relative z-10 max-w-3xl mx-auto">
        <h1
          id="formflow-hero-headline"
          className="text-2xl sm:text-3xl lg:text-5xl font-bold text-[#F0F2F8] leading-tight mb-6"
        >
          {words.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reducedMotion ? 0 : i * 0.06,
                duration: reducedMotion ? 0.01 : 0.3,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="inline-block mr-[0.25em]"
            >
              {word}
            </motion.span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: reducedMotion ? 0 : words.length * 0.06 + 0.2,
            duration: reducedMotion ? 0.01 : 0.4,
            ease: 'easeOut',
          }}
          className="text-base sm:text-lg text-[#8B92A8] max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          {SUBHEADLINE}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reducedMotion ? 0 : words.length * 0.06 + 0.5 }}
        >
          <button
            onClick={scrollToComparison}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-[#6C63FF] text-[#6C63FF] hover:bg-[#6C63FF]/10 transition-colors duration-200 font-medium text-sm"
            aria-label="Scroll down to see the form comparison"
          >
            See the difference ↓
          </button>
        </motion.div>
      </div>

      {/* Hidden ref anchor for external use */}
      <div ref={comparisonRef} />
    </section>
  );
}
