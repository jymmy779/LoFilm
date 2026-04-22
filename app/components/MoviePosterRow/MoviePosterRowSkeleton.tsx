"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import MovieCardSkeleton from "@/app/components/MovieCard/MovieCardSkeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function MoviePosterRowSkeleton() {
    return (
        <Container as="section" className="movie-row-section relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            <div className="row-header flex items-center justify-between mb-6">
                <Skeleton width={200} className="h-[28px] lg:h-[35px] rounded-lg" />
                <Skeleton width={80} height={20} className="rounded" />
            </div>

            <div className="row-content">
                <div className="relative group/slider swiper-carousel-container">
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
                                <MovieCardSkeleton />
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
