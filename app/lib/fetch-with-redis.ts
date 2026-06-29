import { cache } from 'react';
import Redis from 'ioredis';
import axios from 'axios';

const DEFAULT_REVALIDATE_SEC = 60; // Cache 60 giây theo ý bạn

// Khởi tạo Redis client (Singleton)
export let redis: Redis | null = null;

try {
    console.log('[Redis Init] REDIS_URL is:', process.env.REDIS_URL ? 'FOUND' : 'NOT FOUND');
    if (process.env.REDIS_URL) {
        redis = new Redis(process.env.REDIS_URL, {
            maxRetriesPerRequest: 1,
            connectTimeout: 2000,
        });
        redis.on('error', (err) => console.error('[Redis Error]', err.message));
    }
} catch (error) {
    console.error('[Redis Setup Error]', error);
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

    // Hàm gọi API gốc
    const fetchFreshData = async (retryCount = 0): Promise<any> => {
        try {
            // Thêm cache-buster để bypass cache của Cloudflare/CDN bên thứ 3
            const safeRevalidate = revalidate && revalidate > 0 ? revalidate : 60;
            const separator = url.includes('?') ? '&' : '?';
            const cacheBuster = `_t=${Math.floor(Date.now() / 1000 / safeRevalidate)}`;
            const fetchUrl = `${url}${separator}${cacheBuster}`;

            const response = await axios.get(fetchUrl, {
                timeout: 20000, // 20 giây timeout
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
                        // LƯU VĨNH VIỄN (không dùng setex nữa)
                        await redis.set(cacheKey, JSON.stringify(payload));
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
                return fetchFreshData(retryCount + 1);
            }
            console.error(`[Axios Fetch Error After Retry] ${url}`, error.message);
            return null; // Nếu sập hẳn thì đành chịu (nhưng nhờ SWR, ta ít khi phải chạy tới dòng này)
        }
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
                        // Không dùng await ở đây! Cứ để nó chạy ngầm.
                        fetchFreshData().catch(err => console.error("SWR Background Update Failed", err));
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
        console.log('[Cache] Toàn bộ Redis cache đã được xóa.');
    }
};

