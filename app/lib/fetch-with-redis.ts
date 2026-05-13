import { cache } from 'react';
import Redis from 'ioredis';

const DEFAULT_REVALIDATE_SEC = 60; // Cache 60 giây theo ý bạn

// Khởi tạo Redis client (Singleton)
let redis: Redis | null = null;

try {
    if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            connectTimeout: 2000, // Timeout kết nối 2s để không làm chậm app
        });
        redis.on('error', (err) => console.error('[Redis Error]', err.message));
    }
} catch (error) {
    console.error('[Redis Setup Error]', error);
}

/**
 * fetchWithRedis: Sử dụng Redis RAM Cache để tăng tốc tối đa.
 * Nếu Redis lỗi, sẽ tự động dùng fetch thông thường (Fallback).
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit & { revalidate?: number | false }): Promise<any> => {
    const rawRevalidate = options?.revalidate ?? options?.next?.revalidate ?? DEFAULT_REVALIDATE_SEC;
    // Đảm bảo revalidate luôn là số giây (nếu là false thì dùng mặc định)
    const revalidate = typeof rawRevalidate === 'number' ? rawRevalidate : DEFAULT_REVALIDATE_SEC;
    const cacheKey = `fetch:${url}`;

    // 1. Thử lấy từ Redis trước
    if (redis) {
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                // console.log(`[Cache Hit] ${url}`);
                return JSON.parse(cachedData);
            }
        } catch (err) {
            console.error(`[Redis Get Error] ${url}`, err);
        }
    }

    // 2. Nếu không có trong cache, gọi API gốc
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();

            // 3. Lưu vào Redis cho lần sau (chỉ lưu nếu có dữ liệu)
            if (redis && data) {
                try {
                    // Dùng setex: (key, seconds, value)
                    await redis.setex(cacheKey, revalidate, JSON.stringify(data));
                } catch (err) {
                    console.error(`[Redis Set Error] ${url}`, err);
                }
            }
            return data;
        } else {
            console.error(`[Fetch Error] API returned ${response.status}: ${url}`);
            return null;
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        console.error(`[Fetch Error] ${url}`, error.message);
        return null;
    }
});

/**
 * Utility để xóa toàn bộ cache khi cần
 */
export const flushMemoryCache = async () => {
    if (redis) {
        await redis.flushdb();
        console.log('[Cache] Toàn bộ Redis cache đã được xóa.');
    }
};

