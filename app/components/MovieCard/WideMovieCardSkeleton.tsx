import React from 'react';
import Skeleton from '@/app/components/Skeleton/Skeleton';

export default function WideMovieCardSkeleton() {
    return (
        <div className="flex flex-col h-full">
            {/* Top Thumbnail (aspect 21/9) */}
            <div className="relative w-full aspect-[21/9] overflow-hidden rounded-xl bg-[#0a1628]">
                <Skeleton className="absolute inset-0" rounded="none" />
            </div>

            {/* Bottom Info Section */}
            <div className="px-3 md:px-4 pb-3 md:pb-4 flex flex-col gap-1 pt-1.5 md:pt-3 items-center md:items-start">
                {/* Title */}
                <Skeleton className="h-4 md:h-5 w-3/4 md:w-2/3" rounded="md" />
                
                {/* Origin Name */}
                <Skeleton className="h-3 w-1/2 md:w-1/3 opacity-50 mb-1" rounded="md" />

                {/* Badges: only show on md+ */}
                <div className="hidden md:flex gap-1.5">
                    <Skeleton className="h-4 w-8 opacity-30" rounded="sm" />
                    <Skeleton className="h-4 w-12 opacity-30" rounded="sm" />
                    <Skeleton className="h-4 w-8 opacity-30" rounded="sm" />
                </div>
            </div>
        </div>
    );
}
