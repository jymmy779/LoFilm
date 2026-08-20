import React from "react";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import Container from "@/app/components/UI/Container";

export default function MovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-5 lg:gap-6 bg-[#12151C]/60 p-4 sm:p-5 md:p-6 rounded-3xl border border-white/5 overflow-hidden">
                {/* Left Hub Skeleton */}
                <div className="w-full xl:w-[270px] xl:flex-shrink-0 flex flex-col justify-between p-5 rounded-2xl bg-white/[0.02] border border-white/5 min-h-[170px] xl:min-h-[235px] space-y-3">
                    <div className="space-y-2">
                        <Skeleton className="w-24 h-6" rounded="full" />
                        <Skeleton className="w-40 h-8" rounded="lg" />
                        <Skeleton className="w-32 h-4 opacity-50" rounded="md" />
                    </div>
                    <div className="pt-3">
                        <Skeleton className="w-36 h-9" rounded="full" />
                    </div>
                </div>

                {/* Right Slider Skeleton */}
                <div className="w-full xl:w-[calc(100%-294px)] overflow-hidden">
                    <div className="flex gap-2 sm:gap-3">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex-shrink-0 w-[180px] sm:w-[220px] md:w-[255px] lg:w-[285px] space-y-2">
                                <Skeleton className="aspect-[16/10] w-full" rounded="2xl" />
                                <Skeleton className="w-full h-4" rounded="md" />
                                <Skeleton className="w-2/3 h-3 opacity-50" rounded="md" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Container>
    );
}
