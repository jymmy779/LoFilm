"use client";

import Container from "@/app/components/Container";
import Skeleton from "@/app/components/Skeleton/Skeleton";

export default function WatchLoading() {
    return (
        <main className="min-h-screen bg-[#0F1115] text-white pb-20 pt-[80px]">
            <Container>
                {/* Grid layout similar to Watch page */}
                <div className="flex flex-col lg:flex-row gap-6 md:gap-8 mt-4">
                    {/* Left Column: Player & Info */}
                    <div className="flex-1 w-full lg:max-w-[calc(100%-424px)]">
                        {/* Player Skeleton - 16:9 aspect ratio */}
                        <Skeleton className="w-full aspect-video rounded-3xl mb-6 bg-white/5" variant="pulse" />
                        
                        {/* Title & Stats */}
                        <div className="space-y-4 mb-8">
                            <Skeleton className="w-3/4 h-8" rounded="lg" />
                            <Skeleton className="w-1/2 h-5" rounded="md" />
                        </div>

                        {/* Episodes List Skeleton */}
                        <div className="bg-[#13161C] border border-white/5 rounded-3xl p-6 md:p-8 mb-8">
                            <Skeleton className="w-32 h-6 mb-6" rounded="md" />
                            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-3">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <Skeleton key={i} className="aspect-[2/1] w-full" rounded="xl" />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Sidebar (Suggested Movies) */}
                    <div className="w-full lg:w-[392px] shrink-0">
                        <div className="bg-[#13161C] border border-white/5 rounded-3xl p-6 md:p-8">
                            <Skeleton className="w-40 h-6 mb-6" rounded="md" />
                            <div className="space-y-4">
                                {Array.from({ length: 5 }).map((_, i) => (
                                    <div key={i} className="flex gap-4 items-center">
                                        <Skeleton className="w-[70px] h-[100px] shrink-0" rounded="xl" />
                                        <div className="flex-1 space-y-2">
                                            <Skeleton className="w-full h-4" rounded="md" />
                                            <Skeleton className="w-2/3 h-3" rounded="md" />
                                            <Skeleton className="w-1/2 h-3" rounded="md" />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </main>
    );
}
