import type { Movie } from "@/app/types/movie";
import type { HomeCategory, HomePrefetch } from "@/app/types/home-prefetch";
import {
    filterDuplicateMovies,
    sortAndSlicePosterRowMovies,
} from "@/app/utils/movieUtils";

import { fetchWithRedis } from "@/app/lib/fetch-with-redis";

const REVALIDATE_SEC = 3600;

async function fetchPhimJson(url: string): Promise<unknown> {
    return await fetchWithRedis(url);
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

async function mapHero(payload: unknown): Promise<Movie[]> {
    const raw = parseV3HeroItems(payload);
    const movies = filterDuplicateMovies(raw).slice(0, 8);
    
    // Nâng cao: Lấy thêm content cho hero movies ngay từ server
    // Chỉ lấy cho 4 phim đầu để tối ưu TTFB
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
    hero: "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1",
    categories: "https://phimapi.com/the-loai",
    movieRowHan: "https://phimapi.com/v1/api/quoc-gia/han-quoc?limit=20",
    movieRowTrung: "https://phimapi.com/v1/api/quoc-gia/trung-quoc?limit=20",
    movieRowAuMy: "https://phimapi.com/v1/api/quoc-gia/au-my?limit=20",
    featuredTv: "https://phimapi.com/v1/api/danh-sach/tv-shows?limit=20",
    posterChieuRap: "https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=20",
    posterPhimBo: "https://phimapi.com/v1/api/danh-sach/phim-bo?limit=20",
    topPhimLe: "https://phimapi.com/v1/api/danh-sach/phim-le?limit=30",
    topPhimBo: "https://phimapi.com/v1/api/danh-sach/phim-bo?limit=30",
    featuredAnime: "https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=20",
    posterKinhDi: "https://phimapi.com/v1/api/the-loai/kinh-di?limit=20",
    posterHoatHinh: "https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=20",
} as const;

export async function prefetchHomePageData(): Promise<HomePrefetch> {
    const [
        heroRaw,
        catRaw,
        hanRaw,
    ] = await Promise.all([
        fetchPhimJson(URLS.hero),
        fetchPhimJson(URLS.categories),
        fetchPhimJson(URLS.movieRowHan),
    ]);

    const heroMovies = await mapHero(heroRaw);

    return {
        hero: heroMovies,
        categories: parseCategories(catRaw),
        movieRowHan: mapMovieRow(parseV1Items(hanRaw)),
        // Các dãy còn lại để rỗng để client tự fetch qua LazyRow, giảm tải TTFB cho server
        movieRowTrung: [],
        movieRowAuMy: [],
        featuredTv: [],
        posterChieuRap: [],
        posterPhimBo: [],
        topPhimLe: [],
        topPhimBo: [],
        featuredAnime: [],
        posterKinhDi: [],
        posterHoatHinh: [],
    };
}
