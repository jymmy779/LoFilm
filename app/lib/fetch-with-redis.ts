import { cache } from 'react';

const DEFAULT_REVALIDATE_SEC = 60; // Nâng lên 60 giây để tiết kiệm CPU

/**
 * fetchWithRedis: Bây giờ sử dụng trực tiếp Next.js Data Cache.
 * Vercel sẽ tự động quản lý việc lưu trữ bền vững trên File System,
 * giúp giảm CPU và ổn định hơn so với dùng RAM thủ công.
 */
export const fetchWithRedis = cache(async (url: string, options?: RequestInit & { revalidate?: number }): Promise<any> => {
    const revalidate = options?.revalidate ?? options?.next?.revalidate ?? DEFAULT_REVALIDATE_SEC;
    
    // Tạo controller để xử lý timeout 10s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            // Tận dụng cơ chế Cache của Next.js
            next: { 
                revalidate: revalidate,
                // Cho phép stale-while-revalidate tự động bởi Vercel
                tags: [url] 
            }
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            return await response.json();
        } else {
            console.error(`[Fetch Error] API returned ${response.status}: ${url}`);
            return null;
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`[Timeout] API phản hồi quá chậm (>10s): ${url}`);
        } else {
            console.error(`[Fetch Error] Lỗi kết nối API: ${url}`);
        }
        return null;
    }
});

/**
 * Utility để clear cache
 */
export const flushMemoryCache = () => {
    console.log('[Cache] Next.js Data Cache được quản lý tự động bởi Vercel.');
};

