import { Redis } from '@upstash/redis';
import { NextRequest } from 'next/server';

// Lazy-initialize Upstash Redis client to avoid build-time errors
let redis: Redis | null = null;

function getRedisClient(): Redis {
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

/**
 * Extract client IP address from request headers
 * Checks x-forwarded-for and x-real-ip headers (common in production proxies)
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can be a comma-separated list; take the first IP
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fallback to a placeholder (should not happen in production with proper proxy config)
  return 'unknown';
}

/**
 * Check rate limit using Upstash Redis
 * @param identifier - Unique identifier for the rate limit (IP address or user ID)
 * @param limit - Maximum number of requests allowed
 * @param windowSeconds - Time window in seconds
 * @returns { success: boolean, error?: string }
 */
export async function checkRateLimit(
  identifier: string,
  limit: number,
  windowSeconds: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const redisClient = getRedisClient();
    const key = `rate_limit:${identifier}`;

    // Increment the counter
    const count = await redisClient.incr(key);

    // Set TTL on first request (when count is 1)
    if (count === 1) {
      await redisClient.expire(key, windowSeconds);
    }

    // Check if limit exceeded
    if (count > limit) {
      return {
        success: false,
        error: 'Too many requests. Please try again later.',
      };
    }

    return { success: true };
  } catch (error) {
    // Fail-open: if Redis is down, allow the request to prevent auth outage
    console.error('Rate limit check failed (Redis error), failing open:', error);
    return { success: true };
  }
}
