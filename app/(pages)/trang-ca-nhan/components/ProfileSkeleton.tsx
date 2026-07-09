"use client";

import React from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";

export default function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-[#0F1115] pt-27pb-16 md:pb-20 px-4">
            <div className="max-w-[1440px] mx-auto">
                {/* Header Skeleton */}
                <div className="mb-6">
                    <Skeleton className="w-[120px] h-4" rounded="md" />
                </div>
                <div className="mb-10 md:mb-12">
                    <Skeleton className="w-[240px] h-10" rounded="xl" />
                    <div className="h-1 w-20 bg-white/5 rounded-full mt-2" />
                </div>

                <div className="flex flex-col xl:flex-row items-start gap-8">
                    {/* Left block (Sidebar) */}
                    <div className="w-full lg:w-72 shrink-0">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[32px] p-6 space-y-8">
                            <div className="flex flex-col items-center">
                                <Skeleton className="w-20 h-20 md:w-24 md:h-24" rounded="full" />
                                <Skeleton className="mt-4 w-32 h-6" rounded="md" />
                                <Skeleton className="mt-2 w-24 h-4 opacity-50" rounded="md" />
                            </div>
                            <div className="space-y-2">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="w-full h-12" rounded="2xl" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Middle block (Main Content) */}
                    <div className="flex-1 w-full">
                        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8">
                            <div className="flex justify-between items-center mb-10 border-b border-white/5 pb-6">
                                <Skeleton className="h-8 w-40" rounded="lg" />
                                <Skeleton className="h-8 w-24" rounded="lg" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <Skeleton key={i} className="aspect-[2/3] w-full" rounded="2xl" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Sidebar */}
                    <aside className="w-full xl:w-[320px] shrink-0">
                        <Skeleton className="h-[500px] w-full" rounded="3xl" />
                    </aside>
                </div>
            </div>
        </div>
    );
}
