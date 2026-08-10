import React from 'react';
import Skeleton from '@/app/components/UI/Skeleton/Skeleton';

export default function MovieRowCardSkeleton() {
  return (
    <div className="w-full">
      {/* Thumbnail area */}
      <Skeleton className="w-full aspect-video mb-3" rounded="xl" />
      
      {/* Info area */}
      <div className="space-y-0.5">
        <Skeleton className="w-3/4 h-5" rounded="md" />
        <Skeleton className="w-1/2 h-4" rounded="md" />
      </div>
    </div>
  );
}
