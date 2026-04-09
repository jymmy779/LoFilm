"use client";

import { useState, useRef, useEffect, HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence } from "framer-motion";
import { Movie } from "@/app/types/movie";
import MoviePreviewPopup from "./MoviePreviewPopup";

// Biến global để quản lý việc chỉ hiện duy nhất 1 popup trên toàn trang
let activePopupCloser: (() => void) | null = null;

interface MoviePreviewWrapperProps extends HTMLAttributes<HTMLDivElement> {
    movie: Movie;
    user?: any;
    isFirst?: boolean;
    isLast?: boolean;
    children: React.ReactNode;
}

export default function MoviePreviewWrapper({
    movie,
    user,
    isFirst = false,
    isLast = false,
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
        }, 600);
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
