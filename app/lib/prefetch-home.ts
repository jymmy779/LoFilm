import type { Movie } from "@/app/types/movie";
import type { HomeCategory, HomePrefetch } from "@/app/types/home-prefetch";
import {
    filterDuplicateMovies,
    sortAndSlicePosterRowMovies,
} from "@/app/utils/movieUtils";

import { fetchWithRedis, redis } from "@/app/lib/fetch-with-redis";
import { createClient } from "@supabase/supabase-js";

// Client Supabase an toàn cho Background jobs (không dính tới cookies Next.js)
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        auth: { persistSession: false },
        global: {
            fetch: (url, options) => fetch(url, { ...options, cache: 'no-store' })
        }
    }
);

const REVALIDATE_SEC = 60; // Đồng bộ 60 giây toàn hệ thống

async function fetchPhimJson(url: string): Promise<unknown> {
    return await fetchWithRedis(url, { revalidate: REVALIDATE_SEC });
}

function parseV1Items(payload: unknown): Movie[] {
    if (!payload || typeof payload !== "object") return [];
    const p = payload as { status?: unknown; data?: { items?: Movie[] } };
    const ok = p.status === "success" || p.status === true;
    if (!ok || !p.data?.items || !Array.isArray(p.data.items)) return [];
    return p.data.items;
}

function parseV3HeroItems(payload: unknown): Movie[] {
    if (!payload || typeof payload !== "object") return [];
    const items = (payload as { items?: Movie[] }).items;
    return Array.isArray(items) ? items : [];
}

