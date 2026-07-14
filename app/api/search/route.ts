import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { redis } from "@/app/lib/fetch-with-redis";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get("keyword") || "";
        const limit = parseInt(searchParams.get("limit") || "10");

        if (!keyword || keyword.trim().length < 2) {
            return NextResponse.json({ status: "success", data: { items: [] } });
        }

        // Cache Key (Normalize keyword and include limit to distinguish search requests)
        const normalizedKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
        const cacheKey = `search_api:${normalizedKeyword}_limit:${limit}`;

        // 1. Try reading from Redis first (Cache for 5 minutes = 300 seconds)
        if (redis) {
            try {
                const cached = await redis.get(cacheKey);
                if (cached) {
                    const parsed = JSON.parse(cached);
                    const ageMs = Date.now() - parsed.timestamp;
                    const maxAgeMs = 300 * 1000;

                    if (ageMs <= maxAgeMs) {
                        return NextResponse.json({
                            status: "success",
                            data: {
                                items: parsed.data
                            }
                        });
                    }
                }
            } catch (err) {
                console.error("[Redis GET search error]", err);
            }
        }

        const supabase = await createClient();

        // 2. Tìm trong Supabase (Phim độc quyền)
        // Sử dụng .ilike để tìm kiếm mờ (không phân biệt hoa thường) trực tiếp trên database
        // Đỡ phải tải toàn bộ data về RAM của server
        const supabasePromise = supabase
            .from("exclusive_movies")
            .select("*")
            .eq("status", "published")
            .or(`name.ilike.%${keyword}%,origin_name.ilike.%${keyword}%`)
            .order('created_at', { ascending: false })
            .limit(limit);

        // 3. Tìm trên PhimAPI (Truyền toàn bộ params gốc để hỗ trợ page, sort)
        // Chuyển keyword sang không dấu vì CSDL của PhimAPI bị lỗi encoding NFD với tiếng Việt có dấu
        const apiKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
        searchParams.set("keyword", apiKeyword);
        const phimApiPromise = fetch(`https://phimapi.com/v1/api/tim-kiem?${searchParams.toString()}`)
            .then(res => res.json())
            .catch(() => null);

        // Chạy song song cả 2
        const [supabaseRes, phimApiData] = await Promise.all([supabasePromise, phimApiPromise]);

        // 4. Format dữ liệu từ Supabase cho giống PhimAPI
        let exclusiveItems: any[] = [];
        if (supabaseRes.data) {
            exclusiveItems = supabaseRes.data.map(movie => ({
                _id: movie.id,
                name: movie.name || "Phim Độc Quyền",
                slug: movie.slug,
                origin_name: movie.origin_name || "",
                type: movie.type,
                thumb_url: movie.thumb_url || "",
                poster_url: movie.poster_url || "",
                year: movie.year || new Date().getFullYear(),
                is_copyright: true,
                sub_docquyen: true
            }));
        }

        // 5. Lấy dữ liệu từ PhimAPI
        let apiItems: any[] = [];
        if (phimApiData && phimApiData.status === "success" && phimApiData.data?.items) {
            apiItems = phimApiData.data.items;
        }

        // 6. Gộp kết quả, ưu tiên phim độc quyền xếp trên
        // Tránh trùng lặp slug (nếu PhimAPI trả về trùng với phim độc quyền)
        const exclusiveSlugs = new Set(exclusiveItems.map(item => item.slug));
        const filteredApiItems = apiItems.filter(item => !exclusiveSlugs.has(item.slug));

        let finalItems = [...exclusiveItems, ...filteredApiItems];
        
        // Cắt bớt nếu vượt quá limit
        if (finalItems.length > limit) {
            finalItems = finalItems.slice(0, limit);
        }

        // 7. Save merged search results to Redis cache
        if (redis && finalItems.length > 0) {
            try {
                const payload = {
                    timestamp: Date.now(),
                    data: finalItems
                };
                await redis.set(cacheKey, JSON.stringify(payload));
            } catch (err) {
                console.error("[Redis SET search error]", err);
            }
        }

        return NextResponse.json({
            status: "success",
            data: {
                items: finalItems
            }
        });
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ status: "error", message: "Failed to search movies" }, { status: 500 });
    }
}
