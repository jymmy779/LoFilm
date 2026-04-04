"use client";

import Container from "@/app/components/Container";
import MoviePosterCard from "@/app/components/MovieCard/MoviePosterCard";
import { Movie } from "@/app/types/movie";
import Skeleton from "react-loading-skeleton";
import Pagination from "@/app/components/Pagination";
import CatalogHeader from "@/app/components/CatalogHeader";
import MovieFilter, { FilterState } from "@/app/components/MovieFilter";
import { MenuItem } from "@/app/components/Header/types";

interface CatalogLayoutProps {
    title: string;
    isLoading: boolean;
    movies: Movie[];
    currentPage: number;
    totalPages: number;
    isFilterOpen: boolean;
    activeFilters: FilterState;
    categories: MenuItem[];
    countries: MenuItem[];
    onFilterChange: (filters: FilterState) => void;
    onToggleFilter: (isOpen: boolean) => void;
    onPageChange: (page: number) => void;
    emptyMessage?: string;
}

export default function CatalogLayout({
    title,
    isLoading,
    movies,
    currentPage,
    totalPages,
    isFilterOpen,
    activeFilters,
    categories,
    countries,
    onFilterChange,
    onToggleFilter,
    onPageChange,
    emptyMessage = "Chưa có phim nào trong danh sách này."
}: CatalogLayoutProps) {
    return (
        <main className="pt-24 md:pt-28 lg:pt-32 pb-12 min-h-screen">
            <Container>
                <div className="catalog-page">
                    <CatalogHeader title={title} />

                    <MovieFilter
                        categories={categories}
                        countries={countries}
                        initialFilters={activeFilters}
                        initialIsOpen={isFilterOpen}
                        onFilterChange={onFilterChange}
                        onToggle={onToggleFilter}
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
                    ) : (
                        <>
                            {movies.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 mt-8">
                                    {movies.map((movie) => (
                                        <MoviePosterCard key={movie._id} movie={movie} />
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center text-white/50 text-lg">
                                    {emptyMessage}
                                </div>
                            )}

                            {totalPages > 1 && (
                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={onPageChange}
                                />
                            )}
                        </>
                    )}
                </div>
            </Container>
        </main>
    );
}
