"use client";

import { useMovieCatalog } from "@/app/hooks/useMovieCatalog";
import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";

export default function TheaterMoviesClient() {
    const {
        movies, isLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter
    } = useMovieCatalog({
        baseApiUrl: "https://phimapi.com/v1/api/danh-sach/phim-chieu-rap"
    });

    return (
        <CatalogLayout
            title="Danh sách Phim Chiếu Rạp"
            isLoading={isLoading}
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
