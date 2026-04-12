import redis from './redis';
import { cache } from 'react';

const REVALIDATE_SEC = 30; // Mặc định Vercel Cache 30 giây cho toàn hệ thống

/**
 * Hàm fetch an toàn kết hợp Vercel Cache (ISR) và Upstash Redis
 * Đã được wrap bởi React.cache() để tránh double transfer giữa Metadata và Page Component
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit & { revalidate?: number }): Promise<any> => {
    const revalidateValue = options?.revalidate ?? options?.next?.revalidate;
    const revalidate = typeof revalidateValue === 'number' ? revalidateValue : (revalidateValue === false ? 2592000 : REVALIDATE_SEC);
    
    // 1. KIỂM TRA REDIS
    if (process.env.UPSTASH_REDIS_REST_URL) {
        try {
            const cached: any = await redis.get(url);
            if (cached) {
                // Kiểm tra xem dữ liệu có đi kèm timestamp không (format mới)
                const now = Date.now();
                // Nếu không có timestamp (dữ liệu cũ) hoặc timestamp đã quá hạn -> Coi là Stale (cũ)
                const isStale = !cached._ts || typeof cached._ts !== 'number' || (now - (cached._ts as number)) > (revalidate * 1000);
                
                // Nếu dữ liệu còn mới (đã có timestamp và chưa quá hạn), trả về ngay
                if (!isStale && cached._data) {
                    return cached._data;
                }

                // Nếu dữ liệu đã stale (cũ), chúng ta sẽ cố gắng fetch mới
                // nhưng vẫn có fallback nếu fetch thất bại
                console.log(`[Cache Stale] Re-fetching: ${url}`);
            }
        } catch (e) {
            console.error("Redis get error:", e);
        }
    }

    // 2. GỌI API GỐC
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
            
            // Lưu vào Redis kèm timestamp
            if (process.env.UPSTASH_REDIS_REST_URL) {
                const cachePayload = {
                    _data: data,
                    _ts: Date.now()
                };
                // Lưu 7 ngày để fallback, nhưng timestamp (isStale) sẽ kiểm soát độ tươi
                redis.set(url, cachePayload, { ex: 604800 }).catch(() => {});
            }
            
            return data;
        } else {
            throw new Error(`API status: ${response.status}`);
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        
        // NẾU FETCH LỖI -> THỬ TRẢ VỀ DATA CŨ TRONG REDIS (FALLBACK)
        if (process.env.UPSTASH_REDIS_REST_URL) {
            const oldCached: any = await redis.get(url);
            if (oldCached) {
                console.log(`[Fallback] Sử dụng dữ liệu cũ do API lỗi: ${url}`);
                return oldCached._data || oldCached;
            }
        }
        return null;
    }
});

