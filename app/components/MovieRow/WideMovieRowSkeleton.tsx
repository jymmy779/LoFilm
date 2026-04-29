"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import WideMovieCardSkeleton from "@/app/components/MovieCard/WideMovieCardSkeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function WideMovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="row-header flex items-center justify-between mb-4 md:mb-6">
                <Skeleton width={200} className="h-7 lg:h-10 rounded-lg" />
                <Skeleton width={80} height={20} className="rounded" />
            </div>

            <div className="row-content">
                <div className="relative overflow-hidden">
                    <div className="flex gap-[10px] md:gap-[16px] xl:gap-[20px]">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[calc(83.33%-8.3px)] sm:w-[calc(66.666%-8px)] md:w-[calc(47.6%-7.6px)] lg:w-[calc(38.4%-11.2px)] xl:w-[calc(31.25%-13.7px)] 2xl:w-[calc(27.7%-14.4px)]">
                                <div className="block relative overflow-hidden rounded-xl md:rounded-2xl bg-white/5 border border-white/5">
                                    <WideMovieCardSkeleton />
                                </div>
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
