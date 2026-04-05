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

export default function SearchClient() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-32 text-center text-white/50">Đang tải...</div>}>
            <SearchContent />
        </Suspense>
    );
}

function SearchContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse filters from URL
    const keyword = searchParams.get("search") || "";
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
            if (!keyword) return;
            setIsLoading(true);
            try {
                const params = new URLSearchParams();
                params.set("keyword", keyword);
                params.set("page", currentPage.toString());
                params.set("limit", "32");

                if (activeFilters.category) params.set("category", activeFilters.category);
                if (activeFilters.country) params.set("country", activeFilters.country);
                if (activeFilters.year) params.set("year", activeFilters.year);
                
                // Mặc định sort_field = modified.time
                let sortField = "modified.time";
                if (activeFilters.sort === "year") sortField = "year";
                if (activeFilters.sort === "_id") sortField = "_id";
                params.set("sort_field", sortField);
                params.set("sort_type", "desc");

                const apiUrl = `https://phimapi.com/v1/api/tim-kiem?${params.toString()}`;
                const res = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);

                if (res.data?.status === "success" || res.data?.status === true) {
                    const items = res.data.data?.items || [];
                    const totalItems = res.data.data?.params?.pagination?.totalItems || 0;
                    
                    if (isMounted) {
                        setMovies(items);
                        setTotalPages(Math.ceil(totalItems / 32) || 1);
                    }

                    // --- Enrich data (optional but kept as same as NewMoviesClient) ---
                    const enriched = [...items];
                    const chunkSize = 8;
                    for (let i = 0; i < enriched.length; i += chunkSize) {
                        if (!isMounted) break;
                        const chunk = enriched.slice(i, i + chunkSize);
                        await Promise.all(chunk.map(async (movie, indexInChunk) => {
                            if (movie.episode_total === "??" || !movie.episode_total) {
                                try {
                                    const detailRes = await axios.get(`/api/proxy?url=${encodeURIComponent(`https://phimapi.com/phim/${movie.slug}`)}`);
                                    if (detailRes.data?.movie?.episode_total) {
                                        enriched[i + indexInChunk] = { ...enriched[i + indexInChunk], episode_total: detailRes.data.movie.episode_total };
                                    }
                                } catch (e) {}
                            }
                        }));
                        if (isMounted) setMovies([...enriched]);
                        if (i + chunkSize < enriched.length) await new Promise(r => setTimeout(r, 50));
                    }
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
                if (isMounted) setIsLoading(false);
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
        <main className="pt-24 md:pt-28 lg:pt-32 pb-12 min-h-screen">
            <Container>
                <div className="catalog-page">
                    <CatalogHeader title={`Tìm kiếm phim: ${keyword}`} />

                    <MovieFilter
                        categories={categories}
                        countries={countries}
                        initialFilters={activeFilters}
                        initialIsOpen={isFilterOpen}
                        onFilterChange={handleFilterChange}
                        onToggle={handleToggleFilter}
                    />

                    {isLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 mt-8">
                            {[...Array(32)].map((_, i) => (
                                <div key={i} className="space-y-3">
                                    <Skeleton className="aspect-[2/3] rounded-2xl" />
                                    <div className="space-y-1.5 px-1">
                                        <Skeleton height={16} width="90%" />
                                        <Skeleton height={12} width="60%" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : movies.length > 0 ? (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 mt-8">
                                {movies.map((movie, index) => (
                                    <MoviePosterCard key={movie._id} movie={movie} priority={index < 16} />
                                ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                            />
                        </>
                    ) : (
                        /* No content section */
                        <div className="text-center py-20" style={{ color: 'rgba(255, 255, 255, 0.4)' }}>
                            <div style={{ fontSize: '5rem', marginBottom: '16px' }}>
                                <i className="fa-solid fa-film"></i>
                            </div>
                            <div className="text-lg">Không có nội dung cho mục này.</div>
                        </div>
                    )}
                </div>
            </Container>
        </main>
    );
}
