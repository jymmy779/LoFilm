import { cache } from 'react';
import Redis from 'ioredis';
import axios from 'axios';
import { mapToPhimApiUrl } from '@/app/utils/apiConfig';

const DEFAULT_REVALIDATE_SEC = 60;

// L1 IN-MEMORY RAM CACHE (0.001ms latency - Zero Network Overhead)
interface MemoryCacheEntry {
  data: any;
  timestamp: number;
  expires: number;
}
const localRamCache = new Map<string, MemoryCacheEntry>();

function getL1Cache(key: string): any | null {
  const item = localRamCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    localRamCache.delete(key);
    return null;
  }
  return item.data;
}

function setL1Cache(key: string, data: any, ttlSec: number = 60) {
  if (localRamCache.size > 2000) {
    const firstKey = localRamCache.keys().next().value;
    if (firstKey) localRamCache.delete(firstKey);
  }
  localRamCache.set(key, {
    data,
    timestamp: Date.now(),
    expires: Date.now() + ttlSec * 1000,
  });
}

const globalForRedis = global as unknown as { redis: Redis | null };

export const redis =
  globalForRedis.redis ||
  (process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        commandTimeout: 500,
        enableOfflineQueue: false, // DO NOT HANG requests when Redis is unavailable
        lazyConnect: false, // Eager connect on boot to avoid cold-start delay
        keepAlive: 30000,  // 30s keepalive to prevent TCP idle drop
        retryStrategy: (times) => Math.min(times * 100, 2000), // backoff retry
      })
    : null);

if (redis && !(globalForRedis as any)._redisInitialized) {
  (globalForRedis as any)._redisInitialized = true;
  redis.on('error', () => {
    // Non-blocking: Redis errors are handled per-request with fallback
  });
  redis.on('ready', () => console.log('✓ [REDIS] Connected successfully'));
  // Kick off connection immediately on module load
  redis.connect().catch(() => {});
}

globalForRedis.redis = redis;

/**
 * fetchWithRedis: Ultra-fast L1 RAM Cache + SWR Strategy
 */
export const fetchWithRedis = cache(async (rawUrl: string, options?: RequestInit & { revalidate?: number | false }): Promise<any> => {
  const url = mapToPhimApiUrl(rawUrl);
  const rawRevalidate = options?.revalidate ?? (options as any)?.next?.revalidate ?? DEFAULT_REVALIDATE_SEC;
  const revalidate = typeof rawRevalidate === 'number' ? rawRevalidate : DEFAULT_REVALIDATE_SEC;
  const cacheKey = `swr:${url}`;
  const emergencyKey = `emg:${url}`;

  // 1. FAST PATH: Check L1 RAM Cache (0.001ms)
  const l1Data = getL1Cache(cacheKey);
  if (l1Data) {
    return l1Data;
  }

  const globalForPromises = global as unknown as { pendingFetches: Map<string, Promise<any>> };
  if (!globalForPromises.pendingFetches) {
    globalForPromises.pendingFetches = new Map();
  }
  const pendingFetches = globalForPromises.pendingFetches;

  const _fetchFreshData = async (retryCount = 0): Promise<any> => {
    try {
      const safeRevalidate = revalidate && revalidate > 0 ? revalidate : 60;
      const separator = url.includes('?') ? '&' : '?';
      const cacheBuster = `_t=${Math.floor(Date.now() / 1000 / safeRevalidate)}`;
      const fetchUrl = `${url}${separator}${cacheBuster}`;

      const response = await axios.get(fetchUrl, {
        timeout: 4000, // Fast 4s timeout for local/backend calls
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
        }
      });

      if (response.status === 200 && response.data) {
        const data = response.data;
        // Save to L1 RAM Cache immediately
        setL1Cache(cacheKey, data, revalidate * 2);

        // Save to Redis asynchronously without blocking
        if (redis && redis.status === 'ready') {
          const payload = JSON.stringify({ timestamp: Date.now(), data });
          redis.setex(cacheKey, revalidate * 3, payload).catch(() => {});
          redis.setex(emergencyKey, 86400, payload).catch(() => {});
        }
        return data;
      } else {
        throw new Error(`API returned status ${response.status}`);
      }
    } catch (error: any) {
      if (retryCount < 1) {
        return _fetchFreshData(retryCount + 1);
      }

      // Check L1 stale cache on error
      const staleL1 = localRamCache.get(cacheKey);
      if (staleL1?.data) {
        return staleL1.data;
      }

      // Fallback: Nếu gọi Backend nội bộ thất bại, tự động thử lại với KKPhim API trực tiếp
      if (url.includes('localhost:5000') || url.includes('127.0.0.1:5000') || url.includes('/api/v1')) {
        try {
          const fallbackUrl = mapToPhimApiUrl(url);

          const fbResponse = await axios.get(fallbackUrl, {
            timeout: 5000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
          });
          if (fbResponse.status === 200 && fbResponse.data) {
            setL1Cache(cacheKey, fbResponse.data, revalidate);
            return fbResponse.data;
          }
        } catch {}
      }

      // Check Redis cache on error
      if (redis && redis.status === 'ready') {
        try {
          const mainRaw = await redis.get(cacheKey);
          if (mainRaw) {
            const parsed = JSON.parse(mainRaw);
            if (parsed?.data) return parsed.data;
          }
        } catch {}
      }

      throw new Error(`Fetch failed for ${url}: ${error.message}`);
    }
  };

  const fetchFreshData = () => {
    if (pendingFetches.has(url)) {
      return pendingFetches.get(url)!;
    }
    const promise = _fetchFreshData().finally(() => {
      pendingFetches.delete(url);
    });
    pendingFetches.set(url, promise);
    return promise;
  };

  // Check Redis asynchronously only if connected
  if (redis && redis.status === 'ready') {
    try {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed && parsed.timestamp && parsed.data) {
          setL1Cache(cacheKey, parsed.data, revalidate);
          const ageMs = Date.now() - parsed.timestamp;
          const maxAgeMs = revalidate * 1000;
          if (ageMs > maxAgeMs) {
            fetchFreshData().catch(() => {});
          }
          return parsed.data;
        }
      }
    } catch {}
  }

  return fetchFreshData();
});

export const flushMemoryCache = async () => {
  localRamCache.clear();
  if (redis && redis.status === 'ready') {
    try {
      await redis.flushdb();
    } catch {}
  }
};

