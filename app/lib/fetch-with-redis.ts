import redis from './redis';
import { cache } from 'react';

const REVALIDATE_SEC = 3600; // Mặc định Vercel Cache 1 tiếng

/**
 * Hàm fetch an toàn kết hợp Vercel Cache (ISR) và Upstash Redis
 * Đã được wrap bởi React.cache() để tránh double transfer giữa Metadata và Page Component
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit): Promise<any> => {
    // 1. KIỂM TRA REDIS TRƯỚC (Cache-First) - Phản hồi cực nhanh <50ms
    if (process.env.UPSTASH_REDIS_REST_URL) {
        try {
            const cachedData = await redis.get(url);
            if (cachedData) {
                // Trình duyệt nhận được data ngay lập tức ở đây
                // Kích hoạt cập nhật ngầm mà không đợi phản hồi (Fire and forget)
                void fetch(url, {
                    ...options,
                    next: { revalidate: options?.next?.revalidate ?? REVALIDATE_SEC },
                }).then(async (res) => {
                    if (res.ok) {
                        const newData = await res.json();
                        redis.set(url, newData, { ex: 604800 }).catch(() => {});
                    }
                }).catch(() => {});

                return cachedData;
            }
        } catch (e) {
            console.error("Redis get error:", e);
        }
    }

    // 2. NẾU CACHE MISS -> GỌI API GỐC VỚI TIMEOUT 10S
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 giây là tối đa

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            next: { revalidate: options?.next?.revalidate ?? REVALIDATE_SEC },
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();
            
            // Lưu lại trong Redis cho lần sau (7 ngày)
            if (process.env.UPSTASH_REDIS_REST_URL) {
                redis.set(url, data, { ex: 604800 }).catch((e) => console.error("Redis set error:", e));
            }
            
            return data;
        } else {
            throw new Error(`API Endpoint returned status: ${response.status}`);
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`[Timeout] API phản hồi quá lâu (>10s): ${url}`);
        } else {
            console.error(`[Fetch Error] Gọi API thất bại: ${url}`);
        }
        return null;
    }
});
