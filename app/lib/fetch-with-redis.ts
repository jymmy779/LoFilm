import redis from './redis';
import { cache } from 'react';

const DEFAULT_REVALIDATE_SEC = 30; // Default revalidation interval

/**
 * Smart fetch with short-lived Redis cache.
 * Redis TTL = revalidate seconds → data always fresh within that window.
 * React.cache() deduplicates within a single server render (Metadata + Page).
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit & { revalidate?: number }): Promise<any> => {
    const rawRevalidate = options?.revalidate ?? options?.next?.revalidate ?? DEFAULT_REVALIDATE_SEC;
    const revalidate = typeof rawRevalidate === 'number' ? rawRevalidate : DEFAULT_REVALIDATE_SEC;

    // 1. CHECK REDIS (short-lived cache, TTL = revalidate seconds)
    if (process.env.UPSTASH_REDIS_REST_URL) {
        try {
            const cachedData = await redis.get(url);
            if (cachedData) {
                // Data exists and is within TTL → guaranteed fresh
                return cachedData;
            }
        } catch (e) {
            console.error("Redis get error:", e);
        }
    }

    // 2. CACHE MISS → Fetch from origin API with 10s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            next: { revalidate: revalidate },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();

            // Store in Redis with SHORT TTL matching revalidate interval
            // This ensures data is never stale beyond the revalidate window
            if (process.env.UPSTASH_REDIS_REST_URL) {
                redis.set(url, data, { ex: revalidate }).catch((e) => console.error("Redis set error:", e));
            }

            return data;
        } else {
            throw new Error(`API Endpoint returned status: ${response.status}`);
        }
    } catch (error: any) {
        clearTimeout(timeoutId);

        // On fetch failure, try Redis as fallback (even expired conceptually, but still within old TTL)
        if (process.env.UPSTASH_REDIS_REST_URL) {
            try {
                const fallbackData = await redis.get(url);
                if (fallbackData) {
                    console.warn(`[Fallback] Using cached data for: ${url}`);
                    return fallbackData;
                }
            } catch { }
        }

        if (error.name === 'AbortError') {
            console.error(`[Timeout] API response too slow (>10s): ${url}`);
        } else {
            console.error(`[Fetch Error] API call failed: ${url}`);
        }
        return null;
    }
});
