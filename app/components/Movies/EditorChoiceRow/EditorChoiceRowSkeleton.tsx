import React from "react";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import Container from "@/app/components/UI/Container";
import MovieCardSkeleton from "@/app/components/Movies/MovieCard/MovieCardSkeleton";

export default function EditorChoiceRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="row-header flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Skeleton className="w-8 h-8 sm:w-9 sm:h-9" rounded="xl" />
                    <Skeleton className="w-[180px] h-8 lg:h-9" rounded="lg" />
                    <Skeleton className="w-20 h-5" rounded="md" />
                </div>
            </div>

            <div className="row-content">
                <div className="relative overflow-hidden pb-4">
                    <div className="flex gap-2 sm:gap-2.5 md:gap-3">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[38vw] sm:w-[26vw] md:w-[20vw] lg:w-[15.5vw] xl:w-[13vw]">
                                <MovieCardSkeleton />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
}
