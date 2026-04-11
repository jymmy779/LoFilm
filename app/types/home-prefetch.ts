import type { Movie } from "@/app/types/movie";

export interface HomeCategory {
    _id: string;
    name: string;
    slug: string;
}

/** Dữ liệu trang chủ prefetch trên server (truyền xuống client, không import module fetch) */
export interface HomePrefetch {
    hero: Movie[];
    categories: HomeCategory[];
    movieRowHan: Movie[];
    movieRowTrung: Movie[];
    movieRowAuMy: Movie[];
    featuredTv: Movie[];
    posterChieuRap: Movie[];
    posterPhimBo: Movie[];
    topPhimLe: Movie[];
    topPhimBo: Movie[];
    featuredAnime: Movie[];
    posterKinhDi: Movie[];
    posterHoatHinh: Movie[];
    phimNgan: Movie[];
    nominated: Movie[];
    initialHistory?: any[];
}
