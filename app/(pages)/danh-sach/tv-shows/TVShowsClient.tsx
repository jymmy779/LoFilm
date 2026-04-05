"use client";

import { useMovieCatalog } from "@/app/hooks/useMovieCatalog";
import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";

export default function TVShowsClient() {
    const {
        movies, isLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter
    } = useMovieCatalog({
        baseApiUrl: "https://phimapi.com/v1/api/danh-sach/tv-shows"
    });

    return (
        <CatalogLayout
            title="TV Shows Truyền Hình"
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
