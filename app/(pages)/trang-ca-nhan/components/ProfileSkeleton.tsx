"use client";

import React from "react";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";

export default function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-[#111b33] to-[#0d162b] pt-30 md:pt-40 pb-16 md:pb-20 px-4">
            <div className="max-w-[1440px] mx-auto">
                {/* Header Skeleton */}
                <div className="mb-10 md:mb-12 w-full">
                    <div className="h-10 w-48 bg-white/5 rounded-lg animate-pulse" />
                </div>

                <div className="flex flex-col xl:flex-row items-start gap-8">
                    {/* Left + Middle block */}
                    <div className="flex-1 flex flex-col lg:flex-row items-start gap-6 md:gap-8 w-full">
                        {/* Sidebar Navigation Skeleton */}
                        <div className="w-full lg:w-72 shrink-0">
                            <div className="bg-[#16213e] border border-white/5 rounded-3xl md:rounded-[32px] p-6 h-[450px] animate-pulse">
                                <div className="flex flex-col items-center mb-8">
                                    <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-white/5" />
                                    <div className="mt-4 w-32 h-6 bg-white/5 rounded-md" />
                                    <div className="mt-2 w-24 h-4 bg-white/5 rounded-md" />
                                </div>
                                <div className="space-y-3">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="w-full h-12 bg-white/5 rounded-xl" />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Main Content Area Skeleton */}
                        <div className="flex-1 min-h-[400px] lg:min-h-[600px] lg:w-auto w-full">
                            <div className="bg-[#16213e] border border-white/5 rounded-3xl md:rounded-[40px] p-6 lg:p-10 h-[600px] animate-pulse">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="h-8 w-40 bg-white/5 rounded-lg" />
                                    <div className="h-8 w-24 bg-white/5 rounded-lg" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="h-32 bg-white/5 rounded-2xl" />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar Skeleton */}
                    <aside className="w-full xl:w-[320px] shrink-0">
                        <div className="bg-[#16213e] border border-white/5 rounded-3xl p-6 h-[500px] animate-pulse" />
                    </aside>
                </div>
            </div>
        </div>
    );
}
