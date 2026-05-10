import React from 'react';
import Skeleton from '@/app/components/Skeleton/Skeleton';

export default function MovieCardSkeleton() {
  return (
    <div className="sw-item relative block">
      {/* Poster area */}
      <Skeleton className="v-thumbnail relative aspect-[2/3] mb-3" rounded="2xl" />
      
      {/* Info area */}
      <div className="info text-center space-y-2">
        <Skeleton className="h-[18px] lg:h-[20px] w-3/4 mx-auto" rounded="md" />
        <Skeleton className="h-[14px] w-1/2 mx-auto opacity-50" rounded="md" />
      </div>
    </div>
  );
}
