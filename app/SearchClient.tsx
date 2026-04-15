"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import Container from "@/app/components/Container";
import MoviePosterCard from "@/app/components/MovieCard/MoviePosterCard";
import { Movie } from "@/app/types/movie";
import Skeleton from "react-loading-skeleton";
import Pagination from "@/app/components/Pagination";
import CatalogHeader from "@/app/components/CatalogHeader";
import MovieFilter, { FilterState } from "@/app/components/MovieFilter";
import { MenuItem } from "@/app/components/Header/types";
import { enrichMoviesMetadata } from "@/app/utils/enrichmentUtils";
import { sortMoviesByRelevance } from "@/app/utils/movieUtils";

import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";
import { Film } from "lucide-react";

export default function SearchClient() {
// ... existing search client wrapper ...
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0f1115]" />}>
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse filters from URL
    const keyword = (searchParams.get("search") || "").trim();
    const initialFilters: FilterState = {
        category: searchParams.get("cat") || "",
        country: searchParams.get("country") || "",
        type: searchParams.get("type") || "",
        year: searchParams.get("year") || "",
        sort: searchParams.get("sort") || "modified.time",
        rating: searchParams.get("rating") || ""
    };

    const initialPage = Number(searchParams.get("page")) || 1;
    const [isFilterOpen, setIsFilterOpen] = useState(searchParams.get("filter") === "open");
    const [movies, setMovies] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(1);

    const [categories, setCategories] = useState<MenuItem[]>([]);
    const [countries, setCountries] = useState<MenuItem[]>([]);
    const [activeFilters, setActiveFilters] = useState<FilterState>(initialFilters);

    const updateUrl = (page: number, filters: FilterState, isOpen: boolean) => {
        const params = new URLSearchParams();
        if (keyword) params.set("search", keyword);
        if (page > 1) params.set("page", page.toString());
        if (filters.category) params.set("cat", filters.category);
        if (filters.country) params.set("country", filters.country);
        if (filters.type) params.set("type", filters.type);
        if (filters.year) params.set("year", filters.year);
        if (filters.sort !== "modified.time") params.set("sort", filters.sort);
        if (filters.rating) params.set("rating", filters.rating);
        if (isOpen) params.set("filter", "open");

        router.push(`?${params.toString()}`, { scroll: false });
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
        updateUrl(newPage, activeFilters, isFilterOpen);
    };

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

    useEffect(() => {
        let isMounted = true;
        const fetchMovies = async () => {
            if (!keyword) {
                setIsLoading(false);
                return;
            }

            // Use lightweight loading indicator if we already have movies on screen
            if (movies.length > 0) {
                setIsPageLoading(true);
            } else {
                setIsLoading(true);
            }

            try {
                const params = new URLSearchParams();
                params.set("keyword", keyword);
                params.set("page", currentPage.toString());
                params.set("limit", "48");

                if (activeFilters.category) params.set("category", activeFilters.category);
                if (activeFilters.country) params.set("country", activeFilters.country);
                if (activeFilters.year) params.set("year", activeFilters.year);
                
                // Sort logic
                let sortField = "modified.time";
                if (activeFilters.sort === "year") sortField = "year";
                if (activeFilters.sort === "_id") sortField = "_id";
                params.set("sort_field", sortField);
                params.set("sort_type", "desc");

                const apiUrl = `https://phimapi.com/v1/api/tim-kiem?${params.toString()}`;
                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);

                if (!isMounted) return;

                if (res.data?.status === "success" || res.data?.status === true) {
                    const items = res.data.data?.items || [];
                    const totalItems = res.data.data?.params?.pagination?.totalItems || 0;
                    
                    if (isMounted) {
                        // Áp dụng logic sắp xếp thông minh trước khi hiện kết quả
                        const sortedItems = sortMoviesByRelevance(items, keyword);

                        setMovies(sortedItems);
                        setTotalPages(Math.ceil(totalItems / 48) || 1);
                        setIsLoading(false);
                        setIsPageLoading(false);
                    }

                    // --- Background Enrichment (Smarter & Non-blocking) ---
                    // Wait a bit for initial render to settle
                    await new Promise(r => setTimeout(r, 100));
                    
                    const mounted = () => isMounted;
                    await enrichMoviesMetadata({
                        items,
                        setItems: setMovies,
                        isMounted: mounted,
                        chunkSize: 4,
                        delay: 100
                    });
                } else {
                    if (isMounted) {
                        setMovies([]);
                        setTotalPages(1);
                    }
                }
            } catch (error) {
                console.error("Lỗi fetch search:", error);
                if (isMounted) setMovies([]);
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    setIsPageLoading(false);
                }
            }
        };

        fetchMovies();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return () => { isMounted = false; };
    }, [keyword, currentPage, activeFilters]);

    const handleFilterChange = (filters: FilterState) => {
        setActiveFilters(filters);
        setCurrentPage(1);
        updateUrl(1, filters, isFilterOpen);
    };

    const handleToggleFilter = (isOpen: boolean) => {
        setIsFilterOpen(isOpen);
        updateUrl(currentPage, activeFilters, isOpen);
    };

    return (
        <CatalogLayout
            title={`Tìm kiếm phim: ${keyword}`}
            isLoading={isLoading}
            isPageLoading={isPageLoading}
            movies={movies}
            currentPage={currentPage}
            totalPages={totalPages}
            isFilterOpen={isFilterOpen}
            activeFilters={activeFilters}
            categories={categories}
            countries={countries}
            onFilterChange={handleFilterChange}
            onToggleFilter={handleToggleFilter}
            onPageChange={handlePageChange}
            hideSidebar={true}
            emptyMessage={
                <div className="flex flex-col items-center justify-center py-20 text-white/30">
                    <Film size={80} strokeWidth={1} className="mb-6 opacity-40" />
                    <p className="text-xl font-light">Không có nội dung cho phim: <span className="text-amber-500 font-medium italic">"{keyword}"</span></p>
                    <p className="text-sm mt-2 opacity-50 italic">Thử với từ khóa khác hoặc điều chỉnh bộ lọc xem?</p>
                </div>
            }
        />
    );
}
