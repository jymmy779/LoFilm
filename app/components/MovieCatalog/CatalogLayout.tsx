"use client";

import Container from "@/app/components/Container";
import MoviePosterCard from "@/app/components/MovieCard/MoviePosterCard";
import { Movie } from "@/app/types/movie";
import Skeleton from "react-loading-skeleton";
import Pagination from "@/app/components/Pagination";
import CatalogHeader from "@/app/components/CatalogHeader";
import MovieFilter, { FilterState } from "@/app/components/MovieFilter";
import { MenuItem } from "@/app/components/Header/types";

import Sidebar from "@/app/components/Sidebar/Sidebar";

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
    emptyMessage?: React.ReactNode;
    isPageLoading?: boolean;
    hideSidebar?: boolean;
    sidebarProps?: {
        weeklyLimit?: number;
        seriesLimit?: number;
    };
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
    emptyMessage = "Chưa có phim nào trong danh sách này.",
    isPageLoading = false,
    hideSidebar = false,
    sidebarProps
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

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-8">
                        {/* Main Content Area */}
                        <div className="flex-grow w-full lg:min-w-0">
                            <div className="relative">
                                {/* Loading Overlay for pagination/filter changes */}
                                {(isLoading === false && isPageLoading) && (
                                    <div className="absolute inset-x-0 -top-4 bottom-0 z-40 flex justify-center pt-20 pointer-events-none">
                                        <div className="sticky top-1/2 -translate-y-1/2 w-12 h-12 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin"></div>
                                    </div>
                                )}

                                <div className={`transition-opacity duration-300 ${(isLoading === false && isPageLoading) ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                    {isLoading ? (
                                        <div className={`grid gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 ${
                                            hideSidebar 
                                            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8" 
                                            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                                        }`}>
                                            {[...Array(24)].map((_, i) => (
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
                                                <div className={`grid gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 ${
                                                    hideSidebar 
                                                    ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8" 
                                                    : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                                                }`}>
                                                    {movies.map((movie, index) => (
                                                        <MoviePosterCard key={movie._id} movie={movie} priority={index < 6} />
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
                            </div>
                        </div>

                        {/* Sidebar */}
                        {!hideSidebar && (
                            <div className="w-full lg:w-[320px] shrink-0">
                                <Sidebar {...sidebarProps} />
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </main>
    );
}