function parseCategories(payload: unknown): HomeCategory[] {
    let list: HomeCategory[] = [];
    if (Array.isArray(payload)) {
        list = payload;
    } else {
        const p = payload as { data?: { items?: HomeCategory[] } };
        if (p?.data?.items && Array.isArray(p.data.items)) {
            list = p.data.items;
        }
    }
    return [...list].sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

function mapFeatured(items: Movie[]): Movie[] {
    return filterDuplicateMovies(items).slice(0, 10);
}

function mapTop(items: Movie[]): Movie[] {
    return filterDuplicateMovies(items).slice(0, 30);
}

function mapMovieRow(items: Movie[]): Movie[] {
    return sortAndSlicePosterRowMovies(items);
}

/**
 * Lấy danh sách phim cho Featured Sliders
 */
async function fetchFeatured(url: string, limit: number = 10): Promise<Movie[]> {
    try {
        const res = await fetchPhimJson(url);
        const items = parseV1Items(res);
        if (items.length === 0) return [];

        return filterDuplicateMovies(items).slice(0, limit);
    } catch (error) {
        console.error(`Lỗi prefetch featured slider từ ${url}:`, error);
        return [];
    }
}

/**
 * Lấy danh sách phim cho Top Rows
 */
async function fetchTop(url: string, limit: number = 30): Promise<Movie[]> {
    try {
        const res = await fetchPhimJson(url);
        const items = parseV1Items(res);
        if (items.length === 0) return [];

        return filterDuplicateMovies(items).slice(0, limit);
    } catch (error) {
        console.error(`Lỗi prefetch top row từ ${url}:`, error);
        return [];
    }
}

async function mapHero(payload: unknown): Promise<Movie[]> {
    const raw = parseV3HeroItems(payload);
    return filterDuplicateMovies(raw).slice(0, 8);
}

/**
 * Lấy danh sách phim đánh dấu sao cho Hero Slider
 */
async function getStarredMoviesForHero(): Promise<Movie[]> {
    try {
        const { data } = await supabase
            .from('starred_movies')
            .select('*')
            .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
            .order('priority', { ascending: true })
            .order('created_at', { ascending: false })
            .limit(8);

        if (!data || data.length === 0) return [];

        return await Promise.all(data.map(async (m: any) => {
            let movieObj: any = {
                _id: m.id,
                name: m.name,
                origin_name: m.name, // Dự phòng
                slug: m.slug,
                type: "single", // Mặc định, sẽ bị ghi đè khi fetch
                thumb_url: m.thumb_url,
                poster_url: m.poster_url,
                year: new Date().getFullYear(),
                is_copyright: false,
                sub_docquyen: false,
                lang: "Vietsub",
                episode_current: "Tập mới",
                quality: "FHD",
            };

            // Fetch thông tin chi tiết từ PhimAPI
            try {
                const phimApiRes = await fetch(`https://phimapi.com/phim/${m.slug}`, { signal: AbortSignal.timeout(5000) });
                if (phimApiRes.ok) {
                    const phimApiData = await phimApiRes.json();
                    const detail = phimApiData?.movie;
                    if (detail) {
                        return {
                            ...movieObj,
                            ...detail, // Ghi đè bằng data chuẩn
                            thumb_url: m.thumb_url, // Vẫn giữ ảnh do mình lưu lúc star (nếu muốn) hoặc dùng ảnh API
                            poster_url: m.poster_url,
                        } as Movie;
                    }
                }
            } catch {
                // Ignore
            }

            return movieObj as Movie;
        }));
    } catch (e) {
        console.error("Lỗi lấy phim đánh dấu sao cho Hero:", e);
        return [];
    }
}

/**
 * Lấy danh sách phim Độc quyền mới nhất cho Hero Slider
 */
async function getExclusiveMoviesForHero(): Promise<Movie[]> {
    try {
        // Chỉ lấy phim đăng trong vòng 3 ngày gần nhất
        const threeDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000);

        const { data } = await supabase
            .from('exclusive_movies')
            .select('*')
            .eq('status', 'published')
            .gte('created_at', threeDaysAgo.toISOString())
            .order('created_at', { ascending: false })
            .limit(3);

        if (!data || data.length === 0) return [];

        return await Promise.all(data.map(async (m: any) => {
            let movieObj: any = {
                _id: m.id,
                name: m.name,
                origin_name: m.origin_name,
                slug: m.slug,
                type: m.type,
                thumb_url: m.thumb_url,
                poster_url: m.poster_url,
                year: m.year || new Date().getFullYear(),
                is_copyright: true,
                sub_docquyen: true,
                lang: m.lang_tag || "Vietsub Độc Quyền",
                episode_current: m.type === "single" ? "Full" : "Tập mới",
                quality: "FHD",
            };

            // Ưu tiên 1: Lấy data từ PhimAPI (api thứ 3) — tránh bị nhà mạng VN block TMDB
            try {
                const phimApiRes = await fetch(`https://phimapi.com/phim/${m.slug}`, { signal: AbortSignal.timeout(5000) });
                if (phimApiRes.ok) {
                    const phimApiData = await phimApiRes.json();
                    const detail = phimApiData?.movie;
                    if (detail) {
                        movieObj.content = detail.content || "";
                        // Dùng ảnh W1280 cho Hero Slider nếu có
                        const thumbPath = detail.thumb_url || "";
                        const posterPath = detail.poster_url || "";
                        if (thumbPath) movieObj.thumb_url = thumbPath.startsWith("http") ? thumbPath : `https://phimimg.com/${thumbPath}`;
                        if (posterPath) movieObj.poster_url = posterPath.startsWith("http") ? posterPath : `https://phimimg.com/${posterPath}`;
                        movieObj.category = detail.category || [];
                        movieObj.actor = detail.actor || [];
                        movieObj.director = detail.director || [];
                        movieObj.tmdb = detail.tmdb || {};
                        if (detail.time) movieObj.time = detail.time;
                        if (detail.episode_total) movieObj.episode_total = detail.episode_total;
                        return movieObj as Movie; // Đã có đủ data, không cần fetch TMDB
                    }
                }
            } catch {
                // PhimAPI không có hoặc timeout → fallthrough sang TMDB
            }

            // Ưu tiên 2: Fallback sang TMDB nếu phim chưa có trên PhimAPI
            if (m.tmdb_id) {
                try {
                    const apiKey = "fb7bb23f03b6994dafc674c074d01761";
                    const tmdbType = m.type === "single" ? "movie" : "tv";
                    const resVi = await fetch(`https://api.themoviedb.org/3/${tmdbType}/${m.tmdb_id}?api_key=${apiKey}&language=vi-VN&append_to_response=credits`, { signal: AbortSignal.timeout(5000) });

                    if (resVi.ok) {
                        const tmdb = await resVi.json();
                        movieObj.content = tmdb.overview || "";
                        movieObj.thumb_url = `https://image.tmdb.org/t/p/w1280${tmdb.backdrop_path || tmdb.poster_path}`;
                        movieObj.poster_url = `https://image.tmdb.org/t/p/w500${tmdb.poster_path}`;
                        movieObj.category = tmdb.genres?.map((g: any) => ({ name: g.name })) || [];
                        movieObj.actor = tmdb.credits?.cast?.slice(0, 5).map((c: any) => c.name) || [];
                        movieObj.director = tmdb.credits?.crew?.filter((c: any) => c.job === "Director").map((c: any) => c.name) || [];
                        movieObj.tmdb = { id: m.tmdb_id, vote_average: tmdb.vote_average, vote_count: tmdb.vote_count, type: tmdbType };
                        if (tmdb.runtime) movieObj.time = `${tmdb.runtime} phút`;
                        if (tmdb.number_of_episodes) movieObj.episode_total = tmdb.number_of_episodes.toString();
                    }
                } catch (e: any) {
                    if (e.code !== 'ENOTFOUND' && e.code !== 'ECONNRESET' && e.name !== 'TimeoutError') {
                        console.error(`[TMDB] Lỗi lấy thông tin phim độc quyền ${m.slug}:`, e.message);
                    }
                }
            }

            return movieObj as Movie;
        }));
    } catch (e) {
        console.error("Lỗi lấy phim độc quyền cho Hero:", e);
        return [];
    }
}


