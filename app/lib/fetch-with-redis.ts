import redis from './redis';
import { cache } from 'react';

// TTL mặc định cho từng loại data
const DEFAULT_REVALIDATE_SEC = 30;

/**
 * Xác định Redis TTL phù hợp dựa trên URL endpoint.
 * - Phim detail / episode data: TTL ngắn = revalidate * 2 (tối đa 120s)
 *   để đảm bảo ISR 30s có thể cập nhật dữ liệu thực
 * - Danh sách phim (category, country...): TTL vừa = 5 phút
 * - Data tĩnh (categories list, countries list): TTL dài = 1 giờ
 */
function getRedisTtl(url: string, revalidateSec: number): number {
    // Phim detail - cần cập nhật nhanh khi có tập mới
    if (/\/phim\/[^/]+$/.test(url)) {
        // TTL = revalidate * 2, tối thiểu 30s, tối đa 120s
        return Math.min(Math.max(revalidateSec * 2, 30), 120);
    }

    // Danh sách phim (phim-moi, the-loai, quoc-gia, danh-sach...)
    if (/\/(v1\/api|danh-sach|the-loai|quoc-gia)\//.test(url)) {
        // TTL = revalidate * 3, tối thiểu 60s, tối đa 300s
        return Math.min(Math.max(revalidateSec * 3, 60), 300);
    }

    // Data tĩnh: danh sách thể loại, quốc gia (top-level)
    if (/\/(the-loai|quoc-gia)$/.test(url)) {
        return 3600; // 1 giờ
    }

    // Default: 5 phút
    return Math.min(Math.max(revalidateSec * 3, 60), 300);
}

/**
 * Hàm fetch an toàn kết hợp Vercel ISR Cache và Upstash Redis
 * Được wrap bởi React.cache() để tránh double-fetch giữa Metadata và Page Component.
 *
 * Chiến lược: SWR (Stale-While-Revalidate)
 * - Cache HIT: Trả về data cũ NGAY LẬP TỨC + kích hoạt background refresh
 * - Cache MISS: Gọi API → lưu Redis với TTL ngắn → trả về data mới
 *
 * QUAN TRỌNG: Redis TTL được tính dựa trên loại URL.
 * Phim detail dùng TTL ngắn (60-120s) để ISR 30s có tác dụng thực sự.
 */
export const fetchWithRedis = cache(async (
    url: string,
    options?: RequestInit & { revalidate?: number }
): Promise<any> => {
    const revalidate = options?.revalidate ?? options?.next?.revalidate ?? DEFAULT_REVALIDATE_SEC;
    const redisTtl = getRedisTtl(url, revalidate);

    // 1. KIỂM TRA REDIS TRƯỚC (Cache-First) - Phản hồi cực nhanh <50ms
    if (process.env.UPSTASH_REDIS_REST_URL) {
        try {
            const cachedData = await redis.get(url);
            if (cachedData) {
                // Kích hoạt background refresh để cập nhật Redis
                // Không await - fire-and-forget để không block response
                void fetch(url, {
                    ...options,
                    signal: undefined,
                    next: { revalidate },
                }).then(async (res) => {
                    if (res.ok) {
                        const newData = await res.json();
                        // Lưu với TTL ngắn phù hợp với loại URL
                        redis.set(url, newData, { ex: redisTtl }).catch(() => {});
                    }
                }).catch(() => {});

                return cachedData;
            }
        } catch (e) {
            console.error('[Redis] Get error:', e);
        }
    }

    // 2. CACHE MISS → Gọi API gốc với timeout 10s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
        const response = await fetch(url, {
            ...options,
            signal: controller.signal,
            next: { revalidate },
        });

        clearTimeout(timeoutId);

        if (response.ok) {
            const data = await response.json();

            // Lưu Redis với TTL ngắn dựa trên loại URL (không phải 7 ngày cứng!)
            if (process.env.UPSTASH_REDIS_REST_URL) {
                redis.set(url, data, { ex: redisTtl }).catch((e) =>
                    console.error('[Redis] Set error:', e)
                );
            }

            return data;
        } else {
            throw new Error(`API returned status: ${response.status}`);
        }
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            console.error(`[Timeout] API quá chậm (>10s): ${url}`);
        } else {
            console.error(`[Fetch Error] Gọi API thất bại: ${url}`);
        }
        return null;
    }
});
