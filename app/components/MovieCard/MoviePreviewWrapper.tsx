"use client";

import { useState, useRef, useEffect, HTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Movie } from "@/app/types/movie";

import MoviePreviewPopup from "./MoviePreviewPopup";

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
    const router = useRouter();
    const [showPopup, setShowPopup] = useState(false);
    const [isMounted, setIsMounted] = useState(false);
    const [cardRect, setCardRect] = useState<DOMRect | null>(null);
    const [isClosing, setIsClosing] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const hoverTimer = useRef<NodeJS.Timeout | null>(null);
    const leaveTimer = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const closeAnimationTimer = useRef<NodeJS.Timeout | null>(null);

    const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
        if (props.onMouseEnter) props.onMouseEnter(e);

        // Hủy bỏ tất cả các timer đóng/ẩn đang chạy
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
            leaveTimer.current = null;
        }
        if (closeAnimationTimer.current) {
            clearTimeout(closeAnimationTimer.current);
            closeAnimationTimer.current = null;
        }

        // Nếu card này đang trong quá trình đóng (animation), dừng việc đóng lại và giữ hiện thị
        if (isClosing) {
            setIsClosing(false);
        }

        // Nếu đã hiện rồi thì không làm gì thêm (nhưng vẫn phải clear các timer đóng ở trên)
        if (showPopup) return;

        // *** SMART PREFETCH ***
        router.prefetch(`/phim/${movie.slug}`);

        hoverTimer.current = setTimeout(() => {
            // Đóng bất kỳ popup nào khác đang hiện trên toàn trang
            if (activePopupCloser) {
                activePopupCloser();
            }

            if (cardRef.current) {
                setCardRect(cardRef.current.getBoundingClientRect());
                setShowPopup(true);
                setIsClosing(false);

                // Đăng ký card này là active popup
                activePopupCloser = () => {
                    setShowPopup(false);
                    setIsClosing(false);
                };
            }
        }, 400); // Giữ delay 400ms để tránh hiện popup vô tội vạ khi lướt nhanh
    };

    const handleMouseLeave = (e?: React.MouseEvent<HTMLDivElement>) => {
        if (e && props.onMouseLeave) props.onMouseLeave(e);

        // Hủy timer "đang chờ hiện" nếu người dùng rời đi sớm
        if (hoverTimer.current) {
            clearTimeout(hoverTimer.current);
            hoverTimer.current = null;
        }

        // Bắt đầu quá trình đóng sau 100ms chờ đợi
        leaveTimer.current = setTimeout(() => {
            setIsClosing(true);
            
            // Chờ animation CSS (250ms) chạy xong mới gỡ bỏ khỏi DOM hoàn toàn
            closeAnimationTimer.current = setTimeout(() => {
                setShowPopup(false);
                setIsClosing(false);
                if (activePopupCloser) activePopupCloser = null;
                closeAnimationTimer.current = null;
            }, 250);

            leaveTimer.current = null;
        }, 100);
    };

    const handlePopupMouseEnter = () => {
        if (leaveTimer.current) {
            clearTimeout(leaveTimer.current);
        }
        setIsClosing(false);
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
                <>
                    {showPopup && cardRect && (
                        <MoviePreviewPopup
                            key={`popup-${movie.slug}`}
                            movie={movie}
                            user={user}
                            cardRect={cardRect}
                            isFirst={isFirst}
                            isLast={isLast}
                            adZone={adZone}
                            isClosing={isClosing}
                            onMouseEnter={handlePopupMouseEnter}
                            onMouseLeave={handlePopupMouseLeave}
                        />
                    )}
                </>,
                document.body
            )}
        </div>
    );
}
