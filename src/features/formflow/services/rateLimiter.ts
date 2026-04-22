/**
 * rateLimiter.ts
 * Token bucket rate limiter for live API calls.
 * Blocks after 10 calls in 60 seconds.
 */

export interface RateLimiterConfig {
  maxCalls: number;
  windowMs: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  maxCalls: 10,
  windowMs: 60_000, // 60 seconds
};

/**
 * A simple sliding-window rate limiter.
 * Tracks timestamps of recent calls and rejects if too many.
 */
class RateLimiter {
  private calls: number[] = [];
  private config: RateLimiterConfig;

  constructor(config: Partial<RateLimiterConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Try to record a new API call.
   * Returns whether the call is allowed.
   */
  check(): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove expired timestamps
    this.calls = this.calls.filter(ts => ts > windowStart);

    const allowed = this.calls.length < this.config.maxCalls;

    if (allowed) {
      this.calls.push(now);
    }

    const remaining = Math.max(0, this.config.maxCalls - this.calls.length);
    const oldestCall = this.calls[0];
    const resetInMs = oldestCall
      ? Math.max(0, oldestCall + this.config.windowMs - now)
      : 0;

    return { allowed, remaining, resetInMs };
  }

  /**
   * How many calls remain in the current window.
   */
  getRemainingCalls(): number {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;
    const activeCalls = this.calls.filter(ts => ts > windowStart).length;
    return Math.max(0, this.config.maxCalls - activeCalls);
  }

  /**
   * Reset the limiter (for testing or key changes).
   */
  reset(): void {
    this.calls = [];
  }
}

// Singleton for the Claude service
export const claudeRateLimiter = new RateLimiter({
  maxCalls: 10,
  windowMs: 60_000,
});

export { RateLimiter };
