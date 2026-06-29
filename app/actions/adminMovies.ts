"use server";
import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";

export async function addExclusiveMovie(formData: FormData) {
    let tmdbId = formData.get("tmdb_id") as string || "";
    const slug = formData.get("slug") as string;
    const type = formData.get("type") as string;
    const linkM3u8 = formData.get("link_m3u8") as string;
    const linkVtt = formData.get("link_vtt") as string;
    const name = formData.get("episode_name") as string || "Full";
    const episodeSlug = formData.get("episode_slug") as string || "tap-full";
    const status = formData.get("status") as string || "published";
    const langTag = formData.get("lang_tag") as string || "Vietsub Độc Quyền";

    if (!slug || (type === "single" && !linkM3u8)) {
        return { error: "Vui lòng nhập đủ các trường bắt buộc" };
    }

    let movieName = "";
    let originName = "";
    let thumbUrl = "";
    let posterUrl = "";
    let year = new Date().getFullYear();

    // Nếu không nhập TMDB ID, phải đảm bảo phim đã có trên PhimAPI
    if (!tmdbId.trim()) {
        try {
            const check = await fetch(`https://phimapi.com/v1/api/phim/${slug.toLowerCase().trim()}`);
            const checkData = await check.json();
            if (!checkData || !checkData.status) {
                return { error: "Phim chưa có trên PhimAPI. Bắt buộc phải nhập TMDB ID để lấy thông tin phim!" };
            }
            if (checkData.movie?.tmdb?.id) {
                tmdbId = checkData.movie.tmdb.id;
            }
            movieName = checkData.movie?.name || "";
            originName = checkData.movie?.origin_name || "";
            thumbUrl = checkData.movie?.thumb_url || "";
            posterUrl = checkData.movie?.poster_url || "";
            year = checkData.movie?.year || new Date().getFullYear();
        } catch (error) {
            return { error: "Lỗi kiểm tra PhimAPI. Vui lòng nhập TMDB ID." };
        }
    } else {
        // Có TMDB ID thì gọi API TMDB để lấy data (nếu phim chưa có trên PhimAPI)
        try {
            const tmdbType = type === "single" ? "movie" : "tv";
            const apiKey = "fb7bb23f03b6994dafc674c074d01761"; 
            const [resVi, resEn] = await Promise.all([
                fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId.trim()}?api_key=${apiKey}&language=vi-VN`),
                fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId.trim()}?api_key=${apiKey}&language=en-US`)
            ]);
            
            const dataVi = resVi.ok ? await resVi.json() : null;
            const dataEn = resEn.ok ? await resEn.json() : null;
            
            if (dataVi || dataEn) {
                const data = dataVi || dataEn;
                const enData = dataEn || dataVi;
                
                movieName = data.title || data.name || "";
                originName = enData.title || enData.name || data.original_title || data.original_name || "";
                
                const pPath = enData.poster_path || data.poster_path || "";
                const bPath = enData.backdrop_path || data.backdrop_path || pPath;
                posterUrl = pPath ? `https://image.tmdb.org/t/p/w500${pPath}` : "";
                thumbUrl = bPath ? `https://image.tmdb.org/t/p/w780${bPath}` : "";
                
                const releaseDate = data.release_date || data.first_air_date || "";
                if (releaseDate) {
                    year = parseInt(releaseDate.split('-')[0]);
                }
            }
        } catch (e) {
            console.error("Lỗi lấy data TMDB", e);
        }
    }

    const supabase = await createClient();

    // 1. Insert movie
    const { data: movie, error: insertError } = await supabase.from('exclusive_movies').insert([
        { 
            tmdb_id: tmdbId.trim() || "",
            slug: slug.toLowerCase().trim(), 
            type, 
            status, 
            lang_tag: langTag,
            name: movieName,
            origin_name: originName,
            thumb_url: thumbUrl,
            poster_url: posterUrl,
            year: year
        }
    ]).select().single();

    if (insertError || !movie) {
        return { error: insertError?.message || "Lỗi khi thêm phim" };
    }

    if (type === "single") {
        // Tự động thêm 1 tập cho phim lẻ
        const { error: episodeError } = await supabase.from('exclusive_episodes').insert([
            { movie_id: movie.id, name, slug: episodeSlug, link_m3u8: linkM3u8, link_vtt: linkVtt, order: 1 }
        ]);
        if (episodeError) return { error: episodeError.message };
    } else {
        // Nếu là phim bộ, kiểm tra xem có nhập bulk_links ngay từ đầu không
        const bulkLinks = formData.get("bulk_links") as string;
        const bulkVttLinks = formData.get("bulk_vtt_links") as string;
        
        if (bulkLinks && bulkLinks.trim().length > 0) {
            const rawM3u8 = bulkLinks.split('\n').map(l => l.trim());
            const rawVtt = bulkVttLinks ? bulkVttLinks.split('\n').map(l => l.trim()) : [];
            
            const episodeInserts = [];
            let epIndex = 0;
            for (let i = 0; i < rawM3u8.length; i++) {
                if (rawM3u8[i].length > 0) {
                    const epNumStr = String(epIndex + 1).padStart(2, '0');
                    episodeInserts.push({
                        movie_id: movie.id,
                        name: `Tập ${epNumStr}`,
                        slug: `tap-${epNumStr}`,
                        link_m3u8: rawM3u8[i],
                        link_vtt: (rawVtt[i] && rawVtt[i].length > 0) ? rawVtt[i] : null,
                        order: epIndex + 1
                    });
                    epIndex++;
                }
            }
            
            if (episodeInserts.length > 0) {
                const { error: bulkError } = await supabase.from('exclusive_episodes').insert(episodeInserts);
                if (bulkError) return { error: bulkError.message };
            }
        } else if (linkM3u8) {
            // Nếu không nhập bulk list nhưng có nhập link M3U8 đơn -> Tự động thêm Tập 01
            const { error: epError } = await supabase.from('exclusive_episodes').insert([
                { movie_id: movie.id, name: "Tập 01", slug: "tap-01", link_m3u8: linkM3u8, link_vtt: linkVtt, order: 1 }
            ]);
            if (epError) return { error: epError.message };
        }
    }

    revalidatePath("/admin/doc-quyen");
    return { success: true };
}