const URLS = {
    hero: "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?limit=60",
    categories: "https://phimapi.com/the-loai",
    movieRowHan: "https://phimapi.com/v1/api/quoc-gia/han-quoc?limit=60",
    movieRowTrung: "https://phimapi.com/v1/api/quoc-gia/trung-quoc?limit=60",
    movieRowAuMy: "https://phimapi.com/v1/api/quoc-gia/au-my?limit=60",
    featuredTv: "https://phimapi.com/v1/api/danh-sach/tv-shows?limit=60",
    posterChieuRap: "https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=60",
    posterPhimBo: "https://phimapi.com/v1/api/danh-sach/phim-bo?limit=60",
    topPhimLe: "https://phimapi.com/v1/api/danh-sach/phim-le?limit=60",
    topPhimBo: "https://phimapi.com/v1/api/danh-sach/phim-bo?limit=60",
    featuredAnime: "https://phimapi.com/v1/api/danh-sach/hoat-hinh?country=nhat-ban&limit=60",
    posterKinhDi: "https://phimapi.com/v1/api/the-loai/kinh-di?limit=60",
    posterHoatHinh: "https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=60",
    phimNgan: "https://phimapi.com/v1/api/the-loai/phim-ngan?limit=60",
} as const;

async function mapNominated(): Promise<Movie[]> {
    const NOMINATED_KEY = "home:nominated";
    const NOMINATED_TTL = 86400; // 24 giờ

    if (redis) {
        try {
            const cached = await redis.get(NOMINATED_KEY);
            if (cached) {
                return JSON.parse(cached);
            }
        } catch (err) {
            console.error("[Redis Nominated Cache Error]", err);
        }
    }

    // Lấy cấu hình từ DB
    const { data: configData, error: configError } = await supabase.from('site_settings').select('value').eq('key', 'editor_choices').maybeSingle();

    if (configError) {
        console.error("[mapNominated] Lỗi truy vấn DB site_settings:", configError);
    }

    let config = configData?.value;
    console.log("[mapNominated] configData retrieved:", !!configData);

    if (!config) {
        console.log("[mapNominated] Dùng danh sách MẶC ĐỊNH vì không có config trong DB.");
        const NOMINATED_SLUGS = [
            "bai-hoc-dang-doi", "ke-thu-hoang-gia-cua-toi", "tieng-yeu-nay-anh-dich-duoc-khong",
            "huyen-thoai-linh-bep-anh-nuoi-thang-cap-thanh-huyen-thoai", "dieu-nhan-choi-mat",
            "chu-tich-tap-su", "phu-nhan-dai-quan-the-ky-21", "nha-nghi-bb-tuyet-voi-cua-jae-seok",
            "khi-anh-chay-ve-phia-em", "dua-hau-lap-lanh", "thanh-tra-bi-mat-kiem-toan-tinh-yeu",
            "biet-doi-sieu-kho", "kho-do-danh", "truc-ngoc", "con-trai-ban-me", "bac-si-dao-hoang",
            "vu-lam-linh", "cong-anh-ma-chay", "nu-hoang-nuoc-mat", "mac-ly", "tuoi-hai-lam-tuoi-hai-mot",
            "duoi-tan-cay-co-ngoi-nha-mai-do", "mua-ruc-ro-cua-em-mua-em-ruc-ro", "hom-nay-lai-ban-het",
            "vung-trom-khong-the-giau", "bu-nhin-bong-dem", "gia-nghiep", "chiec-bat-lua-va-vay-cong-chua",
            "hen-ho-chon-cong-so-2025", "nguoi-nhen-giang-ho"
        ];
        config = { mode: "manual", autoCount: 30, movies: NOMINATED_SLUGS.map(s => ({ slug: s })) };
    }

    let slugsToFetch: string[] = [];

    if (config.mode === 'auto') {
        const { data: topViews } = await supabase.from('movie_views').select('movie_slug').order('view_count', { ascending: false }).limit(config.autoCount || 10);
        if (topViews) {
            slugsToFetch = topViews.map(v => v.movie_slug);
        }
    } else {
        slugsToFetch = (config.movies || []).map((m: any) => m.slug);
    }

    const movies = await Promise.all(
        slugsToFetch.map(async (slug) => {
            try {
                // Thử fetch Độc Quyền trước
                const { data: exclusive } = await supabase.from('exclusive_movies').select('*').eq('slug', slug).single();
                if (exclusive && exclusive.status === 'published') {
                    return {
                        _id: exclusive.id,
                        id: exclusive.id,
                        name: exclusive.name || "",
                        origin_name: exclusive.origin_name || "",
                        slug: exclusive.slug,
                        type: exclusive.type,
                        thumb_url: exclusive.thumb_url?.startsWith('http') ? exclusive.thumb_url : `https://phimimg.com/${exclusive.thumb_url}`,
                        poster_url: exclusive.poster_url?.startsWith('http') ? exclusive.poster_url : `https://phimimg.com/${exclusive.poster_url}`,
                        year: exclusive.year || new Date().getFullYear(),
                        lang: exclusive.lang_tag || "Vietsub",
                        quality: "FHD",
                        episode_current: "Tập mới"
                    } as unknown as Movie;
                }

                const res = await fetchPhimJson(`https://phimapi.com/phim/${slug}`);
                const movie = (res as any)?.movie;
                if (!movie) return null;
                return {
                    ...movie,
                    content: movie.content,
                    category: movie.category,
                    tmdb: movie.tmdb
                } as Movie;
            } catch {
                return null;
            }
        })
    );

    const result = movies.filter(Boolean) as Movie[];

    // 3. Lưu cache riêng 24h
    if (redis && result.length > 0) {
        try {
            await redis.setex(NOMINATED_KEY, NOMINATED_TTL, JSON.stringify(result));
        } catch (err) {
            console.error("[Redis Nominated Set Error]", err);
        }
    }

    return result;
}

