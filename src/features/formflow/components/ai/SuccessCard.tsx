/**
 * SuccessCard.tsx
 * Completion celebration with confetti, personalized confirmation, and data parity panel.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FieldState } from '../../types';

interface SuccessCardProps {
  formData: Record<string, FieldState>;
  elapsedMs: number;
}

const reducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function parseName(nameState: FieldState): string {
  if (!nameState?.resolvedValue) return nameState?.rawValue || 'Attendee';
  try {
    const parsed = JSON.parse(nameState.resolvedValue);
    return parsed.last ? `${parsed.first} ${parsed.last}` : parsed.first;
  } catch {
    return nameState.rawValue || 'Attendee';
  }
}

function parseChips(state: FieldState): string[] {
  if (!state?.suggestion?.chips) {
    if (state?.resolvedValue) {
      try {
        return JSON.parse(state.resolvedValue);
      } catch {
        return [state.resolvedValue];
      }
    }
    return [];
  }
  return state.suggestion.chips.filter(c => c.selected).map(c => c.label.replace('✦ ', ''));
}

function formatElapsed(ms: number): string {
  const secs = Math.round(ms / 1000);
  if (secs < 60) return `${secs}s`;
  const mins = Math.floor(secs / 60);
  const remSecs = secs % 60;
  return `${mins}m ${remSecs}s`;
}

export function SuccessCard({ formData, elapsedMs }: SuccessCardProps) {
  const confettiFired = useRef(false);
  const [showParity, setShowParity] = useState(false);
  const [showStats, setShowStats] = useState(false);

  // Fire confetti on mount — brand colors, 2 second burst then stop
  useEffect(() => {
    if (confettiFired.current || reducedMotion) return;
    confettiFired.current = true;

    import('canvas-confetti').then(mod => {
      const confetti = mod.default;
      const brandColors = ['#7C3AED', '#10B981', '#8B5CF6', '#34D399'];
      const endTime = Date.now() + 2000; // 2 seconds

      // Fire initial burst
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6, x: 0.5 },
        colors: brandColors,
        disableForReducedMotion: true,
      });

      // Continue firing smaller bursts for the full 2 seconds
      const interval = setInterval(() => {
        if (Date.now() > endTime) {
          clearInterval(interval);
          return;
        }
        confetti({
          particleCount: 25,
          spread: 55,
          origin: {
            y: 0.6,
            x: Math.random() * 0.4 + 0.3, // keep near center
          },
          colors: brandColors,
          disableForReducedMotion: true,
        });
      }, 300);

      // Hard stop after 2 seconds
      setTimeout(() => {
        clearInterval(interval);
      }, 2000);
    }).catch(() => {
      // Confetti is decorative — fail silently
    });
  }, []);

  // Show stats chip after 1.5s
  useEffect(() => {
    const timer = setTimeout(() => setShowStats(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const name = parseName(formData.name);
  const email = formData.email?.resolvedValue || formData.email?.rawValue || '';
  const phone = formData.phone?.resolvedValue || formData.phone?.rawValue || '';
  const country = formData.country?.resolvedValue || '';
  const date = formData.date?.displayValue || formData.date?.resolvedValue || '';
  const sessions = parseChips(formData.sessions);
  const dietary = parseChips(formData.dietary);

  let nameFirst = name;
  let nameLast: string | null = null;
  try {
    if (formData.name?.resolvedValue) {
      const parsed = JSON.parse(formData.name.resolvedValue);
      nameFirst = parsed.first;
      nameLast = parsed.last;
    }
  } catch { /* use full name */ }

  return (
    <motion.div
      initial={reducedMotion ? undefined : { opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="p-6 space-y-4"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="text-3xl">✓</div>
        <h3 className="text-xl font-semibold text-[#F0F2F8]">
          You're in, {nameFirst}.
        </h3>
        <p className="text-sm text-[#8B92A8]">
          Apex Summit 2026 · {date}
        </p>
        <p className="text-xs text-[#545B72]">
          {email}{phone ? ` · ${phone}` : ''}
        </p>
      </div>

      {/* Session and dietary chips */}
      <div className="space-y-2">
        {sessions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            <span className="text-xs text-[#8B92A8] mr-1">Sessions:</span>
            {sessions.map(s => (
              <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-[#6C63FF]/20 border border-[#6C63FF]/40 text-[#F0F2F8]">
                {s}
              </span>
            ))}
          </div>
        )}
        {dietary.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-center">
            <span className="text-xs text-[#8B92A8] mr-1">Diet:</span>
            {dietary.map(d => (
              <span key={d} className="px-2 py-0.5 rounded-full text-xs bg-[#22C55E]/10 border border-[#22C55E]/40 text-[#22C55E]">
                {d}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Data parity panel */}
      <div className="border-t border-[#2A3045] pt-3">
        <button
          type="button"
          onClick={() => setShowParity(!showParity)}
          className="text-xs text-[#6C63FF] hover:text-[#F0F2F8] transition-colors flex items-center gap-1"
        >
          <span>ⓘ</span>
          What FormFlow collected
          <span className="ml-1">{showParity ? '▾' : '▸'}</span>
        </button>

        <AnimatePresence>
          {showParity && (
            <motion.div
              initial={reducedMotion ? undefined : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <pre className="mt-2 text-[10px] text-[#8B92A8] bg-[#0D0F14] rounded-lg p-3 overflow-x-auto font-mono leading-relaxed">
{`FormFlow collected all structured data points:
first_name:        "${nameFirst}"
last_name:         ${nameLast ? `"${nameLast}"` : 'null (mononym)'}
email:             "${email}"
phone_e164:        "${phone}"
country_code:      "${country}"
attendance_date:   "${formData.date?.resolvedValue || ''}"
session_tracks:    [${sessions.map(s => `"${s}"`).join(', ')}]
dietary_flags:     [${dietary.map(d => `"${d}"`).join(', ')}]
job_title:         null (skipped — not relevant)
company:           null (skipped — not relevant)
tshirt_size:       null (skipped — not required)
terms_accepted:    true (implicit in submission)

Same data. Half the friction.`}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Floating stats chip */}
      <AnimatePresence>
        {showStats && (
          <motion.div
            initial={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: 20 }}
            className="text-center"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs bg-[#6C63FF]/10 border border-[#6C63FF]/30 text-[#F0F2F8]">
              ⚡ Completed in {formatElapsed(elapsedMs)} · Traditional form avg: 3m 41s
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
