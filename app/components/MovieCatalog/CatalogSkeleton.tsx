"use client";

import Container from "@/app/components/Container";
import MovieCardSkeleton from "@/app/components/MovieCard/MovieCardSkeleton";
import Skeleton from "react-loading-skeleton";

export default function CatalogSkeleton({ hideSidebar = false }: { hideSidebar?: boolean }) {
    return (
        <main className="pt-24 pt-30 md:pt-40 pb-12 min-h-screen">
            <Container>
                <div className="catalog-page">
                    {/* Skeleton cho Catalog Header */}
                    <div className="mb-8">
                        <Skeleton height={40} width={300} borderRadius={12} baseColor="#1e293b" highlightColor="#334155" />
                    </div>

                    {/* Skeleton cho Movie Filter */}
                    <div className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/5">
                        <div className="flex flex-wrap gap-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} width={120} height={36} borderRadius={20} baseColor="#1e293b" highlightColor="#334155" />
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-10 mt-8">
                        {/* Main Content Area */}
                        <div className="flex-grow w-full lg:min-w-0">
                            <div className={`grid gap-x-4 gap-y-8 md:gap-x-5 md:gap-y-10 ${hideSidebar
                                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
                                : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
                                }`}>
                                {[...Array(24)].map((_, i) => (
                                    <MovieCardSkeleton key={i} />
                                ))}
                            </div>
                        </div>

                        {/* Sidebar Skeleton (nếu không bị ẩn) */}
                        {!hideSidebar && (
                            <div className="w-full lg:w-[320px] shrink-0 space-y-8">
                                <div className="p-6 bg-white/5 rounded-3xl border border-white/5">
                                    <Skeleton height={30} width="60%" className="mb-6" baseColor="#1e293b" highlightColor="#334155" />
                                    {[1, 2, 3, 4, 5].map((i) => (
                                        <div key={i} className="flex gap-4 mb-4">
                                            <Skeleton width={50} height={70} borderRadius={12} baseColor="#1e293b" highlightColor="#334155" />
                                            <div className="flex-1">
                                                <Skeleton height={15} width="90%" className="mb-2" baseColor="#1e293b" highlightColor="#334155" />
                                                <Skeleton height={10} width="50%" baseColor="#1e293b" highlightColor="#334155" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </main>
    );
}
