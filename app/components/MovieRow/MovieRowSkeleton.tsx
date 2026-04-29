"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import MovieRowCardSkeleton from "@/app/components/MovieCard/MovieRowCardSkeleton";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function MovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/30 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 overflow-hidden">
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <Skeleton width={200} className="h-[28px] lg:h-[35px] rounded-lg" />
                    <Skeleton height={20} width={100} className="hidden md:block rounded-md" />
                </div>

                <div className="w-full xl:w-[calc(100%-292px)] overflow-hidden">
                    <div className="flex gap-[8px] md:gap-[12px] lg:gap-[14px] xl:gap-[16px]">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px]">
                                <MovieRowCardSkeleton />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
}
