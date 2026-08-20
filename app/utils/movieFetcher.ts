import { fetchWithRedis } from "@/app/lib/fetch-with-redis";
import { createClient } from "@/app/utils/supabase/server";
import { MovieDetailResponse } from "@/app/types/movie";

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

const detailMemoryCache = new Map<string, { data: MovieDetailResponse | null; expires: number }>();

export const getMovieDetail = async (slug: string, isPreview: boolean = false): Promise<MovieDetailResponse | null> => {
    try {
        const cleanSlug = typeof slug === "string" ? decodeURIComponent(slug).trim() : slug;
        const cacheKey = `${cleanSlug}:${isPreview}`;

        if (!isPreview) {
            const cached = detailMemoryCache.get(cacheKey);
            if (cached && Date.now() < cached.expires) {
                return cached.data;
            }
        }

        const supabase = await createClient();
        
        // Fetch song song: Độc quyền từ Supabase, Chi tiết từ Backend nội bộ, và View count
        const [exclusiveRes, phimApiRes, viewRes] = await Promise.allSettled([
            supabase
                .from('exclusive_movies')
                .select(`*, exclusive_episodes (*)`)
                .eq('slug', cleanSlug)
                .single(),
            fetchWithRedis(`${INTERNAL_API_URL}/phim/${cleanSlug}`),
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
                let sName = ep.server_name || exclusiveMovie.lang_tag || "Song Ngữ Độc Quyền";
                
                // Tự động nhận diện nguồn từ URL nếu server_name chưa có hậu tố
                if (!sName.includes(' OP') && !sName.includes(' KK') && !sName.includes(' NC') && !sName.includes(' VS')) {
                    const url = (ep.link_m3u8 || ep.link_embed || '').toLowerCase();
                    if (url.includes('ophim') || url.includes('opstream')) {
                        sName += ' OP';
                    } else if (url.includes('vsmov')) {
                        sName += ' VS';
                    } else if (url.includes('nguonc')) {
                        sName += ' NC';
                    } else if (url.includes('phimimg') || url.includes('kkphim') || url.includes('phimapi')) {
                        sName += ' KK';
                    }
                }

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

            // 2. GỘP SERVER: KKPhim luôn đứng đầu (để tận dụng ArtPlayer với direct m3u8 và skip intro mượt nhất)
            let apiEpisodes: any[] = [];
            if (phimApiData && phimApiData.episodes) {
                apiEpisodes = phimApiData.episodes.map((epServer: any) => {
                    let sName = epServer.server_name;
                    if (!sName.includes(' OP') && !sName.includes(' KK') && !sName.includes(' NC') && !sName.includes(' VS')) {
                        const sampleUrl = (epServer.server_data?.[0]?.link_m3u8 || epServer.server_data?.[0]?.link_embed || '').toLowerCase();
                        if (sampleUrl.includes('ophim') || sampleUrl.includes('opstream')) {
                            sName += ' OP';
                        } else if (sampleUrl.includes('vsmov')) {
                            sName += ' VS';
                        } else if (sampleUrl.includes('nguonc')) {
                            sName += ' NC';
                        } else {
                            sName += ' KK'; // phimapi default is KKPhim
                        }
                    }
                    return { ...epServer, server_name: sName };
                });
            }

            // Phân loại server độc quyền:
            // - Nếu là bản sub_docquyen tự tải lên (không phải nguồn crawler OP, NC, VS) thì có thể ưu tiên trên cùng
            // - Mặc định: KKPhim (apiEpisodes) luôn đứng đầu, sau đó đến các server import khác (OP, NC, VS...)
            const customDocQuyenServers: any[] = [];
            const otherExclusiveServers: any[] = [];

            exclusiveServers.forEach(srv => {
                const sName = srv.server_name;
                const isImportedSource = sName.includes(' OP') || sName.includes(' NC') || sName.includes(' VS') || sName.includes(' KK');
                if (exclusiveMovie.sub_docquyen && !isImportedSource) {
                    customDocQuyenServers.push(srv);
                } else {
                    otherExclusiveServers.push(srv);
                }
            });

            let finalEpisodes = [
                ...customDocQuyenServers,
                ...apiEpisodes,
                ...otherExclusiveServers
            ];

            if (finalEpisodes.length === 0) {
                finalEpisodes = [...exclusiveServers];
            }

            // Tính số tập lớn nhất giữa tất cả các Server (nội bộ và API ngoài)
            let maxExclusiveCount = 0;
            exclusiveServers.forEach(srv => {
                if (srv.server_data && srv.server_data.length > maxExclusiveCount) {
                    maxExclusiveCount = srv.server_data.length;
                }
            });

            let maxApiCount = 0;
            if (phimApiData && phimApiData.episodes) {
                phimApiData.episodes.forEach((srv: any) => {
                    if (srv.server_data && srv.server_data.length > maxApiCount) {
                        maxApiCount = srv.server_data.length;
                    }
                });
            }

            const maxEpisodesCount = Math.max(maxExclusiveCount, maxApiCount);
            
            let calculatedEpisodeCurrent = exclusiveMovie.type === "single" ? "Full" : "";
            if (exclusiveMovie.type !== "single") {
                const originalString = phimApiData?.movie?.episode_current || exclusiveMovie.episode_current || "";
                if (maxEpisodesCount > 0) {
                    const epStr = String(maxEpisodesCount);
                    const lowerOriginal = originalString.toLowerCase();
                    
                    if (lowerOriginal.includes("hoàn tất") || lowerOriginal.includes("trọn bộ") || lowerOriginal.includes("full")) {
                        calculatedEpisodeCurrent = originalString;
                    } else {
                        calculatedEpisodeCurrent = `Tập ${epStr}`;
                    }
                } else {
                    calculatedEpisodeCurrent = originalString || "Tập mới";
                }
            }

            // Tính toán Language Tag từ các nguồn server có sẵn
            const detectedLangs = new Set<string>();
            finalEpisodes.forEach(ep => {
                const sNameLower = (ep.server_name || "").toLowerCase();
                if (sNameLower.includes("vietsub")) detectedLangs.add("Vietsub");
                if (sNameLower.includes("thuyết minh")) detectedLangs.add("Thuyết Minh");
                if (sNameLower.includes("lồng tiếng")) detectedLangs.add("Lồng Tiếng");
                if (sNameLower.includes("song ngữ")) detectedLangs.add("Song Ngữ");
            });

            let calculatedLang = exclusiveMovie.lang || exclusiveMovie.lang_tag || phimApiData?.movie?.lang || "Vietsub";
            if (detectedLangs.size > 0) {
                const order = ["Vietsub", "Thuyết Minh", "Lồng Tiếng", "Song Ngữ"];
                const sortedLangs = Array.from(detectedLangs).sort((a, b) => order.indexOf(a) - order.indexOf(b));
                calculatedLang = sortedLangs.join(" + ");
            }
            
            if (exclusiveMovie.sub_docquyen && !calculatedLang.toLowerCase().includes("độc quyền")) {
                calculatedLang += " Độc Quyền";
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
                        thumb_url: exclusiveMovie.thumb_url || `https://image.tmdb.org/t/p/w780${dataEn.backdrop_path || data.backdrop_path || dataEn.poster_path || data.poster_path}`,
                        poster_url: exclusiveMovie.poster_url || `https://image.tmdb.org/t/p/w500${dataEn.poster_path || data.poster_path}`,
                        is_copyright: true,
                        sub_docquyen: exclusiveMovie.sub_docquyen ?? false,
                        chieurap: false,
                        trailer_url: finalTrailerUrl || exclusiveMovie.trailer_url,
                        time: phimApiData?.movie?.time || (data.runtime ? `${data.runtime} phút` : (exclusiveMovie.time || "Đang cập nhật")),
                        episode_current: calculatedEpisodeCurrent || phimApiData?.movie?.episode_current || exclusiveMovie.episode_current || (exclusiveMovie.type === "single" ? "Full" : `Tập ${publishedEpisodes.length}`),
                        episode_total: phimApiData?.movie?.episode_total || exclusiveMovie.episode_total || (data.number_of_episodes ? data.number_of_episodes.toString() : "1"),
                        quality: phimApiData?.movie?.quality || exclusiveMovie.quality || "HD",
                        lang: calculatedLang,
                        notify: phimApiData?.movie?.notify || "",
                        showtimes: phimApiData?.movie?.showtimes || "",
                        slug: exclusiveMovie.slug,
                        year: data.release_date ? parseInt(data.release_date.split('-')[0]) : data.first_air_date ? parseInt(data.first_air_date.split('-')[0]) : (exclusiveMovie.year || new Date().getFullYear()),
                        view: localViewCount || phimApiData?.movie?.view || exclusiveMovie.view || 1000,
                        actor: (data.credits?.cast?.length > 0 ? data.credits.cast.slice(0, 10).map((c: any) => c.name) : exclusiveMovie.actor) || [],
                        director: (data.credits?.crew?.length > 0 ? data.credits.crew.filter((c: any) => c.job === "Director").map((c: any) => c.name) : exclusiveMovie.director) || [],
                        // Ưu tiên dùng category có sẵn trong DB (từ Ophim/Nguonc có sẵn tiếng Việt), nếu không có mới dùng TMDB
                        category: (exclusiveMovie.category && exclusiveMovie.category.length > 0 ? exclusiveMovie.category : (data.genres?.length > 0 ? data.genres.map((g: any) => ({ name: g.name })) : [])) || [],
                        country: exclusiveMovie.country?.length > 0 ? exclusiveMovie.country : [{ name: "Độc quyền" }],
                        tmdb: { id: exclusiveMovie.tmdb_id, vote_average: phimApiData?.movie?.tmdb?.vote_average || data.vote_average, vote_count: phimApiData?.movie?.tmdb?.vote_count || data.vote_count, type: tmdbType }
                    };

                    const result = {
                        status: true,
                        msg: "OK",
                        movie: movieObj,
                        episodes: finalEpisodes
                    };
                    if (!isPreview) {
                        detailMemoryCache.set(cacheKey, { data: result as any, expires: Date.now() + 60_000 });
                    }
                    return result;
                }
            }

            // KỊCH BẢN PHỤ: NẾU KHÔNG CÓ TMDB ID HOẶC LỖI FETCH TMDB
            // Dùng data của PhimAPI nếu có, nếu không thì dùng 100% data của exclusiveMovie
            const fallbackMovie = phimApiData?.movie || {};
            
            const movieObj = {
                ...fallbackMovie,
                _id: exclusiveMovie.id,
                slug: exclusiveMovie.slug,
                name: fallbackMovie.name || exclusiveMovie.name,
                origin_name: fallbackMovie.origin_name || exclusiveMovie.origin_name,
                content: fallbackMovie.content || exclusiveMovie.content || "",
                type: exclusiveMovie.type,
                thumb_url: fallbackMovie.thumb_url || exclusiveMovie.thumb_url,
                poster_url: fallbackMovie.poster_url || exclusiveMovie.poster_url,
                time: fallbackMovie.time || exclusiveMovie.time || "Đang cập nhật",
                episode_current: calculatedEpisodeCurrent || fallbackMovie.episode_current || exclusiveMovie.episode_current || "Tập mới",
                episode_total: fallbackMovie.episode_total || exclusiveMovie.episode_total || "1",
                quality: fallbackMovie.quality || exclusiveMovie.quality || "HD",
                lang: calculatedLang,
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
            const result = {
                status: true,
                msg: "OK",
                movie: movieObj,
                episodes: finalEpisodes
            };
            if (!isPreview) {
                detailMemoryCache.set(cacheKey, { data: result as any, expires: Date.now() + 60_000 });
            }
            return result;
        }

        // KỊCH BẢN 2: CHỈ CÓ TRÊN PHIMAPI (Không có bản độc quyền)
            if (phimApiData && phimApiData.status) {
                if (localViewCount && phimApiData.movie) {
                    // Ưu tiên lấy view nội bộ, nếu không có thì xài của PhimAPI
                    phimApiData.movie.view = localViewCount;
                }
                if (phimApiData.episodes) {
                    phimApiData.episodes = phimApiData.episodes.map((epServer: any) => {
                        let sName = epServer.server_name;
                        if (!sName.includes(' OP') && !sName.includes(' KK') && !sName.includes(' NC') && !sName.includes(' VS')) {
                            const sampleUrl = (epServer.server_data?.[0]?.link_m3u8 || epServer.server_data?.[0]?.link_embed || '').toLowerCase();
                            if (sampleUrl.includes('ophim') || sampleUrl.includes('opstream')) {
                                sName += ' OP';
                            } else if (sampleUrl.includes('vsmov')) {
                                sName += ' VS';
                            } else if (sampleUrl.includes('nguonc')) {
                                sName += ' NC';
                            } else {
                                sName += ' KK'; // phimapi default is KKPhim
                            }
                        }
                        return { ...epServer, server_name: sName };
                    });
                }
                if (!isPreview) {
                    detailMemoryCache.set(cacheKey, { data: phimApiData, expires: Date.now() + 60_000 });
                }
                return phimApiData;
            }

    } catch (error: any) {
        console.error("[getMovieDetail] API unavailable, returning null:", error);
        return null;
    }

    return null;
};
