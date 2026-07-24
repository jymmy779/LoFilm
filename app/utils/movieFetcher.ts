import { cache } from "react";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
import { createClient } from "@/app/utils/supabase/server";
import { MovieDetailResponse } from "@/app/types/movie";

const API_BASE = "https://phimapi.com";

export const getMovieDetail = cache(async (slug: string, isPreview: boolean = false): Promise<MovieDetailResponse | null> => {
    try {
        const cleanSlug = typeof slug === "string" ? decodeURIComponent(slug).trim() : slug;
        const supabase = await createClient();
        
        // Fetch cả 3 nguồn song song để tối ưu tốc độ: Độc quyền, PhimAPI, và View nội bộ
        const [exclusiveRes, phimApiRes, viewRes] = await Promise.allSettled([
            supabase
                .from('exclusive_movies')
                .select(`*, exclusive_episodes (*)`)
                .eq('slug', cleanSlug)
                .single(),
            fetchWithRedis(`${API_BASE}/phim/${cleanSlug}`),
            supabase
                .from('movie_views')
                .select('view_count')
                .eq('movie_slug', cleanSlug)
                .maybeSingle()
        ]);

        const exclusiveMovie = exclusiveRes.status === 'fulfilled' ? exclusiveRes.value.data : null;
        const phimApiData = phimApiRes.status === 'fulfilled' ? phimApiRes.value : null;
        const localViewCount = viewRes.status === 'fulfilled' && viewRes.value.data ? viewRes.value.data.view_count : 0;

        // KỊCH BẢN 1: TỒN TẠI BẢN ĐỘC QUYỀN (Có thể merge hoặc đứng độc lập)
        if (exclusiveMovie && (exclusiveMovie.status === 'published' || isPreview)) {
            // 1. Sắp xếp và nhóm các tập độc quyền theo server_name
            const publishedEpisodes = isPreview 
                ? exclusiveMovie.exclusive_episodes 
                : exclusiveMovie.exclusive_episodes.filter((ep: any) => ep.status === 'published' || !ep.status);
            const sortedEpisodes = publishedEpisodes.sort((a: any, b: any) => a.order - b.order);

            const serverMap = new Map<string, any[]>();
            for (const ep of sortedEpisodes) {
                const sName = ep.server_name || exclusiveMovie.lang_tag || "Song Ngữ Độc Quyền";
                if (!serverMap.has(sName)) {
                    serverMap.set(sName, []);
                }
                serverMap.get(sName)!.push({
                    name: ep.name,
                    slug: ep.slug,
                    filename: ep.slug,
                    link_embed: ep.link_embed || "",
                    link_m3u8: ep.link_m3u8 || "",
                    link_vtt: ep.link_vtt,
                    subtitles: ep.subtitles || []
                });
            }

            const exclusiveServers = Array.from(serverMap.entries()).map(([sName, dataList]) => ({
                server_name: sName,
                server_data: dataList
            }));

            // 2. GỘP SERVER: Nếu phim tồn tại trên PhimAPI, Độc quyền ưu tiên nằm trên cùng
            let finalEpisodes = [...exclusiveServers];

            if (phimApiData && phimApiData.episodes) {
                finalEpisodes = [...finalEpisodes, ...phimApiData.episodes];
            }

            // 3. Xây dựng Movie Object
            // Nếu có nhập TMDB ID, ưu tiên gọi TMDB để lấy ảnh siêu nét và diễn viên
            if (exclusiveMovie.tmdb_id) {
                const tmdbType = exclusiveMovie.type === "single" ? "movie" : "tv";
                const apiKey = "fb7bb23f03b6994dafc674c074d01761";
                const [resVi, resEn] = await Promise.all([
                    fetch(`https://api.themoviedb.org/3/${tmdbType}/${exclusiveMovie.tmdb_id}?api_key=${apiKey}&language=vi-VN&append_to_response=credits,videos`),
                    fetch(`https://api.themoviedb.org/3/${tmdbType}/${exclusiveMovie.tmdb_id}?api_key=${apiKey}&language=en-US&append_to_response=videos`)
                ]);
                
                if (resVi.ok && resEn.ok) {
                    const data = await resVi.json();
                    const dataEn = await resEn.json();
                    
                    // Tìm trailer từ Youtube
                    const trailerVi = data.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube")?.key;
                    const trailerEn = dataEn.videos?.results?.find((v: any) => v.type === "Trailer" && v.site === "YouTube")?.key;
                    const trailerKey = trailerVi || trailerEn;
                    const finalTrailerUrl = trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : (phimApiData?.movie?.trailer_url || "");
                    
                    const movieObj: any = {
                        _id: exclusiveMovie.id,
                        name: data.title || data.name || exclusiveMovie.name,
                        origin_name: dataEn.title || dataEn.name || data.original_title || data.original_name || exclusiveMovie.origin_name,
                        content: data.overview || dataEn.overview || exclusiveMovie.content,
                        type: exclusiveMovie.type,
                        status: exclusiveMovie.status,
                        thumb_url: `https://image.tmdb.org/t/p/w780${dataEn.backdrop_path || data.backdrop_path || dataEn.poster_path || data.poster_path}`,
                        poster_url: `https://image.tmdb.org/t/p/w500${dataEn.poster_path || data.poster_path}`,
                        is_copyright: true,
                        sub_docquyen: exclusiveMovie.sub_docquyen ?? false,
                        chieurap: false,
                        trailer_url: finalTrailerUrl || exclusiveMovie.trailer_url,
                        time: phimApiData?.movie?.time || (data.runtime ? `${data.runtime} phút` : (exclusiveMovie.time || "Đang cập nhật")),
                        episode_current: phimApiData?.movie?.episode_current || exclusiveMovie.episode_current || (exclusiveMovie.type === "single" ? "Full" : `Tập ${publishedEpisodes.length}`),
                        episode_total: phimApiData?.movie?.episode_total || exclusiveMovie.episode_total || (data.number_of_episodes ? data.number_of_episodes.toString() : "1"),
                        quality: phimApiData?.movie?.quality || exclusiveMovie.quality || "HD",
                        lang: exclusiveMovie.lang || exclusiveMovie.lang_tag || "Vietsub Độc Quyền",
                        notify: phimApiData?.movie?.notify || "",
                        showtimes: phimApiData?.movie?.showtimes || "",
                        slug: exclusiveMovie.slug,
                        year: data.release_date ? parseInt(data.release_date.split('-')[0]) : data.first_air_date ? parseInt(data.first_air_date.split('-')[0]) : (exclusiveMovie.year || new Date().getFullYear()),
                        view: localViewCount || phimApiData?.movie?.view || exclusiveMovie.view || 1000,
                        actor: (data.credits?.cast?.length > 0 ? data.credits.cast.slice(0, 10).map((c: any) => c.name) : exclusiveMovie.actor) || [],
                        director: (data.credits?.crew?.length > 0 ? data.credits.crew.filter((c: any) => c.job === "Director").map((c: any) => c.name) : exclusiveMovie.director) || [],
                        category: (data.genres?.length > 0 ? data.genres.map((g: any) => ({ name: g.name })) : exclusiveMovie.category) || [],
                        country: exclusiveMovie.country?.length > 0 ? exclusiveMovie.country : [{ name: "Độc quyền" }],
                        tmdb: { id: exclusiveMovie.tmdb_id, vote_average: data.vote_average, vote_count: data.vote_count, type: tmdbType }
                    };

                    return {
                        status: true,
                        msg: "OK",
                        movie: movieObj,
                        episodes: finalEpisodes
                    };
                }
            }

            // KỊCH BẢN PHỤ: NẾU KHÔNG CÓ TMDB ID HOẶC LỖI FETCH TMDB
            // Dùng data của PhimAPI nếu có, nếu không thì dùng 100% data của exclusiveMovie
            let fallbackMovie = phimApiData?.movie || {};
            
            const movieObj = {
                ...fallbackMovie,
                _id: exclusiveMovie.id,
                name: fallbackMovie.name || exclusiveMovie.name,
                origin_name: fallbackMovie.origin_name || exclusiveMovie.origin_name,
                content: fallbackMovie.content || exclusiveMovie.content || "",
                type: exclusiveMovie.type,
                thumb_url: fallbackMovie.thumb_url || exclusiveMovie.thumb_url,
                poster_url: fallbackMovie.poster_url || exclusiveMovie.poster_url,
                time: fallbackMovie.time || exclusiveMovie.time || "Đang cập nhật",
                episode_current: fallbackMovie.episode_current || exclusiveMovie.episode_current || "Tập mới",
                episode_total: fallbackMovie.episode_total || exclusiveMovie.episode_total || "1",
                quality: fallbackMovie.quality || exclusiveMovie.quality || "HD",
                lang: exclusiveMovie.lang || exclusiveMovie.lang_tag || fallbackMovie.lang || "Vietsub Độc Quyền",
                year: fallbackMovie.year || exclusiveMovie.year || new Date().getFullYear(),
                actor: fallbackMovie.actor?.length > 0 ? fallbackMovie.actor : (exclusiveMovie.actor || []),
                director: fallbackMovie.director?.length > 0 ? fallbackMovie.director : (exclusiveMovie.director || []),
                category: fallbackMovie.category?.length > 0 ? fallbackMovie.category : (exclusiveMovie.category || []),
                country: fallbackMovie.country?.length > 0 ? fallbackMovie.country : (exclusiveMovie.country || []),
                trailer_url: fallbackMovie.trailer_url || exclusiveMovie.trailer_url || "",
                view: localViewCount || fallbackMovie.view || exclusiveMovie.view || 1000,
                sub_docquyen: exclusiveMovie.sub_docquyen ?? false,
                is_copyright: true,
            };
            return {
                status: true,
                msg: "OK",
                movie: movieObj,
                episodes: finalEpisodes
            };
        }

        // KỊCH BẢN 2: CHỈ CÓ TRÊN PHIMAPI (Không có bản độc quyền)
        if (phimApiData && phimApiData.status) {
            if (localViewCount && phimApiData.movie) {
                // Ưu tiên lấy view nội bộ, nếu không có thì xài của PhimAPI
                phimApiData.movie.view = localViewCount;
            }
            return phimApiData;
        }

    } catch (error) {
        console.error("Error in getMovieDetail:", error);
    }
    
    return null;
});
