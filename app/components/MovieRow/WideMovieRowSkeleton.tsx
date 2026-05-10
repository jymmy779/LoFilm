import React from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import Container from "@/app/components/Container";
import WideMovieCardSkeleton from "@/app/components/MovieCard/WideMovieCardSkeleton";

export default function WideMovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="row-header flex items-center justify-between mb-4 md:mb-6">
                <Skeleton className="w-[200px] h-7 lg:h-10" rounded="lg" />
                <Skeleton className="w-20 h-5" rounded="md" />
            </div>

            <div className="row-content">
                <div className="relative overflow-hidden">
                    <div className="flex gap-[10px] md:gap-[16px] xl:gap-[20px]">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[calc(83.33%-8.3px)] sm:w-[calc(66.666%-8px)] md:w-[calc(47.6%-7.6px)] lg:w-[calc(38.4%-11.2px)] xl:w-[calc(31.25%-13.7px)] 2xl:w-[calc(27.7%-14.4px)]">
                                <div className="block relative overflow-hidden rounded-xl md:rounded-2xl border border-white/5">
                                    <WideMovieCardSkeleton />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
}
