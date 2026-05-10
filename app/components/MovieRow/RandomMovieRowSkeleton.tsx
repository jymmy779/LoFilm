import React from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";
import Container from "@/app/components/Container";

export default function RandomMovieRowSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-5">
                <Skeleton className="w-[200px] h-6" rounded="md" />
                <Skeleton className="w-10 h-10" rounded="full" />
            </div>

            {/* Mood Tabs */}
            <div className="mb-6 overflow-hidden">
                <div className="flex gap-[10px] md:gap-[14px] xl:gap-[16px]">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[calc(40%-6px)] sm:w-[calc(30%-8.4px)] md:w-[calc(23.8%-10.7px)] xl:w-[calc(19.2%-12.9px)] 2xl:w-[calc(16.1%-13.4px)] pt-2 pb-2">
                            <Skeleton className="w-full min-h-[95px] md:min-h-[115px]" rounded="xl" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Movies Swiper */}
            <div className="relative overflow-hidden">
                <div className="flex gap-[10px] md:gap-[14px] xl:gap-[16px]">
                    {[...Array(10)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 w-[calc(40%-6px)] sm:w-[calc(28.5%-8.5px)] md:w-[calc(22.2%-10.8px)] lg:w-[calc(15.3%-11.8px)] xl:w-[calc(11.7%-14px)] 2xl:w-[calc(9.5%-14.4px)]">
                            <Skeleton className="aspect-[2/3] w-full" rounded="lg" />
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}
