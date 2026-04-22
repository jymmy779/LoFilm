"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function TopMovieRowSkeleton() {
    return (
        <Container as="section" className="top-movie-row-section relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            <div className="row-header flex items-center justify-between mb-8">
                <Skeleton width={200} className="h-[28px] lg:h-[35px] rounded-lg" />
            </div>

            <div className="row-content">
                <div className="relative group/slider">
                    <Swiper
                        slidesPerView={2}
                        spaceBetween={10}
                        breakpoints={{
                            640: { slidesPerView: 3, spaceBetween: 13 },
                            768: { slidesPerView: 4, spaceBetween: 13 },
                            1024: { slidesPerView: 5, spaceBetween: 13 },
                            1200: { slidesPerView: 6, spaceBetween: 13 },
                            1400: { slidesPerView: 7, spaceBetween: 15 },
                            1536: { slidesPerView: 8, spaceBetween: 15 }
                        }}
                        className="swiper-carousel"
                    >
                        {[...Array(10)].map((_, i) => (
                            <SwiperSlide key={i}>
                                <div className="sw-item cursor-pointer mt-4">
                                    <div className="aspect-[2/3] rounded-2xl bg-white/5 border border-white/5 animate-pulse overflow-hidden mb-4" />
                                    <div className="flex gap-2 items-start">
                                        <div className="w-8 md:w-10 lg:w-13 h-10 bg-white/5 rounded-md animate-pulse" />
                                        <div className="flex-1 space-y-2 pt-1">
                                            <Skeleton width="80%" height={14} />
                                            <Skeleton width="40%" height={10} />
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>

            <style jsx global>{`
                .swiper-carousel .swiper-wrapper {
                    padding-bottom: 20px;
                    padding-top: 5px;
                }
            `}</style>
        </Container>
    );
}
