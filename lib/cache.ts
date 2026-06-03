import { getRedis } from "./redis";

const TTL = {
  analysis: 60 * 60 * 24,   // 24h — analyses don't change often
  stats: 60 * 5,             // 5 min
  meetings: 60 * 2,          // 2 min
};

export async function cacheGet<T>(key: string): Promise<T | null> {
  const redis = getRedis();
  if (!redis) return null;
  try {
    return await redis.get<T>(key);
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttl: number): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.set(key, value, { ex: ttl });
  } catch {
    // non-fatal
  }
}

export async function cacheDel(key: string): Promise<void> {
  const redis = getRedis();
  if (!redis) return;
  try {
    await redis.del(key);
  } catch {
    // non-fatal
  }
}

export const CacheKeys = {
  analysis: (meetingId: string) => `analysis:${meetingId}`,
  meeting: (meetingId: string, userId: string) => `meeting:${meetingId}:${userId}`,
  stats: (userId: string) => `stats:${userId}`,
};

export { TTL };
