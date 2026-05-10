import { Movie } from "../types/movie";

/**
 * Global Client-side Cache
 * Giúp lưu trữ dữ liệu giữa các lần chuyển trang mà không cần Re-fetch liên tục.
 */

interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

const cache = new Map<string, CacheEntry<any>>();

// TTL mặc định là 5 phút
const DEFAULT_TTL = 5 * 60 * 1000;

export const globalCache = {
    set: <T>(key: string, data: T) => {
        cache.set(key, {
            data,
            timestamp: Date.now()
        });
    },

    get: <T>(key: string, ttl: number = DEFAULT_TTL): T | null => {
        const entry = cache.get(key);
        if (!entry) return null;

        const isExpired = Date.now() - entry.timestamp > ttl;
        if (isExpired) return null;

        return entry.data as T;
    },

    // Lấy dữ liệu kể cả khi đã hết hạn (dùng cho SWR)
    getRaw: <T>(key: string): T | null => {
        const entry = cache.get(key);
        return entry ? (entry.data as T) : null;
    },

    has: (key: string): boolean => {
        return cache.has(key);
    },

    clear: () => {
        cache.clear();
    }
};
