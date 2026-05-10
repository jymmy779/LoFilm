"use client";

import { useEffect, useState, useRef, ReactNode } from "react";
import Skeleton from "@/app/components/Skeleton/Skeleton";

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
    // Optional: Unique ID to persist render state across navigations
    id?: string;
}

/**
 * Global registry to track which lazy rows have already been rendered
 * during the current session. This prevents "re-loading" skeletons
 * when navigating back to the home page.
 */
const renderedRows = new Set<string>();

export default function LazyRow({
    children,
    threshold = 0.01,
    estimatedHeight = "400px",
    className = "",
    noSkeleton = false,
    skeleton,
    id
}: LazyRowProps) {
    const [isIntersecting, setIsIntersecting] = useState(() => id ? renderedRows.has(id) : false);
    const [shouldRender, setShouldRender] = useState(() => id ? renderedRows.has(id) : false);
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
                // Tăng rootMargin để load sớm hơn, tránh bị khoảng trống khi scroll nhanh
                rootMargin: typeof window !== 'undefined' && window.innerWidth < 768 ? "800px 0px" : "1500px 0px",
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
            if (id) renderedRows.add(id);
            
            const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

            if (!isMobile) {
                // Trên desktop, mount ngay để mượt mà nhất
                setShouldRender(true);
                return;
            }

            // Trên mobile, vẫn giữ một chút trì hoãn nhẹ để tránh giật lag scroll
            if ('requestIdleCallback' in window) {
                const idleId = window.requestIdleCallback(() => setShouldRender(true), { timeout: 200 });
                return () => window.cancelIdleCallback(idleId);
            } else {
                const timeoutId = setTimeout(() => setShouldRender(true), 50);
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
                        <div className="w-full px-5 lg:px-12">
                            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-white/[0.02] p-4 md:p-6 lg:p-8 rounded-2xl border border-white/5 overflow-hidden">
                                <div className="w-full xl:w-[260px] flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                                    <Skeleton className="w-[200px] h-8 lg:h-10" rounded="lg" />
                                    <Skeleton className="w-24 h-5 hidden md:block" rounded="md" />
                                </div>
                                <div className="flex-1 flex gap-2 sm:gap-3 md:gap-3.5 lg:gap-4 overflow-hidden">
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex-none w-[160px] sm:w-[200px] md:w-[240px] lg:w-[280px] space-y-3">
                                            <Skeleton className="aspect-video" rounded="lg" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 md:h-5 w-full" />
                                                <Skeleton className="h-3 md:h-4 w-3/4 opacity-50" />
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
