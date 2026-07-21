"use client";

import Skeleton from "@/app/components/Skeleton/Skeleton";

export default function TopicsSkeleton() {
    return (
        <div className="w-full min-h-screen bg-[#0F1115] pt-[120px] pb-20">
            <div className="max-w-[1200px] mx-auto px-4 xl:px-0">
                <div className="flex flex-col items-center mb-10 mt-6">
                    <Skeleton className="w-48 h-10 mb-3" rounded="xl" />
                    <Skeleton className="w-[500px] max-w-full h-5" rounded="md" />
                </div>
 
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div
                            key={i}
                            className="relative overflow-hidden rounded-[20px] h-[150px] md:h-[180px] bg-white/5 border border-white/5 p-5 md:p-6 flex flex-col justify-between"
                        >
                            <Skeleton className="w-9 h-9" rounded="lg" />
                            <div className="space-y-2 mt-auto">
                                <Skeleton className="w-3/4 h-6" rounded="md" />
                                <Skeleton className="w-1/3 h-4" rounded="md" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
