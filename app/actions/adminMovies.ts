"use server";
import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import axios from "axios";

// Parse textarea input "label|url" per line into SubtitleTrack array
function parseSubtitleInput(raw: string | null): { lang: string; label: string; url: string }[] {
    if (!raw || !raw.trim()) return [];
    const LANG_MAP: Record<string, string> = {
        'tiếng việt': 'vi', 'viet': 'vi', 'việt': 'vi', 'vietnamese': 'vi',
        'english': 'en', 'anh': 'en', 'tiếng anh': 'en',
        'hàn': 'ko', 'korean': 'ko', 'tiếng hàn': 'ko', 'hàn quốc': 'ko',
        'trung': 'zh', 'chinese': 'zh', 'tiếng trung': 'zh', 'zh': 'zh',
        'japanese': 'ja', 'nhật': 'ja', 'tiếng nhật': 'ja',
        'thai': 'th', 'thái': 'th', 'tiếng thái': 'th',
        'french': 'fr', 'pháp': 'fr',
        'spanish': 'es', 'tây ban nha': 'es',
    };
    return raw.split('\n')
        .map(line => line.trim())
        .filter(line => line.includes('|'))
        .map(line => {
            const pipeIdx = line.indexOf('|');
            const label = line.slice(0, pipeIdx).trim();
            const url = line.slice(pipeIdx + 1).trim();
            if (!label || !url) return null;
            const lang = LANG_MAP[label.toLowerCase()] || label.slice(0, 2).toLowerCase();
            return { lang, label, url };
        })
        .filter(Boolean) as { lang: string; label: string; url: string }[];
}

const AXIOS_OPTIONS = {
    timeout: 15000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json'
    }
};

