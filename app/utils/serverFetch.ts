/**
 * Server-side utility to fetch catalog data directly from PhimAPI.
 * Used in Server Components (page.tsx) to pre-fetch initial page data,
 * dramatically reducing loading time for first paint.
 * 
 * Now uses fetchWithRedis for unified caching strategy across the app.
 */

import { Movie } from "@/app/types/movie";
import { MenuItem } from "@/app/components/Header/types";
import { fetchWithRedis } from "@/app/lib/fetch-with-redis";

export interface CatalogInitialData {
    movies: Movie[];
    totalPages: number;
    pageTitle: string;
    categories: MenuItem[];
    countries: MenuItem[];
}

/**
 * Fetch catalog data on the server side.
 * @param apiUrl - Full API URL (e.g. https://phimapi.com/v1/api/danh-sach/phim-bo)
 * @param page - Current page number
 * @param limit - Items per page
 * @param filters - Optional filter params (year, category, country)
 */
export async function fetchCatalogData(
    apiUrl: string,
    page: number = 1,
    limit: number = 32,
    filters?: {
        year?: string;
        category?: string;
        country?: string;
    }
): Promise<CatalogInitialData> {
    try {
        // Build URL with params
        const params = new URLSearchParams();
        params.set("page", page.toString());
        params.set("limit", limit.toString());
        if (filters?.year) params.set("year", filters.year);
        if (filters?.category) params.set("category", filters.category);
        if (filters?.country) params.set("country", filters.country);

        const fullUrl = `${apiUrl}?${params.toString()}`;

        // Fetch movies + filter lists in parallel using unified cache strategy
        const [moviesData, categoriesData, countriesData] = await Promise.all([
            fetchWithRedis(fullUrl, { revalidate: 60 }),
            fetchWithRedis("https://phimapi.com/the-loai", { revalidate: 86400 }), // 24 giờ
            fetchWithRedis("https://phimapi.com/quoc-gia", { revalidate: 86400 }), // 24 giờ
        ]);

        let items: Movie[] = [];
        let totalItems = 0;
        let pageTitle = "";

        if (moviesData?.status === "success" || moviesData?.status === true) {
            items = moviesData.data?.items || moviesData.items || [];
            totalItems = moviesData.data?.params?.pagination?.totalItems || moviesData.pagination?.totalItems || 0;
            pageTitle = moviesData.data?.titlePage || "";
        }

        const parseList = (data: any): MenuItem[] => {
            if (Array.isArray(data)) return data;
            if (data?.data?.items && Array.isArray(data.data.items)) return data.data.items;
            if (data?.items && Array.isArray(data.items)) return data.items;
            return [];
        };

        return {
            movies: items,
            totalPages: Math.ceil(totalItems / limit) || 1,
            pageTitle,
            categories: parseList(categoriesData),
            countries: parseList(countriesData),
        };
    } catch (error) {
        console.error("Server fetch error:", error);
        return {
            movies: [],
            totalPages: 1,
            pageTitle: "",
            categories: [],
            countries: [],
        };
    }
}

/**
 * Fetch search results on the server side.
 */
export async function fetchSearchData(
    keyword: string,
    page: number = 1,
    limit: number = 32,
    filters?: {
        category?: string;
        country?: string;
        year?: string;
        sort?: string;
    }
): Promise<CatalogInitialData> {
    try {
        // 1. Search in Supabase (Exclusive movies) on page 1
        let exclusiveItems: any[] = [];
        if (page === 1) {
            try {
                const { createClient } = await import("@/app/utils/supabase/server");
                const supabase = await createClient();
                const { data: supabaseData } = await supabase
                    .from("exclusive_movies")
                    .select("*")
                    .eq("status", "published")
                    .or(`name.ilike.%${keyword}%,origin_name.ilike.%${keyword}%`)
                    .order('created_at', { ascending: false })
                    .limit(limit);

                if (supabaseData) {
                    exclusiveItems = supabaseData.map(movie => ({
                        _id: movie.id,
                        name: movie.name || "Phim Độc Quyền",
                        slug: movie.slug,
                        origin_name: movie.origin_name || "",
                        type: movie.type,
                        thumb_url: movie.thumb_url || "",
                        poster_url: movie.poster_url || "",
                        year: movie.year || new Date().getFullYear(),
                        is_copyright: true,
                        sub_docquyen: true
                    }));
                }
            } catch (err) {
                console.error("Supabase server fetch search error:", err);
            }
        }

        // 2. Search on PhimAPI with normalized keyword (accent-insensitive)
        const apiKeyword = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');

        const params = new URLSearchParams();
        params.set("keyword", apiKeyword);
        params.set("page", page.toString());
        params.set("limit", limit.toString());
        if (filters?.category) params.set("category", filters.category);
        if (filters?.country) params.set("country", filters.country);
        if (filters?.year) params.set("year", filters.year);

        let sortField = "modified.time";
        if (filters?.sort === "year") sortField = "year";
        if (filters?.sort === "_id") sortField = "_id";
        params.set("sort_field", sortField);
        params.set("sort_type", "desc");

        const fullUrl = `https://phimapi.com/v1/api/tim-kiem?${params.toString()}`;

        // Use fetchWithRedis for unified caching
        const [searchData, categoriesData, countriesData] = await Promise.all([
            fetchWithRedis(fullUrl, { revalidate: 30 }),
            fetchWithRedis("https://phimapi.com/the-loai", { revalidate: 86400 }), // 24 giờ
            fetchWithRedis("https://phimapi.com/quoc-gia", { revalidate: 86400 }), // 24 giờ
        ]);

        let apiItems: any[] = [];
        let totalItems = 0;

        if (searchData?.status === "success" || searchData?.status === true) {
            apiItems = searchData.data?.items || [];
            totalItems = searchData.data?.params?.pagination?.totalItems || 0;
        }

        // Merge exclusive movies and standard movies, avoiding duplicate slugs
        const exclusiveSlugs = new Set(exclusiveItems.map(item => item.slug));
        const filteredApiItems = apiItems.filter(item => !exclusiveSlugs.has(item.slug));
        const finalMovies = [...exclusiveItems, ...filteredApiItems];

        // Adjust total items count if exclusive items were added
        if (page === 1) {
            totalItems += exclusiveItems.length;
        }

        const parseList = (data: any): MenuItem[] => {
            if (Array.isArray(data)) return data;
            if (data?.data?.items && Array.isArray(data.data.items)) return data.data.items;
            if (data?.items && Array.isArray(data.items)) return data.items;
            return [];
        };

        return {
            movies: finalMovies,
            totalPages: Math.ceil(totalItems / limit) || 1,
            pageTitle: `Tìm kiếm: ${keyword}`,
            categories: parseList(categoriesData),
            countries: parseList(countriesData),
        };
    } catch (error) {
        console.error("Server search error:", error);
        return {
            movies: [],
            totalPages: 1,
            pageTitle: "",
            categories: [],
            countries: [],
        };
    }
}
