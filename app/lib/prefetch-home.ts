import type { Movie } from "@/app/types/movie";
import type { HomeCategory, HomePrefetch } from "@/app/types/home-prefetch";
import {
    filterDuplicateMovies,
    sortAndSlicePosterRowMovies,
} from "@/app/utils/movieUtils";

import { fetchWithRedis } from "@/app/lib/fetch-with-redis";

const REVALIDATE_SEC = 600; // 10 minutes for standard sections (categories, countries)
const QUICK_REVALIDATE_SEC = 300; // 5 minutes for near real-time updates (hero, movie rows)

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
 * Lấy danh sách phim và làm giàu dữ liệu content cho các phim đầu tiên
 * Dùng cho Featured Sliders để hiển thị tức thì
 */
async function fetchAndEnrichFeatured(url: string, limit: number = 10, enrichCount: number = 3): Promise<Movie[]> {
    try {
        const res = await fetchPhimJson(url, true);
        const items = parseV1Items(res);
        if (items.length === 0) return [];

        const filtered = filterDuplicateMovies(items).slice(0, limit);

        // Lấy thêm content cho các phim đầu tiên
        const enriched = await Promise.all(
            filtered.map(async (m, i) => {
                if (i >= enrichCount) return m;
                try {
                    const detail = await fetchPhimJson(`https://phimapi.com/phim/${m.slug}`);
                    return { ...m, content: (detail as any)?.movie?.content || "" };
                } catch {
                    return m;
                }
            })
        );

        return enriched;
    } catch (error) {
        console.error(`Lỗi prefetch featured slider từ ${url}:`, error);
        return [];
    }
}

async function mapHero(payload: unknown): Promise<Movie[]> {
    const raw = parseV3HeroItems(payload);
    const movies = filterDuplicateMovies(raw).slice(0, 8);

    // Nâng cao: Lấy thêm content cho hero movies ngay từ server
    // Chỉ lấy cho 4 phim đầu để tối ưu TTFB và tiết kiệm function invocations
    const enriched = await Promise.all(
        movies.map(async (m, i) => {
            if (i > 3) return m;
            try {
                const detail = await fetchPhimJson(`https://phimapi.com/phim/${m.slug}`);
                return { ...m, content: (detail as any)?.movie?.content || "" };
            } catch {
                return m;
            }
        })
    );

    return enriched;
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
    "phu-nhan-dai-quan-the-ky-21",
    "ban-trai-theo-yeu-cau",
    "anh-sang-cua-doi-ta",
    "avatar-lua-va-tro-tan",
    "khi-anh-chay-ve-phia-em",
    "nhap-thanh-van",
    "hoa-mau",
    "hanh-trinh-cua-baki-samurai-bat-bai",
    "tay-du-ky-phan-2",
    "lien-hoa-lau",
    "thanh-guom-diet-quy-vo-han-thanh",
    "nhat-ky-tu-do-cua-toi",
    "gimbap-va-onigiri",
    "doi-gio-hu-2026",
    "nhiem-vu-bat-kha-thi-nghiep-bao-phan-2",
    "na-tra-2-ma-dong-nao-hai",
    "dai-ca-di-hoc",
    "dia-nguc-doc-than-phan-5",
    "dau-vet-2016",
    "yaiba-huyen-thoai-samurai"
];

async function mapNominated(): Promise<Movie[]> {
    const movies = await Promise.all(
        NOMINATED_SLUGS.map(async (slug) => {
            try {
                const res = await fetchPhimJson(`https://phimapi.com/phim/${slug}`, true);
                const movie = (res as any)?.movie;
                if (!movie) return null;
                // Chuyển đổi format từ detail sang item format nếu cần
                return {
                    _id: movie._id,
                    name: movie.name,
                    slug: movie.slug,
                    origin_name: movie.origin_name,
                    poster_url: movie.poster_url,
                    thumb_url: movie.thumb_url,
                    year: movie.year,
                    quality: movie.quality,
                    lang: movie.lang,
                    type: movie.type,
                    episode_current: movie.episode_current
                } as Movie;
            } catch {
                return null;
            }
        })
    );
    return movies.filter(Boolean) as Movie[];
}

export async function prefetchHomePageData(): Promise<HomePrefetch> {
    const [
        heroRaw,
        catRaw,
        hanRaw,
        nominatedMovies,
        featuredTvMovies,
        featuredAnimeMovies,
    ] = await Promise.all([
        fetchPhimJson(URLS.hero, true),
        fetchPhimJson(URLS.categories),
        fetchPhimJson(URLS.movieRowHan, true),
        mapNominated(),
        fetchAndEnrichFeatured(URLS.featuredTv, 10, 3),
        fetchAndEnrichFeatured(URLS.featuredAnime, 10, 3),
    ]);

    const heroMovies = await mapHero(heroRaw);

    return {
        hero: heroMovies,
        categories: parseCategories(catRaw),
        movieRowHan: mapMovieRow(parseV1Items(hanRaw)),
        nominated: nominatedMovies,
        featuredTv: featuredTvMovies,
        featuredAnime: featuredAnimeMovies,
        // Các dãy còn lại để rỗng để client tự fetch qua LazyRow, giảm tải TTFB cho server
        movieRowTrung: [],
        movieRowAuMy: [],
        posterChieuRap: [],
        posterPhimBo: [],
        topPhimLe: [],
        topPhimBo: [],
        posterKinhDi: [],
        posterHoatHinh: [],
        phimNgan: [],
    };
}
