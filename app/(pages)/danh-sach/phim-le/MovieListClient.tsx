"use client";

import { useMovieCatalog } from "@/app/hooks/useMovieCatalog";
import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";

export default function MovieListClient() {
    const {
        movies, isLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter
    } = useMovieCatalog({
        baseApiUrl: "https://phimapi.com/v1/api/danh-sach/phim-le"
    });

    return (
        <CatalogLayout
            title="Danh sách Phim Lẻ"
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
