import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

type LimitKind = 'user' | 'webhook' | 'apiKeyLive' | 'apiKeyTest';

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN
      })
    : null;

function createLimit(requests: number, duration: string, prefix: string) {
  if (!redis) {
    return null;
  }

  return new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(requests, duration as never),
    prefix
  });
}

const limiters: Record<LimitKind, Ratelimit | null> = {
  user: createLimit(60, '1 m', 'seo-agent:user'),
  webhook: createLimit(10, '1 m', 'seo-agent:webhook'),
  apiKeyLive: createLimit(1000, '1 h', 'seo-agent:api-key:live'),
  apiKeyTest: createLimit(100, '1 h', 'seo-agent:api-key:test')
};

export async function checkRateLimit(kind: LimitKind, identifier: string) {
  const limiter = limiters[kind];

  if (!limiter) {
    return {
      success: true,
      limit: 0,
      remaining: Number.POSITIVE_INFINITY,
      reset: new Date()
    };
  }

  return limiter.limit(identifier);
}

export function getDefaultRatelimiterForPath(pathname: string) {
  if (pathname.startsWith('/api/webhooks/')) {
    return limiters.webhook;
  }

  return limiters.user;
}
