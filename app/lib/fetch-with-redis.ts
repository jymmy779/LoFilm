import { cache } from 'react';

const DEFAULT_REVALIDATE_SEC = 30; // Default revalidation interval

// Simple in-memory cache structure
interface CacheEntry {
    data: any;
    expiry: number;
}

/**
 * Global memory cache to persist across hot-reloads in development
 * and maintain state in serverless environments as long as the instance is warm.
 */
const globalWithCache = global as typeof globalThis & {
    memoryCache?: Map<string, CacheEntry>;
};

if (!globalWithCache.memoryCache) {
    globalWithCache.memoryCache = new Map();
}

const memoryCache = globalWithCache.memoryCache;

/**
 * Smart fetch with local Memory Cache.
 * Memory TTL = revalidate seconds → data always fresh within that window.
 * No external Redis requests used, zero cost, zero latency.
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit & { revalidate?: number }): Promise<any> => {
    const rawRevalidate = options?.revalidate ?? options?.next?.revalidate ?? DEFAULT_REVALIDATE_SEC;
    const revalidate = typeof rawRevalidate === 'number' ? rawRevalidate : DEFAULT_REVALIDATE_SEC;
    const now = Date.now();

    // 1. CHECK LOCAL MEMORY CACHE
    const cached = memoryCache.get(url);
    if (cached && cached.expiry > now) {
        return cached.data;
    }

    // 2. CACHE MISS → Fetch from origin API with 10s timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            // We use Next.js native cache as Tier 2 (File system)
            next: { revalidate: revalidate }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();

            // Store in Memory Cache with TTL
            memoryCache.set(url, {
                data,
                expiry: now + (revalidate * 1000)
            });

            // Boundary management: prevent memory leaks by limiting cache size (max 30000 items)
            if (memoryCache.size > 30000) {
                const firstKey = memoryCache.keys().next().value;
                if (firstKey) memoryCache.delete(firstKey);
            }

            return data;
        } else {
            throw new Error(`API Endpoint returned status: ${response.status}`);
        }
    } catch (error: any) {
        clearTimeout(timeoutId);

        // On fetch failure, try memory cache even if expired as last resort
        if (cached) {
            console.warn(`[Fallback] Using expired local cache for: ${url}`);
            return cached.data;
        }

        if (error.name === 'AbortError') {
            console.error(`[Timeout] API response too slow (>10s): ${url}`);
        } else {
            console.error(`[Fetch Error] API call failed: ${url}`);
        }
        return null;
    }
});

/**
 * Utility to clear the local memory cache
 */
export const flushMemoryCache = () => {
    memoryCache.clear();
    console.log('[Cache] Memory cache cleared.');
};
