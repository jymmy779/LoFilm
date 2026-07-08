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
    defaultType?: string;
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
    emptyMessage,
    defaultType
}: MovieCatalogClientProps) {
    const {
        movies, isLoading, isPageLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter, pageTitle
    } = useMovieCatalog({
        baseApiUrl,
        itemsPerPage,
        slug,
        initialData,
        defaultType
    });

    // Determine the title to display: explicit prop > page title from API > parsed slug > default
    const fallbackTitle = slug 
        ? slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') 
        : "Danh sách phim";
        
    // 1. Better Fallback: Search in categories/countries list for the real name if slug is present
    const safeCategories = Array.isArray(categories) ? categories : [];
    const safeCountries = Array.isArray(countries) ? countries : [];
    const foundItem = safeCategories.find(c => c.slug === slug) || safeCountries.find(c => c.slug === slug);
    const realName = foundItem?.name || fallbackTitle;
    
    // 2. Determine the raw title
    const rawTitle = title || pageTitle || (slug ? realName : "phim");
    
    // 3. Ensure "Danh sách" prefix exists for consistency
    const displayTitle = rawTitle.toLowerCase().startsWith("danh sách")
        ? rawTitle
        : `Danh sách ${rawTitle.toLowerCase().startsWith("phim") ? rawTitle : 'phim ' + rawTitle}`;

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
