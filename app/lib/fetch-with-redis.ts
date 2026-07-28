import { cache } from 'react';
import Redis from 'ioredis';
import axios from 'axios';

const DEFAULT_REVALIDATE_SEC = 60; // Cache 60 giây theo ý bạn

// Khởi tạo Redis client (Singleton) an toàn cho Next.js HMR
const globalForRedis = global as unknown as { redis: Redis };

export const redis =
  globalForRedis.redis ||
  (process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        commandTimeout: 3000,
        enableOfflineQueue: false,
        keepAlive: 10000,
      })
    : null);

if (process.env.NODE_ENV !== "production") globalForRedis.redis = redis as Redis;

if (redis && !globalForRedis.redis) {
    redis.on('error', (err) => console.error('[Redis Error]', err.message));
}

/**
 * fetchWithRedis: Sử dụng Redis RAM Cache để tăng tốc tối đa.
 * Nếu Redis lỗi, sẽ tự động dùng axios thông thường (Fallback).
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit & { revalidate?: number | false }): Promise<any> => {
    const rawRevalidate = options?.revalidate ?? options?.next?.revalidate ?? DEFAULT_REVALIDATE_SEC;
    // Đảm bảo revalidate luôn là số giây (nếu là false thì dùng mặc định)
    const revalidate = typeof rawRevalidate === 'number' ? rawRevalidate : DEFAULT_REVALIDATE_SEC;
    // Đổi prefix để phân biệt với cache cũ, tránh lỗi format
    const cacheKey = `swr:${url}`;

    // Deduplicator (chống Cache Stampede)
    const globalForPromises = global as unknown as { pendingFetches: Map<string, Promise<any>> };
    if (!globalForPromises.pendingFetches) {
        globalForPromises.pendingFetches = new Map();
    }
    const pendingFetches = globalForPromises.pendingFetches;

    // Hàm gọi API gốc
    const _fetchFreshData = async (retryCount = 0): Promise<any> => {
        try {
            // Thêm cache-buster để bypass cache của Cloudflare/CDN bên thứ 3
            const safeRevalidate = revalidate && revalidate > 0 ? revalidate : 60;
            const separator = url.includes('?') ? '&' : '?';
            const cacheBuster = `_t=${Math.floor(Date.now() / 1000 / safeRevalidate)}`;
            const fetchUrl = `${url}${separator}${cacheBuster}`;

            const response = await axios.get(fetchUrl, {
                timeout: 8000, // 8 giây timeout để fail fast và không treo server
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json',
                }
            });

            if (response.status === 200 && response.data) {
                const data = response.data;
                if (redis && data) {
                    try {
                        const payload = {
                            timestamp: Date.now(),
                            data: data
                        };
                        // Dùng setex với TTL = 3x revalidate để data tự hết hạn
                        // Nếu SWR refresh fail thì data cũ vẫn tự xóa sau TTL
                        const ttlSeconds = revalidate * 3;
                        await redis.setex(cacheKey, ttlSeconds, JSON.stringify(payload));
                    } catch (err) {
                        console.error(`[Redis Set Error] ${url}`, err);
                    }
                }
                return data;
            } else {
                throw new Error(`API returned status ${response.status}`);
            }
        } catch (error: any) {
            if (retryCount < 1) { // Thử lại 1 lần nữa nếu lỗi
                return _fetchFreshData(retryCount + 1);
            }
            console.error(`[Axios Fetch Error After Retry] ${url}`, error.message);
            throw new Error(`Fetch failed for ${url}: ${error.message}`); // Ném lỗi để Next.js không cache kết quả rỗng
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

    // 1. Lục trong Redis trước
    if (redis) {
        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                const parsed = JSON.parse(cachedData);

                // Kiểm tra xem data có đúng chuẩn SWR mới không
                if (parsed && parsed.timestamp && parsed.data) {
                    const ageMs = Date.now() - parsed.timestamp;
                    const maxAgeMs = revalidate * 1000;

                    // Nếu quá hạn (Stale), kích hoạt fetch ngầm để cập nhật cho lần sau
                    if (ageMs > maxAgeMs) {
                        // Bỏ await để KHÔNG BLOCK - Dữ liệu cũ được trả về ngay lập tức (True SWR)
                        fetchFreshData().catch((err) => console.error("SWR Update Failed", err));
                    }

                    // Luôn luôn trả về data ngay lập tức (dù cũ hay mới)
                    return parsed.data;
                }
            }
        } catch (err) {
            console.error(`[Redis Get Error] ${url}`, err);
        }
    }

    // 2. Nếu chưa từng lưu Cache (lần truy cập đầu tiên), bắt buộc phải chờ fetch
    return fetchFreshData();
});

/**
 * Utility để xóa toàn bộ cache khi cần
 */
export const flushMemoryCache = async () => {
    if (redis) {
        await redis.flushdb();
    }
};

