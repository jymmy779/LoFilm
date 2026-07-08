"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Movie } from "@/app/types/movie";
import { FilterState } from "@/app/components/MovieFilter";
import { MenuItem } from "@/app/components/Header/types";
import { CatalogInitialData } from "@/app/utils/serverFetch";
import { globalCache } from "@/app/utils/globalCache";

interface UseMovieCatalogProps {
    baseApiUrl: string;
    itemsPerPage?: number;
    slug?: string; // For category/country pages
    initialData?: CatalogInitialData; // Server-side pre-fetched data
    defaultType?: string; // Force a specific category type (e.g. 'hoathinh')
}

export function useMovieCatalog({ baseApiUrl, itemsPerPage = 32, slug, initialData, defaultType }: UseMovieCatalogProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. Initial State from URL
    const initialFilters: FilterState = {
        category: searchParams.get("cat") || (baseApiUrl.includes("the-loai") && slug ? slug : "") || "",
        country: searchParams.get("country") || (baseApiUrl.includes("quoc-gia") && slug ? slug : "") || "",
        type: searchParams.get("type") || defaultType || "",
        year: searchParams.get("year") || "",
        sort: searchParams.get("sort") || "update",
        rating: searchParams.get("rating") || ""
    };
    const initialPage = Number(searchParams.get("page")) || 1;
    const initialFilterOpen = searchParams.get("filter") === "open";

    // Determine if we have initial data and it matches current URL state (page 1, no extra filters)
    const hasValidInitialData = !!(
        initialData &&
        initialData.movies.length > 0 &&
        initialPage === 1 &&
        !initialFilters.category &&
        !initialFilters.country &&
        !initialFilters.year &&
        (!defaultType || initialFilters.type === defaultType)
    );

    // Synchronously check cache so we don't flash skeletons when navigating back.
    // This allows Next.js scroll restoration to find the correct DOM height instantly.
    const cacheKey = `catalog_${baseApiUrl}_${initialPage}_${JSON.stringify(initialFilters)}_${slug || ''}`;
    const cachedData = globalCache.getRaw<any>(cacheKey);

    // 2. State
    const [movies, setMovies] = useState<Movie[]>(
        hasValidInitialData ? initialData!.movies : (cachedData ? cachedData.movies : [])
    );
    const [isLoading, setIsLoading] = useState(
        hasValidInitialData ? false : (cachedData ? false : true)
    ); // false if we have server data or cached data
    const [isPageLoading, setIsPageLoading] = useState(false); // lightweight loading for pagination/filter changes
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(
        hasValidInitialData ? initialData!.totalPages : (cachedData ? cachedData.totalPages : 1)
    );
    const [pageTitle, setPageTitle] = useState(
        hasValidInitialData ? initialData!.pageTitle : (cachedData ? cachedData.pageTitle : "")
    );
    const [isFilterOpen, setIsFilterOpen] = useState(initialFilterOpen);
    const [activeFilters, setActiveFilters] = useState<FilterState>(initialFilters);
    const [categories, setCategories] = useState<MenuItem[]>(initialData?.categories || []);
    const [countries, setCountries] = useState<MenuItem[]>(initialData?.countries || []);

    // Track if this is the first mount (to skip fetching when we have initialData)
    const isFirstMount = useRef(true);

    // 3. Navigation Helpers
    const updateUrl = useCallback((page: number, filters: FilterState, isOpen: boolean) => {
        const params = new URLSearchParams();
        if (page > 1) params.set("page", page.toString());
        if (filters.category) params.set("cat", filters.category);
        if (filters.country) params.set("country", filters.country);
        
        // Only set type in URL if it's DIFFERENT from defaultType
        if (filters.type && filters.type !== defaultType) params.set("type", filters.type);
        
        if (filters.year) params.set("year", filters.year);
        if (filters.sort !== "update") params.set("sort", filters.sort);
        if (filters.rating) params.set("rating", filters.rating);
        if (isOpen) params.set("filter", "open");

        router.push(`?${params.toString()}`, { scroll: false });
    }, [router, defaultType]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        updateUrl(newPage, activeFilters, isFilterOpen);
        window.scrollTo({ top: 0, behavior: "instant" });
    };

    const handleFilterChange = (filters: FilterState) => {
        setActiveFilters(filters);
        setCurrentPage(1);
        updateUrl(1, filters, isFilterOpen);
        window.scrollTo({ top: 0, behavior: "instant" });
    };

    const toggleUrlTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const handleToggleFilter = (isOpen: boolean) => {
        setIsFilterOpen(isOpen);
        
        // Debounce URL 'filter' param update to avoid lag when spamming the toggle button.
        if (toggleUrlTimeoutRef.current) clearTimeout(toggleUrlTimeoutRef.current);
        
        toggleUrlTimeoutRef.current = setTimeout(() => {
            try {
                const params = new URLSearchParams(window.location.search);
                if (isOpen) {
                    params.set("filter", "open");
                } else {
                    params.delete("filter");
                }
                const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
                window.history.replaceState(null, '', newUrl);
            } catch (e) {
                updateUrl(currentPage, activeFilters, isOpen);
            }
        }, 500);
    };

    // 4. Fetch Master Filters (Categories/Countries) — only if we don't have them from server
    useEffect(() => {
        if (categories.length > 0 && countries.length > 0) return; // Already have from server

        const fetchFilters = async () => {
            try {
                const [catRes, countRes] = await Promise.all([
                    axios.get<MenuItem[]>("https://phimapi.com/the-loai"),
                    axios.get<MenuItem[]>("https://phimapi.com/quoc-gia")
                ]);
                const extractArray = (data: any) => {
                    if (Array.isArray(data)) return data;
                    if (data?.items && Array.isArray(data.items)) return data.items;
                    if (data?.data?.items && Array.isArray(data.data.items)) return data.data.items;
                    if (data?.data && Array.isArray(data.data)) return data.data;
                    return [];
                };
                setCategories(extractArray(catRes.data));
                setCountries(extractArray(countRes.data));
            } catch (err) {
                console.error("Lỗi fetch dữ liệu bộ lọc:", err);
            }
        };
        fetchFilters();
    }, []); // eslint-disable-line react-hooks/exhaust    // 5. Fetch Movies and Enrich Data
    useEffect(() => {
        // Generate a stable cache key based on the current context
        const cacheKey = `catalog_${baseApiUrl}_${currentPage}_${JSON.stringify(activeFilters)}_${slug || ''}`;
        
        // Save initial server data to cache on first load if valid
        if (isFirstMount.current && hasValidInitialData && initialData) {
            globalCache.set(cacheKey, {
                movies: initialData.movies,
                totalPages: initialData.totalPages,
                pageTitle: initialData.pageTitle
            });
            isFirstMount.current = false;
            return;
        }
        isFirstMount.current = false;

        let isMounted = true;
        
        const fetchMovies = async () => {
            // Check cache first for SWR
            const cached = globalCache.getRaw<any>(cacheKey);
            
            if (cached) {
                setMovies(cached.movies);
                setTotalPages(cached.totalPages);
                setIsLoading(false);
                setIsPageLoading(false);
                return; // Nếu có cache thì hiện luôn, không cần spinner
            }

            // Nếu không có cache:
            // - Nếu là lần đầu tiên (chưa có phim): Hiện Skeleton (isLoading)
            // - Nếu đã có phim (chuyển trang/lọc): Hiện Overlay (isPageLoading) và GIỮ LẠI PHIM CŨ
            if (movies.length === 0) {
                setIsLoading(true);
                setIsPageLoading(false);
            } else {
                setIsLoading(false);
                setIsPageLoading(true);
                // KHÔNG setMovies([]) ở đây để giữ lại trang cũ làm nền cho Overlay
            }

            try {
                // 1. Unified Search Strategy (Priority-based endpoint selection)
                // PhimAPI/KKPhim specialized endpoints actually support secondary filters better than generic list endpoints.
                const { category, country, year, type, sort } = activeFilters;
                let apiUrl = "";
                const params = new URLSearchParams();
                
                const typeMap: Record<string, string> = {
                    "single": "phim-le",
                    "series": "phim-bo",
                    "hoathinh": "hoat-hinh",
                    "tvshows": "tv-shows",
                    "cinema": "phim-chieu-rap"
                };

                // Priority Logic: Type > Category > Country > Year
                if (type) {
                    const typeSlug = typeMap[type] || "phim-moi";
                    apiUrl = `https://phimapi.com/v1/api/danh-sach/${typeSlug}`;
                    if (category) params.set("category", category);
                    if (country) params.set("country", country);
                    if (year) params.set("year", year);
                } else if (category) {
                    apiUrl = `https://phimapi.com/v1/api/the-loai/${category}`;
                    if (country) params.set("country", country);
                    if (year) params.set("year", year);
                } else if (country) {
                    apiUrl = `https://phimapi.com/v1/api/quoc-gia/${country}`;
                    if (year) params.set("year", year);
                } else if (year) {
                    apiUrl = `https://phimapi.com/v1/api/nam/${year}`;
                } else {
                    // Default Page: Use baseApiUrl (usually phim-moi-cap-nhat)
                    apiUrl = baseApiUrl;
                }

                // 2. Set Standard Parameters
                params.set("page", currentPage.toString());
                params.set("limit", itemsPerPage.toString());

                // Sorting
                if (sort) {
                    const sortMap: Record<string, string> = {
                        "update": "modified.time",
                        "view": "view",
                        "imdb": "tmdb.vote_average",
                        "year": "year"
                    };
                    params.set("sort_field", sortMap[sort] || "modified.time");
                    params.set("sort_type", "desc");
                }

                // 3. Special Case: Handle redirects if we are on a slug-specific page 
                if (slug) {
                    if (baseApiUrl.includes("the-loai")) {
                        if (activeFilters.category && activeFilters.category !== slug) {
                            router.push(`/the-loai/${activeFilters.category}`);
                            if (isMounted) { setIsLoading(false); setIsPageLoading(false); }
                            return;
                        }
                        if (activeFilters.category === "") {
                            const target = activeFilters.type === "single" ? "/danh-sach/phim-le" : (activeFilters.type === "series" ? "/danh-sach/phim-bo" : "/danh-sach/phim-moi");
                            router.push(target);
                            if (isMounted) { setIsLoading(false); setIsPageLoading(false); }
                            return;
                        }
                    }
                    
                    if (baseApiUrl.includes("quoc-gia")) {
                        if (activeFilters.country && activeFilters.country !== slug) {
                            router.push(`/quoc-gia/${activeFilters.country}`);
                            if (isMounted) { setIsLoading(false); setIsPageLoading(false); }
                            return;
                        }
                        if (activeFilters.country === "") {
                            const target = activeFilters.type === "single" ? "/danh-sach/phim-le" : (activeFilters.type === "series" ? "/danh-sach/phim-bo" : "/danh-sach/phim-moi");
                            router.push(target);
                            if (isMounted) { setIsLoading(false); setIsPageLoading(false); }
                            return;
                        }
                    }
                }

                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(`${apiUrl}?${params.toString()}`)}`);

                let items: Movie[] = [];
                let totalItems = 0;
                let title = "";

                if (res.data?.status === "success" || res.data?.status === true) {
                    items = res.data.data?.items || res.data.items || [];
                    totalItems = res.data.data?.params?.pagination?.totalItems || res.data.pagination?.totalItems || 0;
                    title = res.data.data?.titlePage || res.data.data?.seoOnpage?.title_page || res.data.data?.seoOnpage?.title || res.data.titlePage || "";
                }

                // 4. Secondary Client-side Filter
                if (activeFilters.type && items.length > 0) {
                    const targetType = activeFilters.type;
                    items = items.filter(movie => {
                        if (targetType === "single") return movie.type === "single";
                        if (targetType === "series") return movie.type === "series" || movie.type === "hoathinh" || movie.type === "tvshows";
                        return true;
                    });
                }

                if (isMounted) {
                    const calculatedTotalPages = Math.ceil(totalItems / itemsPerPage) || 1;
                    
                    setMovies(items);
                    setTotalPages(calculatedTotalPages);
                    setPageTitle(title);
                    
                    // Update cache
                    globalCache.set(cacheKey, {
                        movies: items,
                        totalPages: calculatedTotalPages,
                        pageTitle: title
                    });

                    setIsLoading(false);
                    setIsPageLoading(false);
                }
            } catch (error) {
                console.error("Lỗi fetch phim:", error);
                if (isMounted) { setIsLoading(false); setIsPageLoading(false); }
            }
        };


        fetchMovies();
        
        return () => { 
            isMounted = false; 
        };
    }, [currentPage, activeFilters, baseApiUrl, itemsPerPage, slug, router]); // eslint-disable-line react-hooks/exhaustive-deps

    // 6. Client-side sorting for rating (since API doesn't support it well)
    const sortedMovies = useMemo(() => {
        if (activeFilters.sort === "imdb") {
            return [...movies].sort((a, b) => {
                const rateA = a.tmdb?.vote_average || 0;
                const rateB = b.tmdb?.vote_average || 0;
                
                // Primary: Sort by Rating (Descending)
                if (rateB !== rateA) {
                    return rateB - rateA;
                }
                
                // Secondary: Sort by Modified Time (Descending) for stability, 
                // especially for movies with 0/N/A ratings.
                const timeA = new Date(a.modified?.time || 0).getTime();
                const timeB = new Date(b.modified?.time || 0).getTime();
                return timeB - timeA;
            });
        }
        return movies;
    }, [movies, activeFilters.sort]);

    return {
        movies: sortedMovies,
        isLoading,
        isPageLoading,
        currentPage,
        totalPages,
        pageTitle,
        isFilterOpen,
        activeFilters,
        categories,
        countries,
        handlePageChange,
        handleFilterChange,
        handleToggleFilter
    };
}
