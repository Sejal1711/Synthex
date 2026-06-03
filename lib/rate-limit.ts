import { Ratelimit } from "@upstash/ratelimit";
import { getRedis } from "./redis";

let analyzeLimit: Ratelimit | null = null;
let authLimit: Ratelimit | null = null;
let apiLimit: Ratelimit | null = null;

function getLimits() {
  const redis = getRedis();
  if (!redis) return { analyzeLimit: null, authLimit: null, apiLimit: null };

  if (!analyzeLimit) {
    analyzeLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "1 h"),
      prefix: "rl:analyze",
    });
  }
  if (!authLimit) {
    authLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(10, "15 m"),
      prefix: "rl:auth",
    });
  }
  if (!apiLimit) {
    apiLimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(120, "1 m"),
      prefix: "rl:api",
    });
  }

  return { analyzeLimit, authLimit, apiLimit };
}

export type LimitType = "analyze" | "auth" | "api";

export async function checkRateLimit(
  identifier: string,
  type: LimitType
): Promise<{ allowed: boolean; remaining: number; reset: number }> {
  const { analyzeLimit, authLimit, apiLimit } = getLimits();

  const limiter =
    type === "analyze" ? analyzeLimit : type === "auth" ? authLimit : apiLimit;

  if (!limiter) return { allowed: true, remaining: 999, reset: 0 };

  try {
    const result = await limiter.limit(identifier);
    return {
      allowed: result.success,
      remaining: result.remaining,
      reset: result.reset,
    };
  } catch {
    return { allowed: true, remaining: 999, reset: 0 };
  }
}
