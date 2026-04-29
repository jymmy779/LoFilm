"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";

export default function ReunificationEventSkeleton() {
    return (
        <Container as="section" className="relative z-30">
            <div className="relative w-full rounded-[2rem] md:rounded-[2.5rem] overflow-hidden bg-black/30 border border-white/5 shadow-2xl p-5 md:p-10 lg:p-12 animate-pulse">
                {/* Banner Content Header */}
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6 mb-10 border-b border-white/5 pb-4 lg:pb-8">
                    <div className="flex flex-col items-center md:items-start gap-3 w-full md:w-auto">
                        <Skeleton width={320} height={40} borderRadius={12} baseColor="#1e293b" highlightColor="#334155" />
                        <Skeleton width={200} height={16} borderRadius={4} baseColor="#1e293b" highlightColor="#334155" />
                    </div>
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-white/5 rounded-full"></div>
                </div>

                {/* Movies Grid */}
                <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6 lg:gap-8">
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                            <div className="bg-white/5 aspect-[2/3] w-full rounded-2xl mb-3"></div>
                            <div className="h-3 bg-white/5 rounded-full w-4/5 mb-1.5"></div>
                            <div className="h-3 bg-white/5 rounded-full w-2/3"></div>
                        </div>
                    ))}
                </div>

                {/* Banner Footer */}
                <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-white/5 pt-8">
                    <div className="h-4 w-64 bg-white/5 rounded-full"></div>
                    <div className="h-10 w-32 bg-white/5 rounded-full"></div>
                </div>
            </div>
        </Container>
    );
}
