"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function ContinueWatchingRowSkeleton() {
    return (
        <Container as="section" className="relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/40 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 overflow-hidden">
                {/* Header Skeleton */}
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <div>
                        <Skeleton width={120} height={28} className="rounded-lg" />
                        <Skeleton width={80} height={12} className="mt-2 rounded" />
                    </div>
                    <Skeleton width={100} height={16} className="rounded" />
                </div>

                {/* Swiper Swiper Match */}
                <div className="w-full xl:w-[calc(100%-292px)]">
                    <Swiper
                        slidesPerView={"auto"}
                        spaceBetween={12}
                        breakpoints={{
                            1280: { spaceBetween: 20 },
                            767: { spaceBetween: 16 },
                        }}
                        className="swiper-carousel"
                    >
                        {[...Array(5)].map((_, i) => (
                            <SwiperSlide key={i} className="!w-[220px] sm:!w-[260px] md:!w-[300px]">
                                <div className="aspect-video rounded-xl bg-white/5 mb-3 border border-white/5 animate-pulse" />
                                <div className="space-y-2 px-1">
                                    <Skeleton width="75%" height={16} />
                                    <Skeleton width="50%" height={12} />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </Container>
    );
}
