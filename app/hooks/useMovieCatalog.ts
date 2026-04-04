"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Movie } from "@/app/types/movie";
import { FilterState } from "@/app/components/MovieFilter";
import { MenuItem } from "@/app/components/Header/types";

interface UseMovieCatalogProps {
    baseApiUrl: string;
    itemsPerPage?: number;
    slug?: string; // For category/country pages
}

export function useMovieCatalog({ baseApiUrl, itemsPerPage = 32, slug }: UseMovieCatalogProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    // 1. Initial State from URL
    const initialFilters: FilterState = {
        category: searchParams.get("cat") || "",
        country: searchParams.get("country") || "",
        type: searchParams.get("type") || "",
        year: searchParams.get("year") || "",
        sort: searchParams.get("sort") || "update",
        rating: searchParams.get("rating") || ""
    };
    const initialPage = Number(searchParams.get("page")) || 1;
    const initialFilterOpen = searchParams.get("filter") === "open";

    // 2. State
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);
    const [pageTitle, setPageTitle] = useState("");
    const [isFilterOpen, setIsFilterOpen] = useState(initialFilterOpen);
    const [activeFilters, setActiveFilters] = useState<FilterState>(initialFilters);
    const [categories, setCategories] = useState<MenuItem[]>([]);
    const [countries, setCountries] = useState<MenuItem[]>([]);

    // 3. Navigation Helpers
    const updateUrl = useCallback((page: number, filters: FilterState, isOpen: boolean) => {
        const params = new URLSearchParams();
        if (page > 1) params.set("page", page.toString());
        if (filters.category) params.set("cat", filters.category);
        if (filters.country) params.set("country", filters.country);
        if (filters.type) params.set("type", filters.type);
        if (filters.year) params.set("year", filters.year);
        if (filters.sort !== "update") params.set("sort", filters.sort);
        if (filters.rating) params.set("rating", filters.rating);
        if (isOpen) params.set("filter", "open");

        router.push(`?${params.toString()}`, { scroll: false });
    }, [router]);

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        updateUrl(newPage, activeFilters, isFilterOpen);
    };

    const handleFilterChange = (filters: FilterState) => {
        setActiveFilters(filters);
        setCurrentPage(1);
        updateUrl(1, filters, isFilterOpen);
    };

    const handleToggleFilter = (isOpen: boolean) => {
        setIsFilterOpen(isOpen);
        updateUrl(currentPage, activeFilters, isOpen);
    };

    // 4. Fetch Master Filters (Categories/Countries)
    useEffect(() => {
        const fetchFilters = async () => {
            try {
                const [catRes, countRes] = await Promise.all([
                    axios.get<MenuItem[]>("https://phimapi.com/the-loai"),
                    axios.get<MenuItem[]>("https://phimapi.com/quoc-gia")
                ]);
                setCategories(catRes.data);
                setCountries(countRes.data);
            } catch (err) {
                console.error("Lỗi fetch dữ liệu bộ lọc:", err);
            }
        };
        fetchFilters();
    }, []);

    // 5. Fetch Movies and Enrich Data
    useEffect(() => {
        let isMounted = true;
        const fetchMovies = async () => {
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                params.set("page", currentPage.toString());
                params.set("limit", itemsPerPage.toString());

                // Logic specific to redirects when base slug changes (for Category/Country pages)
                if (slug) {
                    if (baseApiUrl.includes("the-loai") && activeFilters.category && activeFilters.category !== slug) {
                        router.push(`/the-loai/${activeFilters.category}`);
                        return;
                    }
                    if (baseApiUrl.includes("quoc-gia") && activeFilters.country && activeFilters.country !== slug) {
                        router.push(`/quoc-gia/${activeFilters.country}`);
                        return;
                    }
                } else {
                    // For standard lists (movies, series), apply category/country as params
                    if (activeFilters.category) params.set("category", activeFilters.category);
                    if (activeFilters.country) params.set("country", activeFilters.country);
                }

                if (activeFilters.year) params.set("year", activeFilters.year);

                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(`${baseApiUrl}?${params.toString()}`)}`);

                let items: Movie[] = [];
                let totalItems = 0;
                let title = "";

                if (res.data?.status === "success" || res.data?.status === true) {
                    // Support both v1 and v3 structures
                    items = res.data.data?.items || res.data.items || [];
                    totalItems = res.data.data?.params?.pagination?.totalItems || res.data.pagination?.totalItems || 0;
                    title = res.data.data?.titlePage || "";
                }

                if (isMounted) {
                    setMovies(items);
                    setTotalPages(Math.ceil(totalItems / itemsPerPage) || 1);
                    setPageTitle(title);
                }

                // Data Enrichment (Episode totals)
                const enriched = [...items];
                const chunkSize = 8;
                for (let i = 0; i < enriched.length; i += chunkSize) {
                    if (!isMounted) break;
                    const chunk = enriched.slice(i, i + chunkSize);
                    await Promise.all(
                        chunk.map(async (movie, indexInChunk) => {
                            const isMultiEpisode = ["series", "hoathinh", "tvshows"].includes(movie.type || "");
                            const needsTotal = !movie.episode_total || movie.episode_total === "??";
                            if (isMultiEpisode && needsTotal) {
                                try {
                                    const detailRes = await axios.get(`/api/proxy?url=${encodeURIComponent(`https://phimapi.com/phim/${movie.slug}`)}`);
                                    if (detailRes.data?.movie?.episode_total) {
                                        const actualIndex = i + indexInChunk;
                                        enriched[actualIndex] = { ...enriched[actualIndex], episode_total: detailRes.data.movie.episode_total };
                                    }
                                } catch (e) {}
                            }
                        })
                    );
                    if (isMounted) setMovies([...enriched]);
                }
            } catch (error) {
                console.error("Lỗi fetch phim:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        fetchMovies();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return () => { isMounted = false; };
    }, [currentPage, activeFilters, baseApiUrl, itemsPerPage, slug, router]);

    return {
        movies,
        isLoading,
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
