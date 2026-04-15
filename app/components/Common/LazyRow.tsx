"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import Skeleton from "react-loading-skeleton";

interface LazyRowProps {
    children: ReactNode;
    // Default threshold for considering "visible"
    threshold?: number;
    // Estimated height to prevent layout shift (CLS)
    estimatedHeight?: string; 
    className?: string;
    // Optional: Hide skeleton and just use blank space
    noSkeleton?: boolean;
}

/**
 * A wrapper to lazy-render heavy row components (like Swiper rows)
 * only when they are close to the viewport.
 */
export default function LazyRow({ 
    children, 
    threshold = 0.01, 
    estimatedHeight = "400px",
    className = "",
    noSkeleton = false
}: LazyRowProps) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsIntersecting(true);
                    observer.disconnect();
                }
            },
            {
                // Tăng rootMargin lên 600px để load trước mượt mà hơn
                rootMargin: "600px 0px", 
                threshold
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    return (
        <div 
            ref={containerRef} 
            className={className} 
            style={{ minHeight: isIntersecting ? "auto" : estimatedHeight }}
        >
            {isIntersecting ? (
                children 
            ) : (
                !noSkeleton && (
                    <div className="w-full px-4 lg:px-8 mb-16 mt-8">
                        <div className="flex flex-col xl:flex-row gap-8">
                             <div className="w-full xl:w-[260px] flex-shrink-0">
                                <Skeleton height={35} width="60%" className="mb-4" />
                                <Skeleton height={15} width="40%" />
                             </div>
                             <div className="flex-1 flex gap-4 overflow-hidden">
                                 {[...Array(4)].map((_, i) => (
                                     <div key={i} className="flex-none w-[280px]">
                                         <Skeleton height={160} className="rounded-xl" />
                                     </div>
                                 ))}
                             </div>
                        </div>
                    </div>
                )
            )}
        </div>
    );
}
