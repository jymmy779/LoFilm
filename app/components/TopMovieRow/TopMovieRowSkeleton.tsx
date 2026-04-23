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
                <div className="relative overflow-hidden">
                    <div className="flex gap-[10px] md:gap-[13px] xl:gap-[15px]">
                        {[...Array(10)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[calc(50%-5px)] sm:w-[calc(33.333%-8.7px)] md:w-[calc(25%-9.75px)] lg:w-[calc(20%-10.4px)] xl:w-[calc(14.28%-12.8px)] 2xl:w-[calc(12.5%-13.1px)]">
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
