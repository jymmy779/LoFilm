import React from "react";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import Container from "@/app/components/UI/Container";

export default function TopMovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="row-header flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-[200px] h-8 lg:h-10" rounded="lg" />
                    <Skeleton className="w-20 h-5" rounded="md" />
                </div>
            </div>

            <div className="relative overflow-hidden pb-4">
                <div className="flex gap-2 sm:gap-2.5 md:gap-3">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[38vw] sm:w-[26vw] md:w-[20vw] lg:w-[15.5vw] xl:w-[13vw] space-y-2">
                            <div className="relative">
                                <Skeleton className="aspect-[2/3] w-full" rounded="lg" />
                                <div className="absolute -bottom-2 -left-1 w-9 h-12 bg-white/5 rounded-lg border border-white/5" />
                            </div>

                            <div className="space-y-1.5 pt-1">
                                <Skeleton className="w-full h-4" rounded="md" />
                                <Skeleton className="w-2/3 h-3 opacity-50" rounded="md" />
                                <div className="flex gap-1 pt-1">
                                    <Skeleton className="w-10 h-3" rounded="sm" />
                                    <Skeleton className="w-8 h-3" rounded="sm" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}
