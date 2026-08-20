"use client";

import React from "react";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import Container from "@/app/components/UI/Container";

export default function FeaturedSliderSkeleton() {
    return (
        <Container as="section" className="relative select-none overflow-hidden">
            {/* Header */}
            <div className="row-header flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Skeleton className="w-[200px] h-8 lg:h-9" rounded="lg" />
                    <Skeleton className="h-8 w-8 lg:h-9 lg:w-9" rounded="full" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="w-8 h-8 sm:w-9 sm:h-9" rounded="full" />
                    <Skeleton className="w-8 h-8 sm:w-9 sm:h-9" rounded="full" />
                </div>
            </div>

            {/* 3D Coverflow Stage Skeleton */}
            <div className="relative py-2 sm:py-4 flex justify-center items-center gap-4 overflow-hidden">
                <div className="hidden md:block w-1/4 aspect-[16/9] rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 opacity-30 transform scale-90" />
                <div className="w-[72vw] sm:w-[400px] md:w-[480px] lg:w-[560px] xl:w-[640px] 2xl:w-[720px] aspect-[16/9] sm:aspect-[16/8.8] md:aspect-[16/8.6] rounded-2xl sm:rounded-3xl bg-[#12151C]/60 border border-white/10 p-4 sm:p-6 flex flex-col justify-between">
                    <div className="flex gap-2">
                        <Skeleton className="w-12 h-6" rounded="md" />
                        <Skeleton className="w-12 h-6" rounded="md" />
                        <Skeleton className="w-20 h-6" rounded="md" />
                    </div>
                    <div className="space-y-2">
                        <Skeleton className="w-3/5 h-8 lg:h-9" rounded="lg" />
                        <Skeleton className="w-2/5 h-4" rounded="md" />
                    </div>
                </div>
                <div className="hidden md:block w-1/4 aspect-[16/9] rounded-2xl sm:rounded-3xl bg-white/[0.02] border border-white/5 opacity-30 transform scale-90" />
            </div>
        </Container>
    );
}
