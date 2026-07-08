"use client";

import React from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import Container from "@/app/components/Container";

export default function HeroSliderSkeleton() {
    return (
        <section className="w-full relative h-[500px] md:h-[700px] lg:h-[850px] overflow-hidden bg-[#0F1115]">
            {/* Background shimmer */}
            <div className="absolute inset-0">
                <Skeleton className="w-full h-full" rounded="none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/60 to-transparent" />
            </div>

            {/* Combined Content & Thumbs Overlay Match */}
            <Container className="absolute inset-x-0 bottom-0 z-30 pb-16 pointer-events-none left-1/2 -translate-x-1/2">
                <div className="relative top-[-65px] md:top-[-150px] flex flex-col min-[700px]:flex-row items-center min-[700px]:items-end justify-center min-[700px]:justify-between w-full gap-4 lg:gap-8 xl:gap-12">

                    {/* Content (Left) */}
                    <div className="w-full max-w-[300px] md:max-w-md xl:max-w-2xl text-center min-[700px]:text-left">
                        <div className="space-y-6">
                            {/* Title area */}
                            <div className="flex items-end justify-center min-[700px]:justify-start">
                                <Skeleton className="w-4/5 h-10 md:h-14" rounded="lg" />
                            </div>

                            {/* Tags area */}
                            <div className="space-y-3">
                                <Skeleton className="w-2/5 h-5" rounded="md" />
                                <div className="flex gap-2 justify-center min-[700px]:justify-start">
                                    <Skeleton className="w-12 h-6" rounded="md" />
                                    <Skeleton className="w-12 h-6" rounded="md" />
                                    <Skeleton className="w-20 h-6" rounded="md" />
                                </div>
                            </div>

                            {/* Description Match (Desktop) */}
                            <div className="hidden lg:block space-y-2 max-w-lg">
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-full h-4" />
                                <Skeleton className="w-2/3 h-4" />
                            </div>

                            {/* Buttons area */}
                            <div className="hidden min-[700px]:flex items-center justify-center min-[700px]:justify-start gap-5 pt-4">
                                <Skeleton className="w-[60px] h-[60px]" rounded="full" />
                                <Skeleton className="w-[150px] h-[45px]" rounded="full" />
                            </div>
                        </div>
                    </div>

                    {/* Thumbs (Right) */}
                    <div className="w-[340px] min-[700px]:w-[400px] lg:w-[480px]">
                        <div className="flex gap-2.5 overflow-hidden">
                            {[...Array(8)].map((_, i) => (
                                <Skeleton key={i} className="flex-none w-[calc(12.5%-8.75px)] aspect-square min-[700px]:aspect-video" rounded="md" />
                            ))}
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
