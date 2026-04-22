"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";

export default function HeroSliderSkeleton() {
    return (
        <section className="w-full relative h-[500px] md:h-[700px] lg:h-[850px] overflow-hidden bg-[#0a1628]">
            {/* Background shimmer */}
            <div className="absolute inset-0">
                <Skeleton className="w-full h-full block" containerClassName="h-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/60 to-transparent" />
            </div>

            {/* Combined Content & Thumbs Overlay Match */}
            <Container className="absolute inset-x-0 bottom-0 z-30 pb-16 pointer-events-none left-1/2 -translate-x-1/2">
                <div className="relative top-[-65px] md:top-[-150px] flex flex-col min-[700px]:flex-row items-center min-[700px]:items-end justify-center min-[700px]:justify-between w-full gap-4 lg:gap-8 xl:gap-12">
                    
                    {/* Content (Left) */}
                    <div className="w-full max-w-[300px] md:max-w-md xl:max-w-2xl text-center min-[700px]:text-left">
                        <div className="space-y-4">
                            {/* Title area Match */}
                            <div className="min-h-[76px] m-0 md:mb-[16px] flex items-end justify-center min-[700px]:justify-start">
                                <Skeleton width="80%" className="h-8 md:h-12 lg:h-14 rounded-lg" />
                            </div>

                            {/* Origin name & Tags area Match */}
                            <div className="space-y-2 md:mb-[16px] mb-0">
                                <Skeleton width="40%" height={20} className="rounded" />
                                <div className="flex gap-2 justify-center min-[700px]:justify-start h-7">
                                    <Skeleton width={50} height={24} className="rounded" />
                                    <Skeleton width={50} height={24} className="rounded" />
                                    <Skeleton width={80} height={24} className="rounded" />
                                </div>
                            </div>

                            {/* Description area Match (Desktop only) */}
                            <div className="min-h-[60px] lg:block hidden max-w-lg mx-auto lg:mx-0">
                                <Skeleton count={3} className="mb-2" />
                            </div>

                            {/* Buttons area Match */}
                            <div className="flex hidden min-[700px]:flex items-center justify-center min-[700px]:justify-start gap-5 pt-4">
                                <Skeleton circle width={60} height={60} />
                                <Skeleton width={150} height={45} className="rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* Thumbs (Right) */}
                    <div className="w-[340px] min-[700px]:w-[400px] lg:w-[480px] min-h-[44px] min-[700px]:min-h-[32px] lg:min-h-[52px]">
                        <div className="flex gap-2.5 overflow-hidden">
                            {[...Array(8)].map((_, i) => (
                                <div key={i} className="flex-none w-[calc(12.5%-8.75px)] aspect-square min-[700px]:aspect-video rounded-full min-[700px]:rounded bg-white/5 border border-white/10" />
                            ))}
                        </div>
                    </div>
                </div>
            </Container>
        </section>
    );
}
