import { redis } from './redis';

const windowMs = 60 * 1000; // 1 minute window
const fallbackStore = new Map<string, { count: number; resetTime: number }>();

// Cleanup stale entries for fallback
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of fallbackStore) {
      if (now > entry.resetTime) {
        fallbackStore.delete(key);
      }
    }
  }, 60 * 1000);
}

/**
 * Check if a request should be rate limited.
 * @param key - Unique identifier (e.g., userId, IP address)
 * @param maxRequests - Maximum requests allowed per window
 * @returns true if the request should be BLOCKED, false if allowed
 */
export async function isRateLimited(key: string, maxRequests: number): Promise<boolean> {
  if (redis) {
    try {
      const redisKey = `ratelimit:${key}`;
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, 60); // 60 seconds
      }
      return count > maxRequests;
    } catch (error) {
      console.warn('Redis rate limiting failed, falling back to memory map', error);
      // Fall through to memory logic
    }
  }

  // Fallback memory logic
  const now = Date.now();
  const entry = fallbackStore.get(key);

  if (!entry || now > entry.resetTime) {
    fallbackStore.set(key, { count: 1, resetTime: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > maxRequests;
}
