import React from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import Container from "@/app/components/Container";
import MovieCardSkeleton from "@/app/components/MovieCard/MovieCardSkeleton";

export default function MoviePosterRowSkeleton() {
    return (
        <Container as="section" className="movie-row-section relative z-30">
            <div className="row-header flex items-center justify-between mb-6">
                <Skeleton className="w-[200px] h-8 lg:h-10" rounded="lg" />
                <Skeleton className="w-20 h-5" rounded="md" />
            </div>

            <div className="row-content">
                <div className="relative overflow-hidden">
                    <div className="flex gap-[10px] md:gap-[13px] xl:gap-[15px]">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[calc(50%-5px)] sm:w-[calc(33.333%-8.7px)] md:w-[calc(25%-9.75px)] lg:w-[calc(20%-10.4px)] xl:w-[calc(14.28%-12.8px)] 2xl:w-[calc(12.5%-13.1px)]">
                                <MovieCardSkeleton />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
}
