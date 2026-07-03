import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/app/utils/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const keyword = searchParams.get("keyword") || "";
        const limit = parseInt(searchParams.get("limit") || "10");

        if (!keyword || keyword.trim().length < 2) {
            return NextResponse.json({ status: "success", data: { items: [] } });
        }

        const supabase = await createClient();

        // 1. Tìm trong Supabase (Phim độc quyền)
        // Lấy tất cả và filter bằng JS để xử lý triệt để chữ hoa/thường tiếng Việt (ví dụ: Đ và đ)
        const supabasePromise = supabase
            .from("exclusive_movies")
            .select("*")
            .eq("status", "published")
            .order('created_at', { ascending: false });

        // 2. Tìm trên PhimAPI (Truyền toàn bộ params gốc để hỗ trợ page, sort)
        // Chuyển keyword sang không dấu vì CSDL của PhimAPI bị lỗi encoding NFD với tiếng Việt có dấu
        const apiKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
        searchParams.set("keyword", apiKeyword);
        const phimApiPromise = fetch(`https://phimapi.com/v1/api/tim-kiem?${searchParams.toString()}`)
            .then(res => res.json())
            .catch(() => null);

        // Chạy song song cả 2
        const [supabaseRes, phimApiData] = await Promise.all([supabasePromise, phimApiPromise]);

        // 3. Format dữ liệu từ Supabase cho giống PhimAPI
        let exclusiveItems: any[] = [];
        if (supabaseRes.data) {
            const kw = keyword.toLowerCase();
            const filteredMovies = supabaseRes.data.filter(movie => {
                const name = movie.name?.toLowerCase() || "";
                const originName = movie.origin_name?.toLowerCase() || "";
                return name.includes(kw) || originName.includes(kw);
            });

            exclusiveItems = filteredMovies.map(movie => ({
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

        // 4. Lấy dữ liệu từ PhimAPI
        let apiItems: any[] = [];
        if (phimApiData && phimApiData.status === "success" && phimApiData.data?.items) {
            apiItems = phimApiData.data.items;
        }

        // 5. Gộp kết quả, ưu tiên phim độc quyền xếp trên
        // Tránh trùng lặp slug (nếu PhimAPI trả về trùng với phim độc quyền)
        const exclusiveSlugs = new Set(exclusiveItems.map(item => item.slug));
        const filteredApiItems = apiItems.filter(item => !exclusiveSlugs.has(item.slug));

        let finalItems = [...exclusiveItems, ...filteredApiItems];
        
        // Cắt bớt nếu vượt quá limit
        if (finalItems.length > limit) {
            finalItems = finalItems.slice(0, limit);
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
