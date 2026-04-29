"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import MovieCardSkeleton from "@/app/components/MovieCard/MovieCardSkeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function MoviePosterRowSkeleton() {
    return (
        <Container as="section" className="movie-row-section relative z-30">
            <div className="row-header flex items-center justify-between mb-6">
                <Skeleton width={200} className="h-[28px] lg:h-[35px] rounded-lg" />
                <Skeleton width={80} height={20} className="rounded" />
            </div>

            <div className="row-content">
                <div className="relative overflow-hidden">
                    <div className="flex gap-[10px] md:gap-[13px] xl:gap-[15px]">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[calc(50%-5px)] sm:w-[calc(33.333%-8.7px)] md:w-[calc(25%-9.75px)] lg:w-[calc(20%-10.4px)] xl:w-[calc(14.28%-12.8px)] 2xl:w-[calc(12.5%-13.1px)]">
                                <MovieCardSkeleton />
                            </div>
                        ))}
                    </div>
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
