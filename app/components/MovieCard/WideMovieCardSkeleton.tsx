"use client";

import React from 'react';

export default function WideMovieCardSkeleton() {
  return (
    <div className="relative aspect-[21/9] rounded-xl md:rounded-2xl overflow-hidden skeleton-shimmer border border-white/5">
      {/* Background layer */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-transparent z-10" />
      
      {/* Overlaid Content Info Mockup */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4 flex flex-col justify-end z-20 space-y-2">
        <div className="h-4 md:h-5 w-2/3 rounded-md skeleton-shimmer opacity-50" />
        <div className="flex justify-between items-center">
            <div className="h-3 w-1/3 rounded-md skeleton-shimmer opacity-30" />
            <div className="flex gap-2">
                <div className="h-5 w-8 rounded-md skeleton-shimmer opacity-30" />
                <div className="h-5 w-12 rounded-md skeleton-shimmer opacity-40" />
            </div>
        </div>
      </div>
    </div>
  );
}
