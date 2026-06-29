"use client";

import Container from "@/app/components/Container";
import MoviePosterCard from "@/app/components/MovieCard/MoviePosterCard";
import MovieCardSkeleton from "@/app/components/MovieCard/MovieCardSkeleton";
import { Movie } from "@/app/types/movie";
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
    hideFilter?: boolean;
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
    hideFilter = false,
    sidebarProps
}: CatalogLayoutProps) {
    return (
        <main className="pt-30 md:pt-40 pb-12 min-h-screen">
            <Container>
                <div className="catalog-page">
                    <CatalogHeader title={title} />

                    {!hideFilter && (
                        <MovieFilter
                            categories={categories}
                            countries={countries}
                            initialFilters={activeFilters}
                            initialIsOpen={isFilterOpen}
                            onFilterChange={onFilterChange}
                            onToggle={onToggleFilter}
                        />
                    )}

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-8">
                            {/* Main Content Area */}
                            <div className="flex-grow w-full lg:min-w-0">
                                <div className="relative">
                                    <div>
                                        <div className="w-full">
                                            {isLoading || isPageLoading ? (
                                                <div
                                                    className={`grid gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 ${hideSidebar
                                                        ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
                                                        : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                                                        }`}
                                                >
                                                    {[...Array(24)].map((_, i) => (
                                                        <MovieCardSkeleton key={i} />
                                                    ))}
                                                </div>
                                            ) : (
                                                <div key="content">
                                                    {movies.length > 0 ? (
                                                        <div className={`grid gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 ${hideSidebar
                                                            ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
                                                            : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                                                            }`}>
                                                            {movies.map((movie, index) => (
                                                                <MoviePosterCard key={movie._id} movie={movie} priority={index < 2} />
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
                                                </div>
                                            )}
                                        </div>
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
