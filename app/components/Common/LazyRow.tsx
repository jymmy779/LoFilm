"use client";

import { useEffect, useState, useRef, ReactNode } from "react";

interface LazyRowProps {
    children: ReactNode;
    // Default threshold for considering "visible"
    threshold?: number;
    // Estimated height to prevent layout shift (CLS)
    estimatedHeight?: string; 
    className?: string;
}

/**
 * A wrapper to lazy-render heavy row components (like Swiper rows)
 * only when they are close to the viewport.
 * Helps with: "Minimize main-thread work" and "Reduce JavaScript execution time".
 */
export default function LazyRow({ 
    children, 
    threshold = 0.1, 
    estimatedHeight = "400px",
    className = "" 
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
                rootMargin: "300px 0px", // Load 300px before appearing
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
            {isIntersecting ? children : null}
        </div>
    );
}