export async function addExclusiveMovie(data: Record<string, string>) {
    let tmdbId = data.tmdb_id || "";
    const slug = data.slug;
    const type = data.type;
    const linkM3u8 = data.link_m3u8;
    const linkVtt = data.link_vtt;
    const name = data.episode_name || "Full";
    const episodeSlug = data.episode_slug || "tap-full";
    const status = data.status || "draft";
    const langTag = data.lang_tag || "Vietsub Độc Quyền";

    if (!slug || (type === "single" && !linkM3u8)) {
        return { error: "Vui lòng nhập đủ các trường bắt buộc" };
    }

    let movieName = "";
    let originName = "";
    let thumbUrl = "";
    let posterUrl = "";
    let year = new Date().getFullYear();

    // LUÔN ƯU TIÊN KIỂM TRA PHIMAPI TRƯỚC (Vì TMDB hay bị block ở VN)
    let fetchedFromPhimApi = false;
    try {
        const check = await axios.get(`https://phimapi.com/phim/${slug.toLowerCase().trim()}`, AXIOS_OPTIONS);
        const checkData = check.data;
        if (checkData && checkData.status && checkData.movie) {
            fetchedFromPhimApi = true;
            if (!tmdbId.trim() && checkData.movie.tmdb?.id) {
                tmdbId = checkData.movie.tmdb.id;
            }
            movieName = checkData.movie.name || "";
            originName = checkData.movie.origin_name || "";
            thumbUrl = checkData.movie.thumb_url || "";
            posterUrl = checkData.movie.poster_url || "";
            year = checkData.movie.year || new Date().getFullYear();
        }
    } catch (error: any) {
        console.error("Lỗi kiểm tra PhimAPI", error.message);
    }

    // Nếu PhimAPI không có (phim mới ra rạp chưa bị leak) VÀ người dùng có nhập TMDB ID
    if (!fetchedFromPhimApi) {
        if (!tmdbId.trim()) {
            return { error: "Phim chưa có trên PhimAPI. Bắt buộc phải nhập TMDB ID để hệ thống lấy dữ liệu!" };
        }
        
        try {
            const tmdbType = type === "single" ? "movie" : "tv";
            const apiKey = "fb7bb23f03b6994dafc674c074d01761"; 
            const [resVi, resEn] = await Promise.all([
                axios.get(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId.trim()}?api_key=${apiKey}&language=vi-VN`, AXIOS_OPTIONS).catch(() => null),
                axios.get(`https://api.themoviedb.org/3/${tmdbType}/${tmdbId.trim()}?api_key=${apiKey}&language=en-US`, AXIOS_OPTIONS).catch(() => null)
            ]);
            
            const dataVi = resVi ? resVi.data : null;
            const dataEn = resEn ? resEn.data : null;
            
            if (dataVi || dataEn) {
                const dataObj = dataVi || dataEn;
                const enData = dataEn || dataVi;
                
                movieName = dataObj.title || dataObj.name || "";
                originName = enData.title || enData.name || dataObj.original_title || dataObj.original_name || "";
                
                const pPath = enData.poster_path || dataObj.poster_path || "";
                const bPath = enData.backdrop_path || dataObj.backdrop_path || pPath;
                posterUrl = pPath ? `https://image.tmdb.org/t/p/w500${pPath}` : "";
                thumbUrl = bPath ? `https://image.tmdb.org/t/p/w780${bPath}` : "";
                
                const releaseDate = dataObj.release_date || dataObj.first_air_date || "";
                if (releaseDate) {
                    year = parseInt(releaseDate.split('-')[0]);
                }
            } else {
                return { error: "Không tìm thấy phim trên TMDB với ID này!" };
            }
        } catch (e: any) {
            console.error("Lỗi lấy data TMDB", e.message);
            return { error: "Lỗi kết nối đến TMDB (có thể do nhà mạng chặn). Hãy thử lại hoặc dùng slug của PhimAPI." };
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
        const subtitleInput = data.subtitle_tracks;
        const subtitles = parseSubtitleInput(subtitleInput);
        const { error: episodeError } = await supabase.from('exclusive_episodes').insert([
            { movie_id: movie.id, name, slug: episodeSlug, link_m3u8: linkM3u8, link_vtt: linkVtt || null, subtitles: subtitles.length > 0 ? subtitles : [], order: 1 }
        ]);
        if (episodeError) return { error: episodeError.message };
    } else {
        // Nếu là phim bộ, kiểm tra xem có nhập bulk_links ngay từ đầu không
        const bulkLinks = data.bulk_links;
        const bulkVttLinks = data.bulk_vtt_links;
        
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

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function deleteExclusiveMovie(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("exclusive_movies").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function updateExclusiveMovie(id: string, data: Record<string, string>) {
    let tmdbId = data.tmdb_id || "";
    const slug = data.slug;
    const type = data.type;
    const status = data.status;
    const langTag = data.lang_tag || "Vietsub Độc Quyền";

    if (!slug) return { error: "Thiếu trường Slug" };

    if (!tmdbId.trim()) {
        try {
            const check = await axios.get(`https://phimapi.com/phim/${slug.toLowerCase().trim()}`, AXIOS_OPTIONS);
            const checkData = check.data;
            if (!checkData || !checkData.status) {
                return { error: "Phim chưa có trên PhimAPI. Bắt buộc phải nhập TMDB ID!" };
            }
            if (checkData.movie?.tmdb?.id) {
                tmdbId = checkData.movie.tmdb.id;
            }
        } catch (error: any) {
            console.error("Lỗi kiểm tra PhimAPI", error.message);
            return { error: "Lỗi kiểm tra PhimAPI (timeout). Vui lòng nhập TMDB ID." };
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
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function bulkAddExclusiveEpisodes(movieId: string, startEpisode: number, linksText: string, vttLinksText: string, status: string = "published") {
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
                order: epNum,
                status
            });
            epOffset++;
        }
    }

    try {
        const { error } = await supabase.from('exclusive_episodes').insert(episodesToInsert);
        if (error) return { error: `Lỗi thêm hàng loạt: ${error.message}` };
    } catch (e: any) {
        return { error: `Lỗi kết nối cơ sở dữ liệu: ${e.message}. Vui lòng thử lại sau vài giây.` };
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function addEpisode(movieId: string, data: Record<string, string>) {
    const name = data.name;
    const slug = data.slug;
    const linkM3u8 = data.link_m3u8;
    const linkVtt = data.link_vtt;
    const order = parseInt(data.order || "1");
    const subtitleTracks = data.subtitle_tracks;
    const status = data.status || "published";

    if (!name || !slug || !linkM3u8) return { error: "Thiếu trường bắt buộc" };

    try {
        const supabase = await createClient();
        console.log("DB connecting for addEpisode...");
        
        let insertError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            const { error, data: insertedData } = await supabase
                .from("exclusive_episodes")
                .insert({
                    movie_id: movieId,
                    server_name: "Vietsub",
                    name,
                    slug: slug.toLowerCase().trim(),
                    link_m3u8: linkM3u8.trim(),
                    link_vtt: linkVtt ? linkVtt.trim() : null,
                    subtitles: parseSubtitleInput(subtitleTracks),
                    order,
                    status
                }).select();
                
            if (!error) {
                console.log("DB Insert success on attempt", attempt + 1);
                insertError = null;
                break;
            }
            insertError = error;
            console.warn(`DB Insert attempt ${attempt + 1} failed:`, error.message);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000)); // wait 2s before retry
        }

        if (insertError) return { error: typeof insertError.message === 'string' ? insertError.message : "Lỗi không xác định khi lưu vào DB" };
    } catch (e: any) {
        console.error("DB Insert Exception:", e);
        return { error: `Lỗi kết nối DB: ${e.message}. DB đang khởi động, vui lòng thử lại sau vài giây.` };
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function updateEpisode(id: string, data: Record<string, string>) {
    const name = data.name;
    const slug = data.slug;
    const linkM3u8 = data.link_m3u8;
    const linkVtt = data.link_vtt;
    const order = parseInt(data.order || "1");
    const subtitleTracks = data.subtitle_tracks;
    const status = data.status || "published";

    if (!name || !slug || !linkM3u8) return { error: "Thiếu trường bắt buộc" };

    try {
        const supabase = await createClient();
        console.log("DB connecting for updateEpisode...");

        let updateError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            const { error } = await supabase
                .from("exclusive_episodes")
                .update({
                    name,
                    slug: slug.toLowerCase().trim(),
                    link_m3u8: linkM3u8.trim(),
                    link_vtt: linkVtt ? linkVtt.trim() : null,
                    subtitles: parseSubtitleInput(subtitleTracks),
                    order,
                    status
                })
                .eq("id", id);
                
            if (!error) {
                console.log("DB Update success on attempt", attempt + 1);
                updateError = null;
                break;
            }
            updateError = error;
            console.warn(`DB Update attempt ${attempt + 1} failed:`, error.message);
            if (attempt < 2) await new Promise(r => setTimeout(r, 2000));
        }

        if (updateError) return { error: typeof updateError.message === 'string' ? updateError.message : "Lỗi không xác định khi lưu vào DB" };
    } catch (e: any) {
        return { error: `Lỗi kết nối DB: ${e.message}. Vui lòng thử lại sau vài giây.` };
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function deleteEpisode(id: string) {
    const supabase = await createClient();
    const { error } = await supabase.from("exclusive_episodes").delete().eq("id", id);
    if (error) return { error: error.message };
    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
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
