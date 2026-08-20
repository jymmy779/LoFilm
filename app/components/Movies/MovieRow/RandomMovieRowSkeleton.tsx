import React from "react";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import Container from "@/app/components/UI/Container";

export default function RandomMovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                    <Skeleton className="w-48 sm:w-64 h-7 sm:h-8" rounded="lg" />
                </div>
                <Skeleton className="w-24 h-8" rounded="full" />
            </div>

            {/* Mood Tabs */}
            <div className="mb-6 overflow-hidden">
                <div className="flex gap-2.5">
                    {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="flex-shrink-0 w-36 sm:w-44 h-14" rounded="2xl" />
                    ))}
                </div>
            </div>

            {/* Movies Swiper */}
            <div className="relative overflow-hidden">
                <div className="flex gap-2.5 sm:gap-3 md:gap-3.5">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[calc(43%-5px)] sm:w-[calc(28%-8px)] md:w-[calc(22%-9px)] lg:w-[calc(18%-11px)] xl:w-[calc(15%-12px)] 2xl:w-[calc(13%-14px)] space-y-2">
                            <Skeleton className="aspect-[2/3] w-full" rounded="xl" />
                            <Skeleton className="w-full h-4" rounded="md" />
                            <Skeleton className="w-2/3 h-3 opacity-50" rounded="md" />
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}
