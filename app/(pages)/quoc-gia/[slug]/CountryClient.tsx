"use client";

import { useMovieCatalog } from "@/app/hooks/useMovieCatalog";
import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";

interface CountryClientProps {
    slug: string;
}

export default function CountryClient({ slug }: CountryClientProps) {
    const {
        movies, isLoading, isPageLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter, pageTitle
    } = useMovieCatalog({
        baseApiUrl: `https://phimapi.com/v1/api/quoc-gia/${slug}`,
        slug,
        itemsPerPage: 48
    });

    const currentCountry = countries.find(c => c.slug === slug);
    const displayTitle = currentCountry ? `Phim quốc gia ${currentCountry.name}` : (pageTitle || `Phim theo quốc gia`);

    return (
        <CatalogLayout
            title={displayTitle}
            isLoading={isLoading}
            isPageLoading={isPageLoading}
            movies={movies}
            currentPage={currentPage}
            totalPages={totalPages}
            isFilterOpen={isFilterOpen}
            activeFilters={{ ...activeFilters, country: activeFilters.country || slug }}
            categories={categories}
            countries={countries}
            onFilterChange={handleFilterChange}
            onToggleFilter={handleToggleFilter}
            onPageChange={handlePageChange}
            emptyMessage="Chưa có phim nào đến từ quốc gia này."
        />
    );
}
