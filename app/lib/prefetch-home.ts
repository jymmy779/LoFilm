import type { Movie } from "@/app/types/movie";
import type { HomeCategory, HomePrefetch } from "@/app/types/home-prefetch";
import {
    filterDuplicateMovies,
    sortAndSlicePosterRowMovies,
} from "@/app/utils/movieUtils";

import { fetchWithRedis, redis } from "@/app/lib/fetch-with-redis";

const REVALIDATE_SEC = 60; // Đồng bộ 60 giây toàn hệ thống
const QUICK_REVALIDATE_SEC = 60;

async function fetchPhimJson(url: string, quick: boolean = false): Promise<unknown> {
    return await fetchWithRedis(url, { revalidate: quick ? QUICK_REVALIDATE_SEC : REVALIDATE_SEC });
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
    if (!Array.isArray(payload)) return [];
    const list = payload as HomeCategory[];
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
        const res = await fetchPhimJson(url, true);
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
        const res = await fetchPhimJson(url, true);
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

const NOMINATED_SLUGS = [
    "nu-than-chinh-nghia-nu-than-cong-ly",
    "phu-nhan-dai-quan-the-ky-21",
    "nhat-ky-tu-do-cua-toi",
    "anh-sang-cua-doi-ta",
    "dia-nguc-doc-than-phan-5",
    "hanh-trinh-cua-baki-samurai-bat-bai",
    "tay-du-ky-phan-2",
    "gimbap-va-onigiri",
    "nhap-thanh-van",
    "khi-anh-chay-ve-phia-em",
    "na-tra-2-ma-dong-nao-hai",
    "dai-ca-di-hoc",
    "yaiba-huyen-thoai-samurai",
    "avatar-lua-va-tro-tan",
    "lien-hoa-lau",
    "ban-trai-theo-yeu-cau",
    "hoa-mau",
    "thanh-guom-diet-quy-vo-han-thanh",
    "doi-gio-hu-2026",
    "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2"
];

async function mapNominated(): Promise<Movie[]> {
    const NOMINATED_KEY = "home:nominated";
    const NOMINATED_TTL = 86400; // 24 giờ — danh sách đề cử hiếm khi thay đổi

    // 1. Thử lấy từ Redis cache riêng trước
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

    // 2. Cache miss → fetch từng slug
    const movies = await Promise.all(
        NOMINATED_SLUGS.map(async (slug) => {
            try {
                const res = await fetchPhimJson(`https://phimapi.com/phim/${slug}`, true);
                const movie = (res as any)?.movie;
                if (!movie) return null;
                return {
                    ...movie,
                    // Đảm bảo có các field quan trọng
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
                const res = await fetchPhimJson(`https://phimapi.com/phim/${m.slug}`, true);
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
    const STALE_KEY = "home:prefetch:bundle:stale"; // Bản backup cho SWR pattern
    const BUNDLE_TTL = 60;    // Cache chính: 60 giây (đồng bộ với toàn hệ thống)
    const STALE_TTL = 300;    // Cache stale: 5 phút — dùng khi cache chính hết hạn

    // 1. Thử lấy từ cache bundle chính trước
    if (redis) {
        try {
            const cached = await redis.get(BUNDLE_KEY);
            if (cached) {
                return JSON.parse(cached);
            }

            // 2. Cache chính MISS → Kiểm tra bản stale (SWR Pattern)
            const staleCached = await redis.get(STALE_KEY);
            if (staleCached) {
                // Trả stale data ngay cho user (TỨC THÌ, không chờ!)
                // Đồng thời refresh ngầm trong background (fire-and-forget)
                refreshBundleInBackground(BUNDLE_KEY, STALE_KEY, BUNDLE_TTL, STALE_TTL);
                return JSON.parse(staleCached);
            }
        } catch (err) {
            console.error("[Redis Bundle Error]", err);
        }
    }

    // 3. Cả 2 cache đều MISS → Fetch mới (blocking, lần đầu hoặc Redis down)
    return await fetchAndCacheBundle(BUNDLE_KEY, STALE_KEY, BUNDLE_TTL, STALE_TTL);
}

/**
 * Fetch toàn bộ data trang chủ và lưu vào cả 2 cache key
 */
async function fetchAndCacheBundle(
    bundleKey: string, staleKey: string,
    bundleTtl: number, staleTtl: number
): Promise<HomePrefetch> {
    const [
        heroRaw,
        catRaw,
        hanRaw,
        nominatedMovies,
        featuredTvMovies,
        featuredAnimeMovies,
        topLeMovies,
        topBoMovies,
    ] = await Promise.all([
        fetchPhimJson(URLS.hero, true),
        fetchPhimJson(URLS.categories),
        fetchPhimJson(URLS.movieRowHan, true),
        mapNominated(),
        fetchFeatured(URLS.featuredTv, 10),
        fetchFeatured(URLS.featuredAnime, 10),
        fetchTop(URLS.topPhimLe, 30),
        fetchTop(URLS.topPhimBo, 30),
    ]);

    const heroMovies = await mapHero(heroRaw);

    // Thực hiện enrichment cho các section quan trọng nhất
    const [enrichedHero, enrichedTv, enrichedAnime] = await Promise.all([
        enrichMovies(heroMovies),
        enrichMovies(featuredTvMovies),
        enrichMovies(featuredAnimeMovies)
    ]);

    const result: HomePrefetch = {
        hero: enrichedHero,
        categories: parseCategories(catRaw),
        movieRowHan: mapMovieRow(parseV1Items(hanRaw)),
        nominated: nominatedMovies,
        featuredTv: enrichedTv,
        featuredAnime: enrichedAnime,
        // Các dãy còn lại để rỗng để client tự fetch qua LazyRow, giảm tải TTFB cho server
        movieRowTrung: [],
        movieRowAuMy: [],
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
    bundleKey: string, staleKey: string,
    bundleTtl: number, staleTtl: number
): void {
    // Fire-and-forget — không await, không block response
    fetchAndCacheBundle(bundleKey, staleKey, bundleTtl, staleTtl)
        .then(() => console.log("[SWR] Home bundle refreshed in background"))
        .catch(err => console.error("[SWR] Background refresh failed:", err));
}

