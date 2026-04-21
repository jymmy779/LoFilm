"use client";

import React from 'react';

export default function MovieRowCardSkeleton() {
  return (
    <div className="block">
      {/* Thumbnail area aspect-video (16:9) */}
      <div className="relative aspect-video rounded-lg overflow-hidden skeleton-shimmer mb-3" />
      
      {/* Info area */}
      <div className="space-y-1">
        {/* Title */}
        <div className="h-[16px] md:h-[20px] w-full rounded-md skeleton-shimmer" />
        {/* Alias */}
        <div className="h-[14px] md:h-[16px] w-3/4 rounded-md skeleton-shimmer" />
      </div>
    </div>
  );
}
