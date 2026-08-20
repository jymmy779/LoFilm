import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";
import { redis, fetchWithRedis } from "@/app/lib/fetch-with-redis";
import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

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

        // 3. Tìm trên Backend nội bộ bằng fetchWithRedis siêu tốc
        searchParams.set("keyword", keyword);
        const internalApiPromise = fetchWithRedis(`${INTERNAL_API_URL}/tim-kiem?${searchParams.toString()}`, { revalidate: 60 })
            .catch(() => null);

        // Chạy song song cả 2 (Supabase độc quyền + Backend nội bộ 30k phim)
        const [supabaseRes, internalApiData] = await Promise.all([supabasePromise, internalApiPromise]);

        // 4. Format dữ liệu từ Supabase cho giống PhimAPI
        let exclusiveItems: any[] = [];
        if (supabaseRes.data) {
            exclusiveItems = supabaseRes.data.map((movie: any) => ({
                _id: movie.id,
                name: movie.name || "Phim Độc Quyền",
                slug: movie.slug,
                origin_name: movie.origin_name || "",
                type: movie.type,
                thumb_url: movie.thumb_url || "",
                poster_url: movie.poster_url || "",
                year: movie.year || new Date().getFullYear(),
                episode_current: movie.episode_current || "",
                episode_total: movie.episode_total || "",
                quality: movie.quality || "FHD",
                lang: movie.lang_tag || movie.lang || "Vietsub",
                lang_tag: movie.lang_tag || movie.lang || "Vietsub",
                is_copyright: true,
                sub_docquyen: movie.sub_docquyen ?? false
            }));
        }

        // 5. Lấy dữ liệu từ Backend nội bộ
        let apiItems: any[] = [];
        if (internalApiData && (internalApiData.status === "success" || internalApiData.status === true)) {
            apiItems = internalApiData.data?.items || internalApiData.items || [];
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

        // Enrich search items with Database
        const { enrichApiDataWithDatabase } = await import("@/app/utils/movieEnricher");
        const enrichedContainer = await enrichApiDataWithDatabase({ data: { items: finalItems } });
        if (enrichedContainer?.data?.items) {
            finalItems = enrichedContainer.data.items;
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
