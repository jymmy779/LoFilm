import React from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import Container from "@/app/components/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function ContinueWatchingRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-white/[0.02] p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 overflow-hidden">
                {/* Header */}
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="w-[120px] h-7" rounded="lg" />
                        <Skeleton className="w-20 h-3 opacity-50" rounded="sm" />
                    </div>
                    <Skeleton className="w-24 h-4 opacity-50" rounded="md" />
                </div>

                {/* Content */}
                <div className="w-full xl:w-[calc(100%-292px)]">
                    <Swiper
                        slidesPerView={"auto"}
                        spaceBetween={12}
                        breakpoints={{
                            1280: { spaceBetween: 20 },
                            767: { spaceBetween: 16 },
                        }}
                    >
                        {[...Array(4)].map((_, i) => (
                            <SwiperSlide key={i} className="!w-[220px] sm:!w-[260px] md:!w-[300px]">
                                <Skeleton className="aspect-video mb-3" rounded="xl" />
                                <div className="space-y-2 px-1">
                                    <Skeleton className="w-3/4 h-4" />
                                    <Skeleton className="w-1/2 h-3 opacity-50" />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </Container>
    );
}
