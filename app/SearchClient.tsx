"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { Movie } from "@/app/types/movie";
import { FilterState } from "@/app/components/MovieFilter";
import { MenuItem } from "@/app/components/Header/types";
import { globalCache } from "@/app/utils/globalCache";

import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";
import { Film, AlertCircle, RotateCcw, Trash2 } from "lucide-react";

import { CatalogInitialData } from "@/app/utils/serverFetch";

export default function SearchClient({ initialData }: { initialData?: CatalogInitialData }) {
// ... existing search client wrapper ...
    return (
        <Suspense fallback={<div className="min-h-screen bg-[#0f1115]" />}>
            <SearchContent initialData={initialData} />
        </Suspense>
    );
}

function SearchContent({ initialData }: { initialData?: CatalogInitialData }) {
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
    const [movies, setMovies] = useState<Movie[]>(initialData?.movies || []);
    const [isLoading, setIsLoading] = useState(!initialData);
    const [isPageLoading, setIsPageLoading] = useState(false);
    const [isError, setIsError] = useState(false);
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [totalPages, setTotalPages] = useState(initialData?.totalPages || 1);

    const [categories, setCategories] = useState<MenuItem[]>(initialData?.categories || []);
    const [countries, setCountries] = useState<MenuItem[]>(initialData?.countries || []);
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
        const cacheKey = `search_${keyword}_${currentPage}_${JSON.stringify(activeFilters)}`;

        const fetchMovies = async () => {
            if (!keyword) {
                setIsLoading(false);
                return;
            }

            // If we have initialData and this is the first load (or the active filters/page match the initial params), use it
            if (initialData && currentPage === initialPage && JSON.stringify(activeFilters) === JSON.stringify(initialFilters)) {
                setIsLoading(false);
                setIsPageLoading(false);
                return;
            }

            // Check cache first for SWR
            const cached = globalCache.getRaw<any>(cacheKey);
            if (cached) {
                setMovies(cached.movies);
                setTotalPages(cached.totalPages);
                setIsLoading(false);
                setIsPageLoading(true);
            } else {
                // Nếu chưa có trong cache, xóa dữ liệu cũ và hiện Skeleton ngay lập tức
                setMovies([]);
                setIsLoading(true);
                setIsPageLoading(false);
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

                const apiUrl = `/api/search?${params.toString()}`;
                const res = await axios.get(apiUrl);

                if (!isMounted) return;

                if (res.data?.status === "success" || res.data?.status === true) {
                    const items = res.data.data?.items || [];
                    const totalItems = res.data.data?.params?.pagination?.totalItems || 0;
                    const calculatedTotalPages = Math.ceil(totalItems / 48) || 1;
                    
                    if (isMounted) {
                        setMovies(items);
                        setTotalPages(calculatedTotalPages);
                        setIsError(false);
                        
                        // Update cache
                        globalCache.set(cacheKey, {
                            movies: items,
                            totalPages: calculatedTotalPages
                        });

                        setIsLoading(false);
                        setIsPageLoading(false);
                    }
                } else {
                    if (isMounted) {
                        setMovies([]);
                        setTotalPages(1);
                    }
                }
            } catch (error) {
                console.error("Lỗi fetch search:", error);
                if (isMounted) {
                    setIsError(true);
                    setMovies([]);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                    setIsPageLoading(false);
                }
            }
        };

        fetchMovies();
        
        // Optimize scroll: small delay to let React render skeletons/content first.
        // Use 'instant' instead of 'smooth' to prevent stuttering/lag on mobile/desktop.
        const scrollTimeout = setTimeout(() => {
            requestAnimationFrame(() => {
                window.scrollTo({ top: 0, behavior: "instant" });
            });
        }, 100);

        return () => { 
            isMounted = false; 
            clearTimeout(scrollTimeout);
        };
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
                isError ? (
                    <div className="flex flex-col items-center justify-center py-20 text-white/30">
                        <AlertCircle size={80} strokeWidth={1} className="mb-6 text-red-500/50" />
                        <p className="text-xl font-light">Đã có lỗi xảy ra khi tìm kiếm</p>
                        <p className="text-sm mt-2 opacity-50 italic">Hệ thống đang quá tải hoặc lỗi mạng. Vui lòng thử lại sau giây lát.</p>
                        <button 
                            onClick={() => window.location.reload()}
                            className="mt-6 flex items-center gap-2 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/80 transition-all"
                        >
                            <RotateCcw size={16} />
                            Thử lại ngay
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-white/30">
                        <Film size={80} strokeWidth={1} className="mb-6 opacity-40" />
                        <p className="text-xl font-light">Không có nội dung cho phim: <span className="text-amber-500 font-medium italic">"{keyword}"</span></p>
                        <p className="text-sm mt-2 opacity-50 italic">Thử với từ khóa khác hoặc điều chỉnh bộ lọc xem?</p>
                        {(activeFilters.category || activeFilters.country || activeFilters.year || activeFilters.type) && (
                            <button 
                                onClick={() => handleFilterChange({
                                    category: "",
                                    country: "",
                                    type: "",
                                    year: "",
                                    sort: "modified.time",
                                    rating: ""
                                })}
                                className="mt-8 flex items-center gap-2 px-6 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-500 rounded-full transition-all group"
                            >
                                <Trash2 size={18} className="group-hover:rotate-12 transition-transform" />
                                Xóa tất cả bộ lọc & Tìm lại
                            </button>
                        )}
                    </div>
                )
            }
        />
    );
}
