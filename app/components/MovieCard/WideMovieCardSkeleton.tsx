import React from 'react';
import Skeleton from '@/app/components/Skeleton/Skeleton';

export default function WideMovieCardSkeleton() {
  return (
    <div className="relative aspect-[21/9] rounded-xl md:rounded-2xl overflow-hidden border border-white/5">
      {/* Background layer */}
      <Skeleton className="absolute inset-0" rounded="none" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1628] via-transparent to-transparent z-10" />
      
      {/* Overlaid Content */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 flex flex-col justify-end z-20 space-y-3">
        <Skeleton className="h-4 md:h-5 w-2/3" rounded="md" />
        <div className="flex justify-between items-center">
            <Skeleton className="h-3 w-1/3 opacity-50" rounded="md" />
            <div className="flex gap-2">
                <Skeleton className="h-5 w-8 opacity-30" rounded="md" />
                <Skeleton className="h-5 w-12 opacity-40" rounded="md" />
            </div>
        </div>
      </div>
    </div>
  );
}
