"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

// Sawtooth clip-path constants (copied from TopMovieRow.tsx)
const CLIP_PATH_EVEN = 'polygon(0% calc(5% + 16px), 1.2px calc(5% + 9.9px), 4.7px calc(5% + 4.7px), 9.9px calc(5% + 1.2px), 16px 5%, 100% 0, 100% 100%, 0% 100%)';
const CLIP_PATH_ODD = 'polygon(0 0, calc(100% - 16px) 5%, calc(100% - 9.9px) calc(5% + 1.2px), calc(100% - 4.7px) calc(5% + 4.7px), calc(100% - 1.2px) calc(5% + 9.9px), 100% calc(5% + 16px), 100% 100%, 0% 100%)';

export default function TopMovieRowSkeleton() {
    return (
        <Container as="section" className="top-movie-row-section relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            <div className="row-header flex items-center justify-between mb-8">
                <Skeleton width={200} className="h-[28px] lg:h-[35px] rounded-lg" />
            </div>

            <div className="row-content">
                <div className="relative overflow-hidden">
                    <div className="flex gap-[10px] md:gap-[13px] xl:gap-[15px]">
                        {[...Array(10)].map((_, i) => {
                            const isEven = i % 2 !== 0; // Matching logic in TopMovieRow.tsx (index % 2 !== 0)
                            return (
                                <div key={i} className="flex-shrink-0 w-[calc(50%-5px)] sm:w-[calc(33.333%-8.7px)] md:w-[calc(25%-9.75px)] lg:w-[calc(20%-10.4px)] xl:w-[calc(14.28%-12.8px)] 2xl:w-[calc(12.5%-13.1px)]">
                                    <div className="sw-item cursor-pointer mt-4">
                                        <div
                                            className="aspect-[2/3] rounded-2xl bg-white/5 border border-white/10 animate-pulse overflow-hidden mb-4"
                                            style={{
                                                WebkitClipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD,
                                                clipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD
                                            }}
                                        />
                                        <div className="flex gap-2 items-start">
                                            <div className="w-8 md:w-10 lg:w-13 h-10 bg-white/5 rounded-md animate-pulse" />
                                            <div className="flex-1 space-y-2 pt-1">
                                                <Skeleton width="80%" height={14} />
                                                <Skeleton width="40%" height={10} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
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
