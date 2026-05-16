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
        <main className="pt-30 md:pt-40 pb-12 min-h-screen animate-fade-in">
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
                                    {/* Pagination Loading Overlay */}
                                    {isPageLoading && (
                                        <div className="absolute inset-0 z-40 bg-[#0f1115]/40 transition-opacity duration-300">
                                            <div className="sticky top-1/2 -translate-y-1/2 w-full flex justify-center">
                                                <div className="scale-110">
                                                    {/* Pure Spinner Ring */}
                                                    <div className="h-10 w-10 animate-spin-loader rounded-full border-2 border-white/10 border-t-[#f5a623]"></div>
                                                </div>
                                            </div>

                                            <style jsx>{`
                                                @keyframes spin-loader { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                                                @keyframes pulse-loader { 0%, 100% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.1); opacity: 0.6; } }
                                                .animate-spin-loader { animation: spin-loader 0.8s linear infinite; }
                                                .animate-pulse-loader { animation: pulse-loader 1.2s ease-in-out infinite; }
                                            `}</style>
                                        </div>
                                    )}
                                    <div className={`transition-opacity duration-300 ${isPageLoading ? 'opacity-40' : 'opacity-100'}`}>
                                        <div key={`${isLoading}-${currentPage}`} className="animate-fade-in-simple">
                                            {isLoading ? (
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
