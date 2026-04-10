"use client";

import { useState, useRef, useEffect, HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { Movie } from "@/app/types/movie";
import MoviePreviewPopup from "./MoviePreviewPopup";
import { getImageUrl } from "@/app/utils/movieUtils";

// Biến global để quản lý việc chỉ hiện duy nhất 1 popup trên toàn trang
let activePopupCloser: (() => void) | null = null;

interface MoviePreviewWrapperProps extends HTMLAttributes<HTMLDivElement> {
    movie: Movie;
    user?: any;
    isFirst?: boolean;
    isLast?: boolean;
    adZone?: string;
    children: React.ReactNode;
}

export default function MoviePreviewWrapper({
    movie,
    user,
    isFirst = false,
    isLast = false,
    adZone,
    children,
    className,
    ...props
}: MoviePreviewWrapperProps) {
    const [showPopup, setShowPopup] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [cardRect, setCardRect] = useState<DOMRect | null>(null);
    const cardRef = useRef<HTMLDivElement>(null);
    const hoverTimer = useRef<NodeJS.Timeout | null>(null);
    const leaveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (props.onMouseEnter) props.onMouseEnter(e);
        
        if (activePopupCloser) {
            activePopupCloser();
            activePopupCloser = null;
        }

        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
        }

        // *** PRELOAD ảnh cực mạnh ngay tại t=0ms (mouseenter) ***
        // Browser sẽ tận dụng 350ms chờ popup để fetch & cache sẵn các ảnh cần thiết
        if (typeof window !== 'undefined') {
            // 1. Preload thumb_url cho Popup (380px)
            if (movie.thumb_url) {
                const thumbPreloadUrl = getImageUrl(movie.thumb_url, { width: 380, quality: 75 });
                new window.Image().src = thumbPreloadUrl;

                // 2. Preload THÊM ảnh thumb bản lớn (1200px) cho trang MovieDetail
                // Giúp khi user click vào Card, ảnh nền trang phim hiện ra NGAY LẬP TỨC
                const detailBgPreloadUrl = getImageUrl(movie.thumb_url, { width: 1200, quality: 75 });
                new window.Image().src = detailBgPreloadUrl;
            }
            
            // 3. Preload poster_url làm placeholder mượt (200px)
            if (movie.poster_url) {
                const posterPreloadUrl = getImageUrl(movie.poster_url, { width: 200, quality: 50 });
                new window.Image().src = posterPreloadUrl;
            }
        }
        
        hoverTimer.current = setTimeout(() => {
            if (cardRef.current) {
                if (activePopupCloser) {
                    activePopupCloser();
                }

                setCardRect(cardRef.current.getBoundingClientRect());
                setShowPopup(true);

                activePopupCloser = () => {
                    setShowPopup(false);
                };
            }
        }, 300);
    };

    const handleMouseLeave = (e?: React.MouseEvent<HTMLDivElement>) => {
        if (e && props.onMouseLeave) props.onMouseLeave(e);

        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current);
        }
        
        leaveTimer.current = setTimeout(() => {
            setShowPopup(false);
            activePopupCloser = null;
        }, 150);
    };

    const handlePopupMouseEnter = () => {
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
        }
    };

    const handlePopupMouseLeave = () => {
        handleMouseLeave();
    };

    return (
        <div 
            ref={cardRef} 
            className={className} 
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            {...props}
        >
            {children}
            
            {isMounted && createPortal(
                <AnimatePresence>
                    {showPopup && cardRect && (
                        <MoviePreviewPopup 
                            key={`popup-${movie.slug}`}
                            movie={movie}
                            user={user}
                            cardRect={cardRect}
                            isFirst={isFirst}
                            isLast={isLast}
                            adZone={adZone}
                            onMouseEnter={handlePopupMouseEnter}
                            onMouseLeave={handlePopupMouseLeave}
                        />
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
}
