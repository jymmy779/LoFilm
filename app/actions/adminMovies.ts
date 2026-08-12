"use server";
import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import axios from "axios";
import { addStarredMovie } from "./adminStarred";

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
    const linkEmbed = data.link_embed || "";
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

    const subDocquyen = data.sub_docquyen === 'true' || data.sub_docquyen === 'on' || (data.sub_docquyen as unknown) === true;

    // 1. Insert movie
    const { data: movie, error: insertError } = await supabase.from('exclusive_movies').insert([
        { 
            tmdb_id: tmdbId.trim() || "",
            slug: slug.toLowerCase().trim(), 
            type, 
            status, 
            lang_tag: langTag,
            sub_docquyen: subDocquyen,
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
            { movie_id: movie.id, name, slug: episodeSlug, link_m3u8: linkM3u8, link_vtt: linkVtt || null, link_embed: linkEmbed || null, subtitles: subtitles.length > 0 ? subtitles : [], order: 1 }
        ]);
        if (episodeError) return { error: episodeError.message };
    } else {
        // Nếu là phim bộ, kiểm tra xem có nhập bulk_links ngay từ đầu không
        const bulkLinks = data.bulk_links;
        const bulkVttLinks = data.bulk_vtt_links;
        
        if (bulkLinks && bulkLinks.trim().length > 0) {
            const rawM3u8 = bulkLinks.split('\n').map(l => l.trim());
            const rawVtt = bulkVttLinks ? bulkVttLinks.split('\n').map(l => l.trim()) : [];
            const rawEmbed = data.bulk_embed_links ? data.bulk_embed_links.split('\n').map(l => l.trim()) : [];
            
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
                        link_embed: (rawEmbed[i] && rawEmbed[i].length > 0) ? rawEmbed[i] : null,
                        order: epIndex + 1
                    });
                    epIndex++;
                }
            }
            
            if (episodeInserts.length > 0) {
                const { error: bulkError } = await supabase.from('exclusive_episodes').insert(episodeInserts);
                if (bulkError) return { error: bulkError.message };
            }
        } else if (linkM3u8 || linkEmbed) {
            // Nếu không nhập bulk list nhưng có nhập link M3U8 đơn -> Tự động thêm Tập 01
            const { error: epError } = await supabase.from('exclusive_episodes').insert([
                { movie_id: movie.id, name: "Tập 01", slug: "tap-01", link_m3u8: linkM3u8, link_vtt: linkVtt, link_embed: linkEmbed || null, order: 1 }
            ]);
            if (epError) return { error: epError.message };
        }
    }

    if (data.is_starred === 'on' || data.is_starred === 'true') {
        const expiresDays = data.expires_in_days ? parseInt(data.expires_in_days) : null;
        let finalThumb = thumbUrl;
        let finalPoster = posterUrl;
        
        // Nếu ảnh lấy từ PhimAPI (chỉ có path) thì thêm host
        if (finalThumb && !finalThumb.startsWith('http')) finalThumb = `https://phimimg.com/${finalThumb}`;
        if (finalPoster && !finalPoster.startsWith('http')) finalPoster = `https://phimimg.com/${finalPoster}`;
        
        await addStarredMovie(
            movie.slug,
            movieName,
            finalThumb,
            finalPoster,
            expiresDays
        );
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
            if (checkData?.status && checkData.movie?.tmdb?.id) {
                tmdbId = checkData.movie.tmdb.id;
            }
        } catch (error: any) {
            console.warn("Không thể lấy TMDB ID từ PhimAPI:", error.message);
            // Ignore error and let tmdbId remain empty
        }
    }

    const subDocquyen = data.sub_docquyen === 'true' || data.sub_docquyen === 'on' || (data.sub_docquyen as unknown) === true;

    const supabase = await createClient();
    const { error } = await supabase
        .from("exclusive_movies")
        .update({
            slug: slug.toLowerCase().trim(),
            tmdb_id: tmdbId.trim(),
            type: type,
            status: status,
            lang_tag: langTag,
            sub_docquyen: subDocquyen
        })
        .eq("id", id);

    if (error) return { error: `Lỗi cập nhật phim: ${error.message}` };

    if (data.is_starred === 'on' || data.is_starred === 'true') {
        const { data: movie } = await supabase.from("exclusive_movies").select("*").eq("id", id).single();
        if (movie) {
            const expiresDays = data.expires_in_days ? parseInt(data.expires_in_days) : null;
            let finalThumb = movie.thumb_url;
            let finalPoster = movie.poster_url;
            
            if (finalThumb && !finalThumb.startsWith('http')) finalThumb = `https://phimimg.com/${finalThumb}`;
            if (finalPoster && !finalPoster.startsWith('http')) finalPoster = `https://phimimg.com/${finalPoster}`;
            
            await addStarredMovie(
                movie.slug,
                movie.name,
                finalThumb,
                finalPoster,
                expiresDays
            );
        }
    }

    revalidatePath("/admin", "layout");
    revalidatePath("/", "layout");
    return { success: true };
}

