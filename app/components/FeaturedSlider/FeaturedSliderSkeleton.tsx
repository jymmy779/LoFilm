"use client";

import React from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import Container from "@/app/components/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function FeaturedSliderSkeleton() {
    return (
        <Container as="section" className="relative">
            <div className="row-header flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Skeleton className="w-[200px] h-8 lg:h-10" rounded="lg" />
                    <Skeleton className="h-8 w-8 lg:h-10 lg:w-10" rounded="full" />
                </div>
            </div>

            <div className="relative mb-42 group">
                <Swiper slidesPerView={1} className="featured-section-slider rounded-[30px] overflow-hidden">
                    <SwiperSlide>
                        <div className="relative w-full aspect-[21/9] md:aspect-[21/7] lg:aspect-[21/6] xl:aspect-[21/5] min-h-[500px] bg-[#0a1628]">
                            <div className="absolute inset-0 bg-gradient-to-t xl:bg-gradient-to-r from-[#0a1628] via-[#0a1628] via-[30%] to-transparent z-10" />
                            <div className="absolute inset-0 z-20 w-full xl:w-[60%] flex items-end xl:items-center px-5 md:px-10 text-left">
                                <div className="lg:max-w-lg xl:max-w-2xl w-full space-y-6">
                                    <div className="space-y-3">
                                        <Skeleton className="w-3/5 h-8 lg:h-10" rounded="lg" />
                                        <Skeleton className="w-2/5 h-5" rounded="md" />
                                    </div>
                                    <div className="flex gap-3">
                                        <Skeleton className="w-12 h-6" rounded="md" />
                                        <Skeleton className="w-12 h-6" rounded="md" />
                                        <Skeleton className="w-20 h-6" rounded="md" />
                                    </div>
                                    <div className="space-y-2 hidden md:block">
                                        <Skeleton className="w-4/5 h-4" />
                                        <Skeleton className="w-2/3 h-4" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SwiperSlide>
                </Swiper>

                {/* Thumb dots simulation */}
                <div className="featured-thumbs-container absolute -bottom-10 lg:bottom-15 xl:bottom-0 left-1/2 lg:left-[390px] xl:left-1/2 -translate-x-1/2 translate-y-1/2 z-40 w-full lg:max-w-3xl xl:max-w-7xl px-4">
                    <div className="flex justify-center lg:justify-start gap-5">
                        {[...Array(8)].map((_, i) => (
                            <Skeleton key={i} className="w-2.5 h-2.5 lg:w-16 lg:aspect-[2/3]" rounded="full" />
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
}
