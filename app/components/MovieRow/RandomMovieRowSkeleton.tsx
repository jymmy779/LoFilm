"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function RandomMovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            {/* Header Match */}
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
                <Skeleton width={200} className="h-6 rounded-md" />
                <Skeleton circle width={40} height={40} />
            </div>

            {/* Mood Tabs Swiper Match */}
            <div className="mb-6">
                <Swiper
                    spaceBetween={10}
                    slidesPerView={2.5}
                    breakpoints={{
                        640: { slidesPerView: 3.3, spaceBetween: 12 },
                        768: { slidesPerView: 4.2, spaceBetween: 14 },
                        1280: { slidesPerView: 5.2, spaceBetween: 16 },
                        1480: { slidesPerView: 6.2, spaceBetween: 16 },
                    }}
                    className="rounded-xl overflow-visible"
                >
                    {[...Array(8)].map((_, i) => (
                        <SwiperSlide key={i} className="pt-2 pb-2">
                            <div className="w-full min-h-[95px] md:min-h-[115px] bg-white/5 rounded-xl animate-pulse" />
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            {/* Movies Swiper Match */}
            <div className="relative">
                <Swiper
                    spaceBetween={10}
                    slidesPerView={2.5}
                    breakpoints={{
                        640: { slidesPerView: 3.5, spaceBetween: 12 },
                        768: { slidesPerView: 4.5, spaceBetween: 14 },
                        1024: { slidesPerView: 6.5, spaceBetween: 14 },
                        1280: { slidesPerView: 8.5, spaceBetween: 16 },
                        1536: { slidesPerView: 10.5, spaceBetween: 16 },
                    }}
                    className="rounded-xl overflow-visible"
                >
                    {[...Array(12)].map((_, i) => (
                        <SwiperSlide key={i}>
                            <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </Container>
    );
}
