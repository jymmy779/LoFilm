"use client";

import { useRef, HTMLAttributes } from "react";
import { useRouter } from "next/navigation";
import { Movie } from "@/app/types/movie";

interface MoviePreviewWrapperProps extends HTMLAttributes<HTMLDivElement> {
    movie: Movie;
    user?: any;
    isFirst?: boolean;
    isLast?: boolean;
    adZone?: string;
    children: React.ReactNode;
}

/**
 * Lightweight Zero-Overhead Card Wrapper with Smart Prefetching.
 * Replaced heavy hover popup with instant prefetch on hover.
 */
export default function MoviePreviewWrapper({
    movie,
    children,
    className,
    user,
    isFirst,
    isLast,
    adZone,
    onMouseEnter,
    ...props
}: MoviePreviewWrapperProps) {
    const router = useRouter();
    const prefetched = useRef(false);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (onMouseEnter) onMouseEnter(e);

        // Smart instant prefetch on hover (one-time per card)
        if (!prefetched.current && movie?.slug) {
            prefetched.current = true;
            router.prefetch(`/phim/${movie.slug}`);
        }
    };

    return (
        <div
            className={className}
            onMouseEnter={handleMouseEnter}
            {...props}
        >
            {children}
        </div>
    );
}
