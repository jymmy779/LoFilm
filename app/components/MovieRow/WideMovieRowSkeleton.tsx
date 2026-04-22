"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import WideMovieCardSkeleton from "@/app/components/MovieCard/WideMovieCardSkeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function WideMovieRowSkeleton() {
    return (
        <Container as="section" className="cards-row cards-slide wide relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            <div className="row-header flex items-center justify-between mb-4 md:mb-6">
                <Skeleton width={200} className="h-7 lg:h-10 rounded-lg" />
                <Skeleton width={80} height={20} className="rounded" />
            </div>

            <div className="row-content">
                <div className="relative group/slider">
                    <Swiper
                        slidesPerView={1.2}
                        spaceBetween={10}
                        breakpoints={{
                            480: { slidesPerView: 1.5, spaceBetween: 12 },
                            640: { slidesPerView: 2.1, spaceBetween: 14 },
                            1024: { slidesPerView: 2.6, spaceBetween: 16 },
                            1440: { slidesPerView: 3.2, spaceBetween: 20 },
                            1600: { slidesPerView: 3.6, spaceBetween: 20 }
                        }}
                        className="swiper-carousel"
                    >
                        {[...Array(6)].map((_, i) => (
                            <SwiperSlide key={i}>
                                <div className="block relative overflow-hidden rounded-xl md:rounded-2xl bg-white/5 border border-white/5">
                                    <WideMovieCardSkeleton />
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