/**
 * Hàm bổ sung metadata chi tiết cho danh sách phim (Server-side Enrichment)
 * Giúp Hero và FeaturedSlider có content ngay khi load trang
 */
async function enrichMovies(movies: Movie[]): Promise<Movie[]> {
    if (!movies.length) return [];

    return await Promise.all(
        movies.map(async (m) => {
            try {
                const res = await fetchPhimJson(`https://phimapi.com/phim/${m.slug}`);
                const detail = (res as any)?.movie;
                if (!detail) return m;
                return {
                    ...m,
                    content: detail.content,
                    category: detail.category,
                    tmdb: detail.tmdb,
                    actor: detail.actor,
                    director: detail.director,
                    duration: detail.time
                } as Movie;
            } catch {
                return m;
            }
        })
    );
}

export async function prefetchHomePageData(): Promise<HomePrefetch> {
    const BUNDLE_KEY = "home:prefetch:bundle";
    const STALE_KEY = "home:prefetch:bundle:stale";
    const EMERGENCY_KEY = "home:prefetch:bundle:emergency"; // Bản dự phòng cuối cùng (24h)
    const BUNDLE_TTL = 60;     // Cache chính: 1 phút (giảm từ 10 phút)
    const STALE_TTL = 90;      // Cache stale: 90 giây
    const EMERGENCY_TTL = 86400; // 24 giờ

    // 1. Thử lấy từ cache bundle chính trước
    if (redis) {
        try {
            const cached = await redis.get(BUNDLE_KEY);
            if (cached) {
                console.log("[Redis] Home bundle HIT");
                return JSON.parse(cached);
            }

            // 2. Cache chính MISS → Fetch mới ngay (đồng bộ với fetchWithRedis pattern)
            // Nếu STALE_KEY còn sống → dùng làm fallback nếu fetch lỗi, nhưng vẫn await fresh data
            const staleCached = await redis.get(STALE_KEY);
            if (staleCached) {
                console.log("[Redis] Home bundle STALE HIT - Fetching fresh data (await)");
                try {
                    const freshBundle = await fetchAndCacheBundle(BUNDLE_KEY, STALE_KEY, EMERGENCY_KEY, BUNDLE_TTL, STALE_TTL, EMERGENCY_TTL);
                    return freshBundle;
                } catch (err) {
                    console.error("[Redis] Fresh fetch failed, falling back to stale", err);
                    return JSON.parse(staleCached);
                }
            }

            // 3. Cả STALE cũng MISS (rất hiếm) → Kiểm tra EMERGENCY backup (24h)
            const emergencyCached = await redis.get(EMERGENCY_KEY);
            if (emergencyCached) {
                console.log("[Redis] Home bundle EMERGENCY HIT - Serving 24h backup");
                refreshBundleInBackground(BUNDLE_KEY, STALE_KEY, EMERGENCY_KEY, BUNDLE_TTL, STALE_TTL, EMERGENCY_TTL);
                return JSON.parse(emergencyCached);
            }
            console.log("[Redis] Home bundle MISS ALL - Fetching fresh data");
        } catch (err) {
            console.error("[Redis Bundle Error]", err);
        }
    }

    // 4. Cả 3 cache đều MISS → Fetch mới (blocking, lần đầu hoặc Redis down)
    return await fetchAndCacheBundle(BUNDLE_KEY, STALE_KEY, EMERGENCY_KEY, BUNDLE_TTL, STALE_TTL, EMERGENCY_TTL);
}

