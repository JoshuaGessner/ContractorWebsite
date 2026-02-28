type Entry = {
  count: number;
  resetAt: number;
};

const cache = new Map<string, Entry>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number) {
  const now = Date.now();
  const entry = cache.get(key);

  if (!entry || entry.resetAt < now) {
    cache.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  cache.set(key, entry);

  return { allowed: true, remaining: maxRequests - entry.count };
}
