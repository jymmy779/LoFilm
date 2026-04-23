"use client";

import { useMovieCatalog } from "@/app/hooks/useMovieCatalog";
import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";
import { CatalogInitialData } from "@/app/utils/serverFetch";

interface MovieCatalogClientProps {
    title?: string;
    baseApiUrl: string;
    itemsPerPage?: number;
    slug?: string;
    initialData?: CatalogInitialData;
    hideSidebar?: boolean;
    emptyMessage?: string;
}

/**
 * Shared MovieCatalogClient to reduce code duplication across various catalog pages.
 * Handles movie fetching logic via useMovieCatalog hook and renders CatalogLayout.
 */
export default function MovieCatalogClient({
    title,
    baseApiUrl,
    itemsPerPage = 32,
    slug,
    initialData,
    hideSidebar,
    emptyMessage
}: MovieCatalogClientProps) {
    const {
        movies, isLoading, isPageLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter, pageTitle
    } = useMovieCatalog({
        baseApiUrl,
        itemsPerPage,
        slug,
        initialData
    });

    // Determine the title to display: explicit prop > page title from API > default
    const displayTitle = title || pageTitle || "Danh sách phim";

    return (
        <CatalogLayout
            title={displayTitle}
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
            hideSidebar={hideSidebar}
            emptyMessage={emptyMessage}
        />
    );
}
