"use client";

import { useMovieCatalog } from "@/app/hooks/useMovieCatalog";
import CatalogLayout from "@/app/components/MovieCatalog/CatalogLayout";

interface CategoryClientProps {
    slug: string;
}

export default function CategoryClient({ slug }: CategoryClientProps) {
    const {
        movies, isLoading, isPageLoading, currentPage, totalPages, isFilterOpen,
        activeFilters, categories, countries, handlePageChange,
        handleFilterChange, handleToggleFilter, pageTitle
    } = useMovieCatalog({
        baseApiUrl: `https://phimapi.com/v1/api/the-loai/${slug}`,
        slug
    });

    const currentCategory = categories.find(c => c.slug === slug);
    const displayTitle = currentCategory ? `Phim thể loại ${currentCategory.name}` : (pageTitle || `Phim thể loại`);

    return (
        <CatalogLayout
            title={displayTitle}
            isLoading={isLoading}
            isPageLoading={isPageLoading}
            movies={movies}
            currentPage={currentPage}
            totalPages={totalPages}
            isFilterOpen={isFilterOpen}
            activeFilters={{ ...activeFilters, category: activeFilters.category || slug }}
            categories={categories}
            countries={countries}
            onFilterChange={handleFilterChange}
            onToggleFilter={handleToggleFilter}
            onPageChange={handlePageChange}
            emptyMessage="Chưa có phim nào trong thể loại này."
        />
    );
}
