import redis from './redis';
import { cache } from 'react';

const REVALIDATE_SEC = 30; // Mặc định Vercel Cache 30 giây cho toàn hệ thống

/**
 * Hàm fetch an toàn kết hợp Vercel Cache (ISR) và Upstash Redis
 * Đã được wrap bởi React.cache() để tránh double transfer giữa Metadata và Page Component
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit & { revalidate?: number }): Promise<any> => {
    const revalidate = options?.revalidate ?? options?.next?.revalidate ?? REVALIDATE_SEC;
    
    // 1. KIỂM TRA REDIS TRƯỚC (Cache-First) - Phản hồi cực nhanh <50ms
    if (process.env.UPSTASH_REDIS_REST_URL) {
        try {
            const cachedData = await redis.get(url);
            if (cachedData) {
                // Trình duyệt nhận được data ngay lập tức ở đây
                // Kích hoàn cập nhật ngầm nếu cần
                void fetch(url, {
                    ...options,
                    next: { revalidate: revalidate },
                }).then(async (res) => {
                    if (res.ok) {
                        const newData = await res.json();
                        // Lưu lại trong Redis (7 ngày là tối đa để fallback, nhưng revalidate sẽ kiểm soát độ mới)
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
            next: { revalidate: revalidate },
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
