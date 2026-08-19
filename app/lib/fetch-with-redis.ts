import { cache } from 'react';
import Redis from 'ioredis';
import axios from 'axios';

const DEFAULT_REVALIDATE_SEC = 60;

const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  (process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        commandTimeout: 3000,
        enableOfflineQueue: true,
        keepAlive: 10000,
      })
    : null);

if (redis && !(globalForRedis as any)._redisInitialized) {
    (globalForRedis as any)._redisInitialized = true;
    redis.on('error', (err) => console.error('[Redis Error]', err.message));
    redis.on('ready', () => console.log('? [REDIS FOUND] Connected successfully'));
}

if (process.env.NODE_ENV !== "production") {
    globalForRedis.redis = redis as Redis;
}

/**
 * fetchWithRedis: Dual-Key Cache Strategy
 *
 * KEY CHINH  `swr:{url}`      TTL = revalidate * 3  (~3 phut cho catalog 60s)
 *   -> Freshness: key tu het han -> next visitor buoc fetch moi -> data luon tuoi
 *   -> SWR background refresh giu data fresh khi co traffic lien tuc
 *
 * KEY EMERGENCY `emg:{url}`   TTL = 86400s (24 gio)
 *   -> Resilience: CHI doc khi API that su sap (fetch fail sau 2 retry)
 *   -> Khong dung cho traffic binh thuong -> khong gay badge inconsistency
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit & { revalidate?: number | false }): Promise<any> => {
    const rawRevalidate = options?.revalidate ?? (options as any)?.next?.revalidate ?? DEFAULT_REVALIDATE_SEC;
    const revalidate = typeof rawRevalidate === 'number' ? rawRevalidate : DEFAULT_REVALIDATE_SEC;
    const cacheKey = `swr:${url}`;
    const emergencyKey = `emg:${url}`;

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
                timeout: 15000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                    'Accept': 'application/json',
                }
            });

            if (response.status === 200 && response.data) {
                const data = response.data;
                if (redis && data) {
                    try {
                        const payload = JSON.stringify({ timestamp: Date.now(), data });
                        // Key chinh: TTL ngan (*3) dam bao freshness
                        await redis.setex(cacheKey, revalidate * 3, payload);
                        // Emergency key: TTL 24h, chi doc khi API that su sap
                        await redis.setex(emergencyKey, 86400, payload);
                    } catch (err) {
                        console.error(`[Redis Set Error] ${url}`, err);
                    }
                }
                return data;
            } else {
                throw new Error(`API returned status ${response.status}`);
            }
        } catch (error: any) {
            if (retryCount < 1) {
                return _fetchFreshData(retryCount + 1);
            }
            console.error(`[Axios Fetch Error After Retry] ${url}`, error.message);

            // Stale-on-Error: API sap that su -> fallback theo thu tu uu tien
            if (redis) {
                try {
                    const mainRaw = await redis.get(cacheKey);
                    if (mainRaw) {
                        const parsed = JSON.parse(mainRaw);
                        if (parsed?.data) {
                            console.warn(`[Stale-on-Error] Main key fallback: ${url}`);
                            return parsed.data;
                        }
                    }
                    const emergencyRaw = await redis.get(emergencyKey);
                    if (emergencyRaw) {
                        const parsed = JSON.parse(emergencyRaw);
                        if (parsed?.data) {
                            console.warn(`[Stale-on-Error] Emergency key fallback: ${url}`);
                            return parsed.data;
                        }
                    }
                } catch (redisErr) {
                    // Redis cung loi -> throw binh thuong
                }
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

    if (redis) {
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);
                if (parsed && parsed.timestamp && parsed.data) {
                    const ageMs = Date.now() - parsed.timestamp;
                    const maxAgeMs = revalidate * 1000;
                    if (ageMs > maxAgeMs) {
                        fetchFreshData().catch((err) => console.error("SWR Update Failed", err));
                    }
                    return parsed.data;
                }
            }
        } catch (err) {
            console.error(`[Redis Get Error] ${url}`, err);
        }
    }

    return fetchFreshData();
});

export const flushMemoryCache = async () => {
    if (redis) {
        await redis.flushdb();
    }
};