export async function deleteExclusiveMovie(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("exclusive_movies").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/doc-quyen");
    return { success: true };
}

export async function updateExclusiveMovie(id: string, formData: FormData) {
    let tmdbId = formData.get("tmdb_id") as string || "";
    const slug = formData.get("slug") as string;
    const type = formData.get("type") as string;
    const status = formData.get("status") as string;
    const langTag = formData.get("lang_tag") as string || "Vietsub Độc Quyền";

    if (!slug) return { error: "Thiếu trường Slug" };

    if (!tmdbId.trim()) {
        try {
            const check = await fetch(`https://phimapi.com/v1/api/phim/${slug.toLowerCase().trim()}`);
            const checkData = await check.json();
            if (!checkData || !checkData.status) {
                return { error: "Phim chưa có trên PhimAPI. Bắt buộc phải nhập TMDB ID!" };
            }
            if (checkData.movie?.tmdb?.id) {
                tmdbId = checkData.movie.tmdb.id;
            }
        } catch (error) {
            return { error: "Lỗi kiểm tra PhimAPI. Vui lòng nhập TMDB ID." };
        }
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from("exclusive_movies")
        .update({
            slug: slug.toLowerCase().trim(),
            tmdb_id: tmdbId.trim(),
            type: type,
            status: status,
            lang_tag: langTag
        })
        .eq("id", id);

    if (error) return { error: `Lỗi cập nhật phim: ${error.message}` };
    revalidatePath("/admin/doc-quyen");
    return { success: true };
}

export async function bulkAddExclusiveEpisodes(movieId: string, startEpisode: number, linksText: string, vttLinksText: string) {
    if (!linksText.trim()) return { error: "Danh sách link trống" };
    
    const rawM3u8 = linksText.split('\n').map(l => l.trim());
    const rawVtt = vttLinksText ? vttLinksText.split('\n').map(l => l.trim()) : [];
    
    let validCount = 0;
    for (let i = 0; i < rawM3u8.length; i++) {
        if (rawM3u8[i].length > 0) validCount++;
    }
    if (validCount === 0) return { error: "Không tìm thấy link m3u8 hợp lệ" };

    const supabase = await createClient();
    
    const episodesToInsert = [];
    let epOffset = 0;
    
    for (let i = 0; i < rawM3u8.length; i++) {
        if (rawM3u8[i].length > 0) {
            const epNum = startEpisode + epOffset;
            const epNumStr = String(epNum).padStart(2, '0');
            episodesToInsert.push({
                movie_id: movieId,
                server_name: "Vietsub",
                name: `Tập ${epNumStr}`,
                slug: `tap-${epNumStr}`,
                link_m3u8: rawM3u8[i],
                link_vtt: (rawVtt[i] && rawVtt[i].length > 0) ? rawVtt[i] : null,
                order: epNum
            });
            epOffset++;
        }
    }

    const { error } = await supabase.from('exclusive_episodes').insert(episodesToInsert);

    if (error) return { error: `Lỗi thêm hàng loạt: ${error.message}` };
    revalidatePath("/admin/doc-quyen");
    return { success: true };
}

export async function addEpisode(movieId: string, formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const linkM3u8 = formData.get("link_m3u8") as string;
    const linkVtt = formData.get("link_vtt") as string;
    const order = parseInt(formData.get("order") as string || "1");

    if (!name || !slug || !linkM3u8) return { error: "Thiếu trường bắt buộc" };

    const supabase = await createClient();
    const { error } = await supabase
        .from("exclusive_episodes")
        .insert({
            movie_id: movieId,
            server_name: "Vietsub",
            name,
            slug: slug.toLowerCase().trim(),
            link_m3u8: linkM3u8.trim(),
            link_vtt: linkVtt ? linkVtt.trim() : null,
            order
        });

    if (error) return { error: error.message };
    revalidatePath("/admin/doc-quyen");
    return { success: true };
}

export async function updateEpisode(id: string, formData: FormData) {
    const name = formData.get("name") as string;
    const slug = formData.get("slug") as string;
    const linkM3u8 = formData.get("link_m3u8") as string;
    const linkVtt = formData.get("link_vtt") as string;
    const order = parseInt(formData.get("order") as string || "1");

    if (!name || !slug || !linkM3u8) return { error: "Thiếu trường bắt buộc" };

    const supabase = await createClient();
    const { error } = await supabase
        .from("exclusive_episodes")
        .update({
            name,
            slug: slug.toLowerCase().trim(),
            link_m3u8: linkM3u8.trim(),
            link_vtt: linkVtt ? linkVtt.trim() : null,
            order
        })
        .eq("id", id);

    if (error) return { error: error.message };
    revalidatePath("/admin/doc-quyen");
    return { success: true };
}

export async function deleteEpisode(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("exclusive_episodes").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin/doc-quyen");
    return { success: true };
}

export async function previewTMDB(tmdbId: string, type: "single" | "series") {
    try {
        if (!tmdbId.trim()) return { title: "Dữ liệu sẽ lấy từ PhimAPI", poster: "", overview: "" };
        const tmdbType = type === "single" ? "movie" : "tv";
        const apiKey = "fb7bb23f03b6994dafc674c074d01761"; // Using one from the existing pool
        const [resVi, resEn] = await Promise.all([
            fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${apiKey}&language=vi-VN`),
            fetch(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId}?api_key=${apiKey}&language=en-US`)
        ]);
        if (!resVi.ok) return { error: "Không tìm thấy phim trên TMDB với ID này" };
        const data = await resVi.json();
        const dataEn = resEn.ok ? await resEn.json() : {};
        return {
            title: data.title || data.name,
            poster: `https://image.tmdb.org/t/p/w200${dataEn.poster_path || data.poster_path}`,
            overview: data.overview || dataEn.overview
        };
    } catch (e) {

        return { error: "Lỗi kết nối TMDB" };
    }
}
