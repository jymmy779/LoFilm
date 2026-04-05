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
    try {
        // 1. Thử lấy dữ liệu thật từ API nguồn (Next.js sẽ chèn cache ISR vào đây)
        const response = await fetch(url, {
            ...options,
            next: { revalidate: options?.next?.revalidate ?? REVALIDATE_SEC },
        });

        if (response.ok) {
            // 2. Chuyển thành JSON và lưu vào Hầm Trú Ẩn (Redis)
            const data = await response.json();
            
            // Lưu lại trong Redis với thời lượng sống 7 ngày
            // Catch error để không làm sập luồng nếu Redis lỗi/chưa config
            if (process.env.UPSTASH_REDIS_REST_URL) {
                redis.set(url, data, { ex: 604800 }).catch((e) => console.error("Redis set error:", e));
            }
            
            return data;
        } else {
            throw new Error(`API Endpoint returned status: ${response.status}`);
        }
    } catch (error) {
        console.error(`[Fetch Error] Gọi API thất bại: ${url}`);
        
        // 3. KHẨN CẤP: Lấy data từ Redis thay thế để cứu trang web khỏi văng lỗi
        if (process.env.UPSTASH_REDIS_REST_URL) {
            console.log(`[Redis Fallback] Đang kéo data từ Redis hỏa tốc cho: ${url}`);
            try {
                const fallbackData = await redis.get(url);
                if (fallbackData) {
                    return fallbackData; // CỨU CÁNH THÀNH CÔNG!
                }
            } catch (redisError) {
                console.error("Lỗi khi đọc từ Redis:", redisError);
            }
        }
        
        // Trả về null nếu không có cách nào cứu được
        return null;
    }
}
