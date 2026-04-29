"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function RandomMovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            {/* Header Match */}
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
                <Skeleton width={200} className="h-6 rounded-md" />
                <Skeleton circle width={40} height={40} />
            </div>

            {/* Mood Tabs Match */}
            <div className="mb-6 overflow-hidden">
                <div className="flex gap-[10px] md:gap-[14px] xl:gap-[16px]">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[calc(40%-6px)] sm:w-[calc(30%-8.4px)] md:w-[calc(23.8%-10.7px)] xl:w-[calc(19.2%-12.9px)] 2xl:w-[calc(16.1%-13.4px)] pt-2 pb-2">
                            <div className="w-full min-h-[95px] md:min-h-[115px] bg-white/5 rounded-xl animate-pulse" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Movies Swiper Match */}
            <div className="relative overflow-hidden">
                <div className="flex gap-[10px] md:gap-[14px] xl:gap-[16px]">
                    {[...Array(12)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[calc(40%-6px)] sm:w-[calc(28.5%-8.5px)] md:w-[calc(22.2%-10.8px)] lg:w-[calc(15.3%-11.8px)] xl:w-[calc(11.7%-14px)] 2xl:w-[calc(9.5%-14.4px)]">
                            <div className="aspect-[2/3] rounded-lg bg-white/5 animate-pulse relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}