export async function bulkAddExclusiveEpisodes(movieId: string, startEpisode: number, linksText: string, vttLinksText: string, embedLinksText: string = "", status: string = "published") {
    if (!linksText.trim() && !embedLinksText.trim()) return { error: "Danh sách link trống" };
    
    const rawM3u8 = linksText.split('\n').map(l => l.trim());
    const rawVtt = vttLinksText ? vttLinksText.split('\n').map(l => l.trim()) : [];
    const rawEmbed = embedLinksText ? embedLinksText.split('\n').map(l => l.trim()) : [];
    
    let validCount = 0;
    const maxLen = Math.max(rawM3u8.length, rawEmbed.length);
    for (let i = 0; i < maxLen; i++) {
        if ((rawM3u8[i] && rawM3u8[i].length > 0) || (rawEmbed[i] && rawEmbed[i].length > 0)) validCount++;
    }
    if (validCount === 0) return { error: "Không tìm thấy link hợp lệ" };

    const supabase = await createClient();
    
    const episodesToInsert = [];
    let epOffset = 0;
    
    for (let i = 0; i < maxLen; i++) {
        if ((rawM3u8[i] && rawM3u8[i].length > 0) || (rawEmbed[i] && rawEmbed[i].length > 0)) {
            const epNum = startEpisode + epOffset;
            const epNumStr = String(epNum).padStart(2, '0');
            episodesToInsert.push({
                movie_id: movieId,
                server_name: "Vietsub",
                name: `Tập ${epNumStr}`,
                slug: `tap-${epNumStr}`,
                link_m3u8: rawM3u8[i] || "",
                link_vtt: (rawVtt[i] && rawVtt[i].length > 0) ? rawVtt[i] : null,
                link_embed: (rawEmbed[i] && rawEmbed[i].length > 0) ? rawEmbed[i] : null,
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
    const linkEmbed = data.link_embed;
    const order = parseInt(data.order || "1");
    const subtitleTracks = data.subtitle_tracks;
    const status = data.status || "published";

    if (!name || !slug || (!linkM3u8 && !linkEmbed)) return { error: "Thiếu trường bắt buộc" };

    try {
        const supabase = await createClient();
        
        let insertError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            const { error, data: insertedData } = await supabase
                .from("exclusive_episodes")
                .insert({
                    movie_id: movieId,
                    server_name: "Vietsub",
                    name,
                    slug: slug.toLowerCase().trim(),
                    link_m3u8: linkM3u8 ? linkM3u8.trim() : "",
                    link_vtt: linkVtt ? linkVtt.trim() : null,
                    link_embed: linkEmbed ? linkEmbed.trim() : null,
                    subtitles: parseSubtitleInput(subtitleTracks),
                    order,
                    status
                }).select();
                
            if (!error) {
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
    const linkEmbed = data.link_embed;
    const order = parseInt(data.order || "1");
    const subtitleTracks = data.subtitle_tracks;
    const status = data.status || "published";

    if (!name || !slug || (!linkM3u8 && !linkEmbed)) return { error: "Thiếu trường bắt buộc" };

    try {
        const supabase = await createClient();

        let updateError = null;
        for (let attempt = 0; attempt < 3; attempt++) {
            const { error } = await supabase
                .from("exclusive_episodes")
                .update({
                    name,
                    slug: slug.toLowerCase().trim(),
                    link_m3u8: linkM3u8 ? linkM3u8.trim() : "",
                    link_vtt: linkVtt ? linkVtt.trim() : null,
                    link_embed: linkEmbed ? linkEmbed.trim() : null,
                    subtitles: parseSubtitleInput(subtitleTracks),
                    order,
                    status
                })
                .eq("id", id);
                
            if (!error) {
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

export async function importMovieFromApi(apiUrl: string, data: Record<string, any>) {
    const isStarred = data.is_starred === 'on' || data.is_starred === true;
    const subDocquyen = data.sub_docquyen === 'on' || data.sub_docquyen === 'true' || data.sub_docquyen === true;
    const expiresDays = data.expires_in_days ? parseInt(data.expires_in_days) : null;
    const status = data.status || "published";

    if (!apiUrl) {
        return { error: "Vui lòng nhập API URL" };
    }

    try {
        // Fetch data from API
        const res = await axios.get(apiUrl, AXIOS_OPTIONS);
        const resData = res.data;

        if (!resData || !resData.status) {
            return { error: "Dữ liệu API không hợp lệ hoặc lỗi kết nối" };
        }

        const movieData = resData.data?.item || resData.movie;
        const episodesData = resData.data?.item?.episodes || resData.movie?.episodes || resData.episodes || [];

        if (!movieData) {
            return { error: "Không tìm thấy thông tin phim trong phản hồi API" };
        }

        let type = movieData.type === 'series' || movieData.type === 'hoathinh' || movieData.type === 'tvshows' ? 'series' : 'single';
        let year = movieData.year || new Date().getFullYear();
        
        if (movieData.category && typeof movieData.category === 'object' && !Array.isArray(movieData.category)) {
            Object.values(movieData.category).forEach((group: any) => {
                if (group.group?.name === "Định dạng" && group.list) {
                    if (group.list.some((item: any) => item.name.toLowerCase().includes("bộ"))) {
                        type = 'series';
                    } else {
                        type = 'single';
                    }
                } else if (group.group?.name === "Năm" && group.list) {
                    const parsedYear = parseInt(group.list[0]?.name);
                    if (!isNaN(parsedYear)) year = parsedYear;
                }
            });
        }

        const tmdbId = data.tmdb_id || movieData.tmdb?.id || "";

        const supabase = await createClient();

        const domain = (
            resData.data?.APP_DOMAIN_CDN_IMAGE || 
            resData.APP_DOMAIN_CDN_IMAGE || 
            resData.data?.pathImage || 
            resData.pathImage || 
            "https://phimimg.com"
        ).replace(/\/$/, "");
        const isOPhim = domain.includes("ophim") || (resData.data?.seoOnPage?.og_url?.includes("ophim") ?? false) || (resData.data?.seoOnPage?.seoSchema?.url?.includes("ophim") ?? false);
        const isVsMov = domain.includes("vsmov") || apiUrl.includes("vsmov");
        const isKkPhim = apiUrl.includes("phimapi.com") || apiUrl.includes("kkphim");

        let sourceSuffix = "";
        if (isOPhim || apiUrl.includes("ophim")) {
            sourceSuffix = " OP";
        } else if (apiUrl.includes("vsmov")) {
            sourceSuffix = " VS";
        } else if (apiUrl.includes("nguonc")) {
            sourceSuffix = " NC";
        } else if (apiUrl.includes("phimapi.com") || apiUrl.includes("kkphim")) {
            sourceSuffix = " KK";
        }

        const buildUrl = (path: string) => {
            if (!path) return "";
            let fullUrl = path;
            if (!path.startsWith("http://") && !path.startsWith("https://")) {
                const cleanPath = path.startsWith("/") ? path.slice(1) : path;
                if (cleanPath.startsWith("uploads/")) {
                    fullUrl = `${domain}/${cleanPath}`;
                } else {
                    fullUrl = `${domain}/uploads/movies/${cleanPath}`;
                }
            }
            if (fullUrl.includes("wsrv.nl")) return fullUrl;
            return `https://wsrv.nl/?url=${encodeURIComponent(fullUrl)}&output=webp`;
        };

        const rawPoster = movieData.poster_url || "";
        const rawThumb = movieData.thumb_url || "";

        let parsedPosterUrl = buildUrl(rawPoster || rawThumb);
        let parsedThumbUrl = buildUrl(rawThumb || rawPoster);

        if (isOPhim || isVsMov) {
            // OPhim / VSMov bị đảo ngược thumb_url (ảnh đứng poster) và poster_url (ảnh nằm thumb)
            parsedPosterUrl = buildUrl(rawThumb || rawPoster);
            parsedThumbUrl = buildUrl(rawPoster || rawThumb);
        }

        let parsedCategory = movieData.category || [];
        let parsedCountry = movieData.country || [];
        
        // Handle NguonC's category object structure
        if (movieData.category && typeof movieData.category === 'object' && !Array.isArray(movieData.category)) {
            const catList: any[] = [];
            const countryList: any[] = [];
            Object.values(movieData.category).forEach((group: any) => {
                if (group.group?.name === "Thể loại" && group.list) {
                    catList.push(...group.list.map((c: any) => ({ name: c.name, slug: c.slug || c.name })));
                } else if (group.group?.name === "Quốc gia" && group.list) {
                    countryList.push(...group.list.map((c: any) => ({ name: c.name, slug: c.slug || c.name })));
                }
            });
            parsedCategory = catList;
            if (countryList.length > 0) parsedCountry = countryList;
        }

        // 1. Insert/Update movie
        let movie: any = null;
        let insertError: any = null;

        const { data: existingMovie } = await supabase.from('exclusive_movies').select('*').eq('slug', movieData.slug).single();

        if (existingMovie) {
            // Cập nhật movie hiện tại:
            // Chỉ ghi đè metadata nếu nguồn hiện tại là KKPhim (ưu tiên metadata KKPhim).
            // Nếu không phải KKPhim, ta KHÔNG ghi đè metadata cũ (để bảo toàn data của KKPhim hoặc data đã lưu).
            let updatePayload: any = {};

            if (isKkPhim) {
                updatePayload = {
                    episode_current: movieData.episode_current || movieData.current_episode || "",
                    episode_total: String(movieData.episode_total || movieData.total_episodes || ""),
                    name: movieData.name,
                    origin_name: movieData.origin_name || movieData.original_name || movieData.name,
                    content: movieData.content || movieData.description || "",
                    time: movieData.time || "",
                    actor: typeof movieData.actor === 'string' ? movieData.actor.split(',').map((s: string) => s.trim()) : (movieData.actor || movieData.casts?.split(',').map((s: string) => s.trim()) || []),
                    director: typeof movieData.director === 'string' ? movieData.director.split(',').map((s: string) => s.trim()) : (movieData.director || []),
                    category: parsedCategory,
                    country: parsedCountry,
                    trailer_url: movieData.trailer_url || ""
                };
            }

            // Quality ranking logic (Lấy chất lượng cao nhất)
            const qualityRanks: Record<string, number> = {
                "CAM": 1,
                "SD": 2,
                "HD": 3,
                "FHD": 4,
                "2K": 5,
                "4K": 6
            };
            const getRank = (q: string) => qualityRanks[q?.toUpperCase()] || 0;
            const newQuality = movieData.quality || "";
            const oldQuality = existingMovie.quality || "";
            
            if (getRank(newQuality) > getRank(oldQuality) || (!oldQuality && newQuality)) {
                updatePayload.quality = newQuality;
            }

            if (Object.keys(updatePayload).length > 0) {
                const { data, error } = await supabase.from('exclusive_movies').update(updatePayload).eq('slug', movieData.slug).select().single();
                movie = data;
                insertError = error;
            } else {
                movie = existingMovie;
            }
        } else {
            const { data, error } = await supabase.from('exclusive_movies').insert([
                { 
                    tmdb_id: tmdbId,
                    slug: movieData.slug, 
                    type, 
                    status, 
                    lang_tag: movieData.lang || "Vietsub",
                    sub_docquyen: subDocquyen,
                    name: movieData.name,
                    origin_name: movieData.origin_name || movieData.original_name || movieData.name,
                    thumb_url: parsedThumbUrl,
                    poster_url: parsedPosterUrl,
                    year: year,
                    content: movieData.content || movieData.description || "",
                    time: movieData.time || "",
                    episode_current: movieData.episode_current || movieData.current_episode || "",
                    episode_total: String(movieData.episode_total || movieData.total_episodes || ""),
                    quality: movieData.quality || "",
                    view: movieData.view || 0,
                    actor: typeof movieData.actor === 'string' ? movieData.actor.split(',').map((s: string) => s.trim()) : (movieData.actor || movieData.casts?.split(',').map((s: string) => s.trim()) || []),
                    director: typeof movieData.director === 'string' ? movieData.director.split(',').map((s: string) => s.trim()) : (movieData.director || []),
                    category: parsedCategory,
                    country: parsedCountry,
                    trailer_url: movieData.trailer_url || ""
                }
            ]).select().single();
            movie = data;
            insertError = error;
        }

        if (insertError || !movie) {
            return { error: insertError?.message || "Lỗi khi lưu phim vào CSDL" };
        }

        // 2. Insert Episodes
        const episodeInserts = [];
        const newServerNames = new Set<string>();
        for (const server of episodesData) {
            const serverData = server.server_data || server.items || [];
            const baseServerName = server.server_name || "Vietsub #1";
            const finalServerName = baseServerName.endsWith(sourceSuffix) ? baseServerName : `${baseServerName}${sourceSuffix}`;
            newServerNames.add(finalServerName);
            
            let order = 1;
            for (const ep of serverData) {
                episodeInserts.push({
                    movie_id: movie.id,
                    server_name: finalServerName,
                    name: ep.name,
                    slug: ep.slug,
                    link_m3u8: apiUrl.includes("nguonc") ? "" : (ep.link_m3u8 || ep.m3u8 || ""),
                    link_embed: ep.link_embed || ep.embed || null,
                    order: order++,
                    status: "published"
                });
            }
        }

        if (episodeInserts.length > 0) {
            // Xóa các tập cũ của cùng nguồn (nếu update), giữ lại các nguồn khác
            const serverNamesArray = Array.from(newServerNames);
            await supabase.from("exclusive_episodes")
                .delete()
                .eq("movie_id", movie.id)
                .in("server_name", serverNamesArray);
                
            const { error: bulkError } = await supabase.from('exclusive_episodes').insert(episodeInserts);
            if (bulkError) {
                console.error("Lỗi insert episodes", bulkError);
                return { error: "Lỗi lưu danh sách tập: " + bulkError.message };
            }

            // Sync lại lang_tag từ TẤT CẢ các tập hiện có của phim này (để Admin UI và List UI hiển thị đúng)
            const { data: allEpisodes } = await supabase.from('exclusive_episodes').select('server_name').eq('movie_id', movie.id);
            const detectedLangs = new Set<string>();
            allEpisodes?.forEach(ep => {
                const sNameLower = (ep.server_name || "").toLowerCase();
                if (sNameLower.includes("vietsub")) detectedLangs.add("Vietsub");
                if (sNameLower.includes("thuyết minh")) detectedLangs.add("Thuyết Minh");
                if (sNameLower.includes("lồng tiếng")) detectedLangs.add("Lồng Tiếng");
                if (sNameLower.includes("song ngữ")) detectedLangs.add("Song Ngữ");
            });

            if (detectedLangs.size > 0) {
                const order = ["Vietsub", "Thuyết Minh", "Lồng Tiếng", "Song Ngữ"];
                const sortedLangs = Array.from(detectedLangs).sort((a, b) => order.indexOf(a) - order.indexOf(b));
                let calculatedLang = sortedLangs.join(" + ");
                if (movie.sub_docquyen) {
                    calculatedLang += " Độc Quyền";
                }
                await supabase.from('exclusive_movies').update({ lang_tag: calculatedLang }).eq('id', movie.id);
                movie.lang_tag = calculatedLang;
            }
        }

        if (isStarred) {
            let finalThumb = movieData.thumb_url;
            let finalPoster = movieData.poster_url;
            
            if (finalThumb && !finalThumb.startsWith('http')) finalThumb = `https://phimimg.com/${finalThumb}`;
            if (finalPoster && !finalPoster.startsWith('http')) finalPoster = `https://phimimg.com/${finalPoster}`;
            
            await addStarredMovie(
                movie.slug,
                movie.name,
                finalThumb,
                finalPoster,
                expiresDays
            );
        }

        revalidatePath("/admin", "layout");
        revalidatePath("/", "layout");
        return { success: true };

    } catch (e: any) {
        console.error("Lỗi Import API", e);
        return { error: `Lỗi kết nối hoặc xử lý dữ liệu: ${e.message}` };
    }
}
