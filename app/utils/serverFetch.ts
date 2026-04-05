/**
 * Server-side utility to fetch catalog data directly from PhimAPI.
 * Used in Server Components (page.tsx) to pre-fetch initial page data,
 * dramatically reducing loading time for first paint.
 */

import { Movie } from "@/app/types/movie";
import { MenuItem } from "@/app/components/Header/types";

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

        // Fetch movies + filter lists in parallel (direct server-to-server, no proxy needed)
        const [moviesRes, catRes, countRes] = await Promise.all([
            fetch(fullUrl, { next: { revalidate: 300 } }), // Cache 5 min
            fetch("https://phimapi.com/the-loai", { next: { revalidate: 3600 } }), // Cache 1 hour
            fetch("https://phimapi.com/quoc-gia", { next: { revalidate: 3600 } }),  // Cache 1 hour
        ]);

        const moviesData = await moviesRes.json();
        const categoriesData = await catRes.json();
        const countriesData = await countRes.json();

        let items: Movie[] = [];
        let totalItems = 0;
        let pageTitle = "";

        if (moviesData?.status === "success" || moviesData?.status === true) {
            items = moviesData.data?.items || moviesData.items || [];
            totalItems = moviesData.data?.params?.pagination?.totalItems || moviesData.pagination?.totalItems || 0;
            pageTitle = moviesData.data?.titlePage || "";
        }

        return {
            movies: items,
            totalPages: Math.ceil(totalItems / limit) || 1,
            pageTitle,
            categories: Array.isArray(categoriesData) ? categoriesData : [],
            countries: Array.isArray(countriesData) ? countriesData : [],
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
        const params = new URLSearchParams();
        params.set("keyword", keyword);
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

        const [searchRes, catRes, countRes] = await Promise.all([
            fetch(fullUrl, { next: { revalidate: 60 } }), // Cache 1 min for search
            fetch("https://phimapi.com/the-loai", { next: { revalidate: 3600 } }),
            fetch("https://phimapi.com/quoc-gia", { next: { revalidate: 3600 } }),
        ]);

        const searchData = await searchRes.json();
        const categoriesData = await catRes.json();
        const countriesData = await countRes.json();

        let items: Movie[] = [];
        let totalItems = 0;

        if (searchData?.status === "success" || searchData?.status === true) {
            items = searchData.data?.items || [];
            totalItems = searchData.data?.params?.pagination?.totalItems || 0;
        }

        return {
            movies: items,
            totalPages: Math.ceil(totalItems / limit) || 1,
            pageTitle: `Tìm kiếm: ${keyword}`,
            categories: Array.isArray(categoriesData) ? categoriesData : [],
            countries: Array.isArray(countriesData) ? countriesData : [],
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
