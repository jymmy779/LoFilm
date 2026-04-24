import { NextResponse } from 'next/server';
import { fetchWithRedis } from '@/app/lib/fetch-with-redis';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const pages = parseInt(searchParams.get('pages') || '5'); // Mặc định nạp 5 trang (~100 phim)
    const type = searchParams.get('type') || 'phim-moi'; // Loại phim để nạp

    try {
        const moviesToWarm: string[] = [];

        console.log(`[Cache Warmer] Bắt đầu nạp dữ liệu cho ${pages} trang...`);

        // 1. Lấy danh sách phim để lấy slug
        for (let i = 1; i <= pages; i++) {
            let listUrl = `https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=${i}`;

            // Hỗ trợ nạp theo danh sách khác nếu cần
            if (type === 'phim-bo') {
                listUrl = `https://phimapi.com/v1/api/danh-sach/phim-bo?page=${i}`;
            } else if (type === 'phim-le') {
                listUrl = `https://phimapi.com/v1/api/danh-sach/phim-le?page=${i}`;
            }

            const res = await fetch(listUrl);
            const data = await res.json();

            const items = data?.items || data?.data?.items || [];
            if (items.length > 0) {
                items.forEach((item: any) => {
                    moviesToWarm.push(item.slug);
                });
            }
        }

        console.log(`[Cache Warmer] Tìm thấy ${moviesToWarm.length} phim. Bắt đầu nạp chi tiết...`);

        // 2. Chạy nạp chi tiết từng phim vào RAM
        // Chia nhỏ (Chunking) để tránh spam API quá nhanh
        const CHUNK_SIZE = 5;
        for (let i = 0; i < moviesToWarm.length; i += CHUNK_SIZE) {
            const chunk = moviesToWarm.slice(i, i + CHUNK_SIZE);
            await Promise.all(chunk.map(async (slug) => {
                const detailUrl = `https://phimapi.com/phim/${slug}`;
                // Gọi fetchWithRedis sẽ tự động lưu vào memoryCache
                await fetchWithRedis(detailUrl, { revalidate: 86400 }); // Lưu 24h
            }));

            // Nghỉ ngắn giữa các chunk để an toàn cho API
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        return NextResponse.json({
            success: true,
            totalMovies: moviesToWarm.length,
            message: `Thành công! Đã nạp dữ liệu của ${moviesToWarm.length} bộ phim vào bộ nhớ RAM.`,
            note: "Các trang phim này bây giờ sẽ mở lên tức thì."
        });
    } catch (error: any) {
        console.error("[Cache Warmer Error]", error);
        return NextResponse.json({
            success: false,
            error: error.message
        }, { status: 500 });
    }
}
