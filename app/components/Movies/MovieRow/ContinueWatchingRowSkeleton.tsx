import React from "react";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import Container from "@/app/components/UI/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function ContinueWatchingRowSkeleton() {
    return (
        <Container as="section" className="continue-watching-section relative z-30">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-5 lg:gap-6 bg-[#12151C]/60 p-4 sm:p-5 md:p-6 rounded-3xl border border-white/10 relative">
                {/* Header */}
                <div className="w-full xl:w-[230px] xl:flex-shrink-0 flex items-center xl:items-start xl:flex-col justify-between xl:justify-center gap-3 pb-3 xl:pb-0 border-b border-white/5 xl:border-b-0">
                    <div className="space-y-1.5">
                        <Skeleton className="w-[100px] sm:w-[120px] h-5 sm:h-7" rounded="lg" />
                        <Skeleton className="w-16 sm:w-20 h-2.5 sm:h-3 opacity-50" rounded="sm" />
                    </div>
                    <div className="flex xl:flex-col gap-2">
                        <Skeleton className="w-20 sm:w-24 h-6 sm:h-7 opacity-50" rounded="md" />
                    </div>
                </div>

                {/* Content */}
                <div className="w-full xl:w-[calc(100%-264px)] relative">
                    <Swiper
                        slidesPerView={2}
                        spaceBetween={8}
                        breakpoints={{
                            640: { slidesPerView: 2.5, spaceBetween: 10 },
                            768: { slidesPerView: 3.2, spaceBetween: 10 },
                            1024: { slidesPerView: 3.5, spaceBetween: 12 },
                            1280: { slidesPerView: 4.2, spaceBetween: 14 },
                            1536: { slidesPerView: 4.5, spaceBetween: 14 },
                        }}
                    >
                        {[...Array(5)].map((_, i) => (
                            <SwiperSlide key={i}>
                                <div className="block w-full">
                                    {/* Video poster card (aspect 16:9 landscape) */}
                                    <Skeleton className="aspect-video w-full" rounded="xl" />

                                    {/* Title & Progress info */}
                                    <div className="mt-2.5 px-0.5 space-y-2">
                                        <Skeleton className="w-3/4 h-3.5" rounded="md" />
                                        <div className="flex items-center justify-between">
                                            <Skeleton className="w-16 h-2.5 opacity-50" rounded="sm" />
                                            <Skeleton className="w-8 h-2.5 opacity-50" rounded="sm" />
                                        </div>
                                        <Skeleton className="h-1 w-full opacity-40" rounded="full" />
                                    </div>
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>
                </div>
            </div>
        </Container>
    );
}