/**
 * Fetch toàn bộ data trang chủ và lưu vào cả 2 cache key
 */
async function fetchAndCacheBundle(
    bundleKey: string, staleKey: string, emergencyKey: string,
    bundleTtl: number, staleTtl: number, emergencyTtl: number
): Promise<HomePrefetch> {
    const [
        heroRaw,
        catRaw,
        hanRaw,
        trungRaw,
        auMyRaw,
        nominatedMovies,
        featuredTvMovies,
        featuredAnimeMovies,
        topLeMovies,
        topBoMovies,
    ] = await Promise.all([
        fetchPhimJson(URLS.hero),
        fetchPhimJson(URLS.categories),
        fetchPhimJson(URLS.movieRowHan),
        fetchPhimJson(URLS.movieRowTrung),
        fetchPhimJson(URLS.movieRowAuMy),
        mapNominated(),
        fetchFeatured(URLS.featuredTv, 10),
        fetchFeatured(URLS.featuredAnime, 10),
        fetchTop(URLS.topPhimLe, 30),
        fetchTop(URLS.topPhimBo, 30),
    ]);

    const heroMovies = await mapHero(heroRaw);

    // Thực hiện enrichment cho các section quan trọng nhất & Fetch Độc Quyền
    const [enrichedHero, enrichedTv, enrichedAnime, exclusiveHeroMovies, starredHeroMovies] = await Promise.all([
        enrichMovies(heroMovies),
        enrichMovies(featuredTvMovies),
        enrichMovies(featuredAnimeMovies),
        getExclusiveMoviesForHero(), // Lấy 3 phim độc quyền mới nhất
        getStarredMoviesForHero() // Lấy phim được admin đánh dấu
    ]);

    // Trộn phim: Đánh dấu sao -> Độc quyền -> Phim mới cập nhật
    let finalHero = [...enrichedHero];

    // Thêm độc quyền
    if (exclusiveHeroMovies && exclusiveHeroMovies.length > 0) {
        finalHero = [...exclusiveHeroMovies, ...finalHero];
    }

    // Thêm đánh dấu sao (ưu tiên cao nhất)
    if (starredHeroMovies && starredHeroMovies.length > 0) {
        // Lọc bỏ phim trùng lặp (nếu đã có trong độc quyền hoặc mới cập nhật)
        const starredSlugs = new Set(starredHeroMovies.map(m => m.slug));
        finalHero = finalHero.filter(m => !starredSlugs.has(m.slug));

        finalHero = [...starredHeroMovies, ...finalHero];
    }

    // Giữ nguyên số lượng = 8
    finalHero = finalHero.slice(0, 8);

    const result: HomePrefetch = {
        hero: finalHero,
        categories: parseCategories(catRaw),
        movieRowHan: mapMovieRow(parseV1Items(hanRaw)),
        movieRowTrung: mapMovieRow(parseV1Items(trungRaw)),
        movieRowAuMy: mapMovieRow(parseV1Items(auMyRaw)),
        nominated: nominatedMovies,
        featuredTv: enrichedTv,
        featuredAnime: enrichedAnime,
        // Các dãy còn lại để rỗng để client tự fetch qua LazyRow, giảm tải TTFB cho server
        posterChieuRap: [],
        posterPhimBo: [],
        topPhimLe: topLeMovies,
        topPhimBo: topBoMovies,
        posterKinhDi: [],
        posterHoatHinh: [],
        phimNgan: [],
    };

    // Lưu vào CẢ 2 cache key
    if (redis && result) {
        try {
            const jsonData = JSON.stringify(result);
            await Promise.all([
                redis.setex(bundleKey, bundleTtl, jsonData),
                redis.setex(staleKey, staleTtl, jsonData),
                redis.setex(emergencyKey, emergencyTtl, jsonData),
            ]);
        } catch (err) {
            console.error("[Redis Bundle Set Error]", err);
        }
    }

    return result;
}

/**
 * Stale-While-Revalidate: Refresh data ngầm trong background
 * User đã nhận stale data rồi, hàm này chạy fire-and-forget
 */
function refreshBundleInBackground(
    bundleKey: string, staleKey: string, emergencyKey: string,
    bundleTtl: number, staleTtl: number, emergencyTtl: number
): void {
    // Fire-and-forget — không await, không block response
    fetchAndCacheBundle(bundleKey, staleKey, emergencyKey, bundleTtl, staleTtl, emergencyTtl)
        .then(() => console.log("[SWR] Home bundle refreshed in background"))
        .catch(err => console.error("[SWR] Background refresh failed:", err));
}