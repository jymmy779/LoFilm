"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function FeaturedSliderSkeleton() {
    return (
        <Container as="section" className="relative">
            <div className="row-header flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Skeleton width={200} className="rounded-lg h-[28px] lg:h-[35px]" />
                    <div className="h-8 w-8 lg:h-10 lg:w-10 rounded-full bg-white/5 animate-pulse" />
                </div>
            </div>

            <div className="relative mb-42 group">
                <Swiper slidesPerView={1} className="featured-section-slider rounded-[30px] overflow-hidden">
                    <SwiperSlide>
                        <div className="relative w-full aspect-[21/9] md:aspect-[21/7] lg:aspect-[21/6] xl:aspect-[21/5] min-h-[500px] bg-slate-900 animate-pulse">
                            <div className="absolute inset-0 bg-gradient-to-t xl:bg-gradient-to-r from-[#14233E] via-[#14233E] via-[30%] to-transparent z-10" />
                            <div className="relative z-20 w-full xl:w-[60%] h-full flex items-end xl:items-center px-5 md:px-10 text-left">
                                <div className="lg:max-w-lg xl:max-w-2xl w-full space-y-4 lg:space-y-5">
                                    <div className="space-y-2">
                                        <Skeleton width="60%" height={24} baseColor="#1e293b" highlightColor="#334155" />
                                        <Skeleton width="40%" height={16} baseColor="#1e293b" />
                                    </div>
                                    <div className="flex gap-3">
                                        <div className="w-12 h-6 bg-white/5 rounded" />
                                        <div className="w-12 h-6 bg-white/5 rounded" />
                                        <div className="w-20 h-6 bg-white/5 rounded" />
                                    </div>
                                    <div className="space-y-2">
                                        <Skeleton width="90%" height={12} baseColor="#1e293b" />
                                        <Skeleton width="70%" height={12} baseColor="#1e293b" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                </Swiper>

                {/* Thumb dots simulation matching FeaturedSlider.tsx */}
                <div className="featured-thumbs-container absolute -bottom-10 lg:bottom-15 xl:bottom-0 left-1/2 lg:left-[390px] xl:left-1/2 -translate-x-1/2 translate-y-1/2 z-40 w-full lg:max-w-3xl xl:max-w-7xl px-4">
                    <div className="flex justify-center lg:justify-start gap-5">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="w-2.5 h-2.5 lg:w-16 lg:aspect-[2/3] rounded-full lg:rounded-lg bg-white/10 animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
}
