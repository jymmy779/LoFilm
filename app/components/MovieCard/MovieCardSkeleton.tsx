"use client";

import React from 'react';

export default function MovieCardSkeleton() {
  return (
    <div className="sw-item relative block">
      {/* Poster area matching aspect-[2/3] */}
      <div className="v-thumbnail relative aspect-[2/3] rounded-2xl overflow-hidden mb-3 skeleton-shimmer" />
      
      {/* Info area */}
      <div className="info text-center space-y-1">
        {/* Title (text-sm/base) */}
        <div className="h-[18px] lg:h-[22px] w-3/4 mx-auto rounded-md skeleton-shimmer" />
        {/* Alias (text-xs) */}
        <div className="h-[14px] w-1/2 mx-auto rounded-md skeleton-shimmer" />
      </div>
    </div>
  );
}
