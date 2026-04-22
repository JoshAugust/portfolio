import { useEffect, useState } from 'react';
import type { ComparisonStats } from '../types';

interface ComparisonHeaderProps {
  stats: ComparisonStats;
}

function useElapsedMs(startedAt: number | null, completedAt: number | null): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startedAt) {
      setElapsed(0);
      return;
    }
    if (completedAt) {
      setElapsed(completedAt - startedAt);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - startedAt);
    }, 500);
    return () => clearInterval(interval);
  }, [startedAt, completedAt]);

  return elapsed;
}

function formatMs(ms: number): string {
  if (ms < 1000) return '0s';
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  if (min === 0) return `${sec}s`;
  return `${min}m ${sec}s`;
}

/** Activate after user scrolls past the hero section */
function useScrolled(threshold = 80): boolean {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > threshold);
    };

    // Check immediately on mount
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return scrolled;
}

export function ComparisonHeader({ stats }: ComparisonHeaderProps) {
  const tradElapsed = useElapsedMs(stats.traditional.startedAt, stats.traditional.completedAt);
  const aiElapsed = useElapsedMs(stats.ai.startedAt, stats.ai.completedAt);
  const scrolled = useScrolled();

  return (
    <div
      className={`sticky top-14 z-10 border-b border-[#2A3045] transition-[background,backdrop-filter,box-shadow] duration-300 ${
        scrolled
          ? 'backdrop-blur-md bg-[#0D0F14]/90 shadow-md shadow-black/30'
          : 'bg-[#0D0F14]/60'
      }`}
      role="banner"
      aria-label="Form comparison header"
    >
      <div className="max-w-[1240px] mx-auto px-4">
        <div className="grid grid-cols-2 divide-x divide-[#2A3045]">
          {/* Traditional column */}
          <div className="py-3 pr-4">
            <p className="text-sm font-semibold text-[#F0F2F8]">Traditional Form</p>
            <p className="text-xs text-[#8B92A8] mt-0.5">
              ⏱ ~3–4 min · 42% first-try success
              {stats.traditional.startedAt !== null && (
                <span className="ml-2 text-amber-400 font-mono">
                  {stats.traditional.completedAt ? '✓ ' : ''}
                  {formatMs(tradElapsed)}
                </span>
              )}
            </p>
          </div>

          {/* AI column */}
          <div className="py-3 pl-4">
            <p className="text-sm font-semibold text-[#F0F2F8]">
              FormFlow AI{' '}
              <span className="text-[#6C63FF]" aria-label="AI-enhanced">✦</span>
            </p>
            <p className="text-xs text-[#8B92A8] mt-0.5">
              ⚡ ~90 sec · 78%+ first-try success
              {stats.ai.startedAt !== null && (
                <span className="ml-2 text-green-400 font-mono">
                  {stats.ai.completedAt ? '✓ ' : ''}
                  {formatMs(aiElapsed)}
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
