"use client";

import React from "react";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import Container from "@/app/components/UI/Container";

export default function HeroSliderSkeleton() {
    return (
        <section className="w-full relative h-[480px] sm:h-[560px] md:h-[680px] lg:h-[780px] xl:h-[840px] overflow-hidden bg-[#0F1115]">
            {/* Background shimmer */}
            <div className="absolute inset-0">
                <Skeleton className="w-full h-full" rounded="none" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/50 to-transparent" />
            </div>

            {/* Foreground Content Skeleton */}
            <div className="absolute inset-0 z-20 flex flex-col justify-end">
                <Container className="w-full pb-6 sm:pb-8 md:pb-12 xl:pb-14">
                    <div className="max-w-2xl lg:max-w-3xl xl:max-w-4xl space-y-4">
                        {/* Badges */}
                        <div className="flex gap-2">
                            <Skeleton className="w-12 h-6" rounded="md" />
                            <Skeleton className="w-14 h-6" rounded="md" />
                            <Skeleton className="w-16 h-6" rounded="md" />
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Skeleton className="w-4/5 h-9 sm:h-12 md:h-14" rounded="lg" />
                            <Skeleton className="w-2/5 h-4 sm:h-5 opacity-60" rounded="md" />
                        </div>

                        {/* Categories */}
                        <div className="hidden sm:flex gap-2">
                            <Skeleton className="w-20 h-6" rounded="full" />
                            <Skeleton className="w-20 h-6" rounded="full" />
                            <Skeleton className="w-20 h-6" rounded="full" />
                        </div>

                        {/* Description */}
                        <div className="hidden md:block space-y-2 max-w-xl">
                            <Skeleton className="w-full h-4 opacity-50" rounded="sm" />
                            <Skeleton className="w-3/4 h-4 opacity-50" rounded="sm" />
                        </div>

                        {/* Buttons */}
                        <div className="flex items-center gap-3 pt-2">
                            <Skeleton className="w-32 sm:w-36 h-10 sm:h-12" rounded="full" />
                            <Skeleton className="w-24 sm:w-28 h-10 sm:h-12" rounded="full" />
                            <Skeleton className="w-10 sm:w-12 h-10 sm:h-12" rounded="full" />
                        </div>

                        {/* Pills */}
                        <div className="hidden sm:flex gap-2 pt-4">
                            {[...Array(6)].map((_, i) => (
                                <Skeleton key={i} className="flex-1 h-10" rounded="xl" />
                            ))}
                        </div>
                    </div>
                </Container>
            </div>
        </section>
    );
}
