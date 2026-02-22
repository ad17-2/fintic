interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function createRateLimiter(maxAttempts: number, windowMs: number) {
  const attempts = new Map<string, RateLimitEntry>();

  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of attempts) {
      if (now >= entry.resetAt) attempts.delete(key);
    }
  }, windowMs);

  return {
    check(key: string): { allowed: boolean; retryAfterMs: number } {
      const now = Date.now();
      const entry = attempts.get(key);

      if (!entry || now >= entry.resetAt) {
        attempts.set(key, { count: 1, resetAt: now + windowMs });
        return { allowed: true, retryAfterMs: 0 };
      }

      if (entry.count >= maxAttempts) {
        return { allowed: false, retryAfterMs: entry.resetAt - now };
      }

      entry.count++;
      return { allowed: true, retryAfterMs: 0 };
    },
  };
}
