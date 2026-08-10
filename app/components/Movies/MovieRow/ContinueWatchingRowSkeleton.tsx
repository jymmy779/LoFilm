import React from "react";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import Container from "@/app/components/UI/Container";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

export default function ContinueWatchingRowSkeleton() {
    return (
        <Container as="section" className="continue-watching-section relative z-30">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/40 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 relative overflow-hidden">
                {/* Background Decor subtle */}
                <div className="absolute top-0 left-0 w-32 h-32 bg-[#D497FF]/5 blur-[100px] pointer-events-none"></div>

                {/* Header */}
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <div className="space-y-2">
                        <Skeleton className="w-[120px] h-7" rounded="lg" />
                        <Skeleton className="w-20 h-3 opacity-50" rounded="sm" />
                    </div>
                    <Skeleton className="w-24 h-4 opacity-50" rounded="md" />
                </div>

                {/* Content */}
                <div className="w-full xl:w-[calc(100%-292px)] relative">
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
                                    <Skeleton className="aspect-video w-full" rounded="2xl" />

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

