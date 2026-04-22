export const AI_TIMING = {
  /** ms — debounce after last keystroke before triggering AI */
  typingDebounce: 500,
  /** ms — below this latency, show shimmer; above, show dots */
  shimmerThreshold: 300,
  /** ms — minimum time to show processing indicator (prevents flash) */
  minProcessingDisplay: 300,
  /** ms — pause after field completion before auto-advancing */
  autoAdvanceDelay: 600,
  /** ms — CSS transitions for suggestion appear/disappear */
  transitionDuration: 200,
  /** ms — confetti animation duration */
  confettiDuration: 2000,
  /** ms — stats chip auto-dismiss delay */
  statsChipDismiss: 5000,
} as const;

export const ANIMATION = {
  /** Hero word stagger (ms between each word) */
  heroWordStagger: 60,
  /** Suggestion bubble spring config */
  suggestionSpring: { type: 'spring' as const, stiffness: 300, damping: 24 },
  /** Field reveal */
  fieldReveal: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const },
  /** Chip entrance */
  chipEntrance: { duration: 0.15, ease: 'easeOut' as const },
} as const;

/** Simulated latency table (ms) for demo mode */
export const DEMO_LATENCY = {
  name:      { base: 80,  jitter: 20  },
  email:     { base: 150, jitter: 30  },
  phone:     { base: 50,  jitter: 10  },
  country:   { base: 120, jitter: 25  },
  date:      { base: 100, jitter: 20  },
  dietary:   { base: 200, jitter: 40  },
  sessions:  { base: 350, jitter: 70  },
} as const;

/** Apply jitter to a base latency */
export function withJitter(base: number, jitter: number): number {
  return base + (Math.random() - 0.5) * 2 * jitter;
}
