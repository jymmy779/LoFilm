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
    // Optional: Custom skeleton component
    skeleton?: ReactNode;
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
    noSkeleton = false,
    skeleton
}: LazyRowProps) {
    const [isIntersecting, setIsIntersecting] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
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
                // Giảm rootMargin trên mobile để tránh load quá nhiều thứ cùng lúc
                rootMargin: typeof window !== 'undefined' && window.innerWidth < 768 ? "300px 0px" : "600px 0px",
                threshold
            }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [threshold]);

    useEffect(() => {
        if (isIntersecting) {
            // Trên mobile, trì hoãn việc mount nội dung thật cho đến khi main thread rảnh rỗi 
            // hoặc sau một khoảng thời gian ngắn để tránh chặn animation cuộn.
            if ('requestIdleCallback' in window) {
                const idleId = window.requestIdleCallback(() => setShouldRender(true), { timeout: 500 });
                return () => window.cancelIdleCallback(idleId);
            } else {
                const timeoutId = setTimeout(() => setShouldRender(true), 150);
                return () => clearTimeout(timeoutId);
            }
        }
    }, [isIntersecting]);

    return (
        <div
            ref={containerRef}
            className={`${className} lazy-section optimize-render`}
            style={{ 
                minHeight: isIntersecting ? "auto" : estimatedHeight,
                containIntrinsicSize: `1px ${estimatedHeight}`
            }}
        >
            {shouldRender ? (
                children
            ) : (
                !noSkeleton && (
                    skeleton ? skeleton : (
                        <div className="w-full px-5 lg:px-12 mb-8 md:mb-12 lg:mb-16 mt-8">
                            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-black/30 p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="w-full xl:w-[260px] flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                                    <Skeleton width={200} className="h-[28px] lg:h-[35px] rounded-lg" />
                                    <Skeleton height={20} width={100} className="hidden md:block rounded-md" />
                                </div>
                                <div className="flex-1 flex gap-2 sm:gap-3 md:gap-3.5 lg:gap-4 overflow-hidden">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="flex-none w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px]">
                                            <div className="aspect-video rounded-lg skeleton-shimmer mb-3" />
                                            <div className="space-y-1">
                                                <div className="h-[16px] md:h-[20px] w-full rounded-md skeleton-shimmer" />
                                                <div className="h-[14px] md:h-[16px] w-3/4 rounded-md skeleton-shimmer" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )
                )
            )}
        </div>
    );
}
