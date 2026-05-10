import React from 'react';
import Skeleton from '@/app/components/Skeleton/Skeleton';

export default function MovieRowCardSkeleton() {
  return (
    <div className="block">
      {/* Thumbnail area */}
      <Skeleton className="relative aspect-video mb-3" rounded="lg" />
      
      {/* Info area */}
      <div className="space-y-2">
        <Skeleton className="h-4 md:h-5 w-full" rounded="md" />
        <Skeleton className="h-3 md:h-4 w-3/4 opacity-50" rounded="md" />
      </div>
    </div>
  );
}
