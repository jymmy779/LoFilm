import redis from './redis';

const REVALIDATE_SEC = 3600; // Mặc định Vercel Cache 1 tiếng

/**
 * Hàm fetch an toàn kết hợp Vercel Cache (ISR) và Upstash Redis
 * Luồng hoạt động:
 * 1. Gọi fetch() nguyên thủy (có Next.js Cache)
 * 2. Nếu thành công -> Lưu dữ liệu dự phòng vào Redis -> Trả về Client
 * 3. Nếu thất bại / Lỗi API gốc -> Nhanh chóng kéo dữ liệu dự phòng từ Redis lên để hotswap
 */
export async function fetchWithRedis(url: string, options?: RequestInit): Promise<any> {
    // 1. KIỂM TRA REDIS TRƯỚC (Cache-First) - Phản hồi cực nhanh <50ms
    if (process.env.UPSTASH_REDIS_REST_URL) {
        try {
            const cachedData = await redis.get(url);
            if (cachedData) {
                // Trình duyệt nhận được data ngay lập tức ở đây
                // Kích hoạt cập nhật ngầm (Background Revalidation) để cache luôn mới
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

    // 2. NẾU CACHE MISS -> MỚI GỌI API GỐC (Chấp nhận chờ 1.8s lần đầu)
    try {
        const response = await fetch(url, {
            ...options,
            next: { revalidate: options?.next?.revalidate ?? REVALIDATE_SEC },
        });

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
    } catch (error) {
        console.error(`[Fetch Error] Gọi API thất bại: ${url}`);
        return null;
    }
}
