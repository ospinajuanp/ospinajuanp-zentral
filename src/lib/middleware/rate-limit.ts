import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
});

interface RateLimitConfig {
  limit: number;
  windowSeconds: number;
}

const CONFIGS: Record<string, RateLimitConfig> = {
  login: { limit: 5, windowSeconds: 15 * 60 },
  register: { limit: 3, windowSeconds: 30 * 60 },
};

function extractIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '127.0.0.1';
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfter: number;
}

export async function checkRateLimit(
  request: Request,
  endpoint: string
): Promise<RateLimitResult> {
  const config = CONFIGS[endpoint];
  if (!config) {
    return { allowed: true, remaining: Infinity, retryAfter: 0 };
  }

  const ip = extractIp(request);
  const key = `rate_limit:${ip}:${endpoint}`;

  try {
    const count = await redis.incr(key);

    if (count === 1) {
      await redis.expire(key, config.windowSeconds);
    }

    const ttl = await redis.pttl(key);
    const remainingSeconds = ttl > 0 ? Math.ceil(ttl / 1000) : config.windowSeconds;

    if (count > config.limit) {
      return {
        allowed: false,
        remaining: 0,
        retryAfter: remainingSeconds,
      };
    }

    return {
      allowed: true,
      remaining: config.limit - count,
      retryAfter: 0,
    };
  } catch (error) {
    console.error('[rate-limit] Redis error, bypassing:', error);
    return { allowed: true, remaining: Infinity, retryAfter: 0 };
  }
}
