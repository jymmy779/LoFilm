"use client";

import { useMovieCatalog } from "@/app/hooks/useMovieCatalog";
import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";
import { useSearchParams } from "next/navigation";

export default function NewMoviesClient() {
    // Logic đặc biệt cho Phim mới: mặc định v3, nếu có lọc thì chuyển sang v1/api
    // để PhimAPI có thể thực hiện lọc theo Category/Country/Year

    const searchParams = useSearchParams();
    const categoryFilter = searchParams.get("cat");
    const countryFilter = searchParams.get("country");
    const typeFilter = searchParams.get("type");
    const yearFilter = searchParams.get("year");

    // Xác định baseApiUrl dựa trên filter
    // Nếu có lọc, ta phải chuyển sang v1/api vì danh-sach/phim-moi-cap-nhat không hỗ trợ tham số lọc
    let baseApiUrl = "https://phimapi.com/danh-sach/phim-moi-cap-nhat-v2";

    if (categoryFilter) {
        baseApiUrl = `https://phimapi.com/v1/api/the-loai/${categoryFilter}`;
    } else if (countryFilter) {
        baseApiUrl = `https://phimapi.com/v1/api/quoc-gia/${countryFilter}`;
    } else if (typeFilter) {
        const typeMap: Record<string, string> = {
            "single": "phim-le",
            "series": "phim-bo",
            "hoathinh": "hoat-hinh",
            "tvshows": "tv-shows"
        };
        const typeSlug = typeMap[typeFilter] || "phim-moi";
        baseApiUrl = `https://phimapi.com/v1/api/danh-sach/${typeSlug}`;
    } else if (yearFilter) {
        // Fallback dùng phim-le nếu chỉ lọc mỗi năm
        baseApiUrl = "https://phimapi.com/v1/api/danh-sach/phim-le";
    }

    const {
        movies, isLoading, isPageLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter
    } = useMovieCatalog({
        baseApiUrl
    });

    return (
        <CatalogLayout
            title="Danh sách Phim mới"
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
        />
    );
}
