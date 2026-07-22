import React, { useState, useEffect, forwardRef, memo } from "react";
import Image, { ImageProps } from "next/image";

interface SmartImageProps extends Omit<ImageProps, "onError"> {
    fallbackSrc?: string;
    rawSrc?: string;
    /** R2 self-hosted WebP URL – ưu tiên cao nhất, nhanh nhất */
    r2Src?: string;
}

/**
 * A smarter Image component with 3-tier fallback:
 * 1. r2Src  – R2 CDN (self-hosted WebP, fastest, most stable)
 * 2. src    – wsrv.nl proxy (convert on-the-fly, fallback khi R2 chưa có)
 * 3. rawSrc – URL gốc từ nguồn (last resort)
 */
const SmartImage = forwardRef<HTMLImageElement, SmartImageProps>(
    ({ src, rawSrc, r2Src, fallbackSrc, alt, ...props }, ref) => {
        // Khởi tạo: ưu tiên r2Src nếu có
        const [currentSrc, setCurrentSrc] = useState<any>(() => r2Src || src);
        const [fallbackLevel, setFallbackLevel] = useState(0); // 0=r2, 1=wsrv, 2=raw
        const [isLoaded, setIsLoaded] = useState(false);

        const localRef = React.useRef<HTMLImageElement | null>(null);

        const handleRef = React.useCallback((node: HTMLImageElement | null) => {
            localRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }

            if (node) {
                requestAnimationFrame(() => {
                    if (node.complete && (node.naturalWidth > 0 || node.naturalHeight > 0)) {
                        setIsLoaded(true);
                    }
                });
            }
        }, [ref]);

        // Reset khi src hoặc r2Src thay đổi
        useEffect(() => {
            setCurrentSrc(r2Src || src);
            setFallbackLevel(0);
            setIsLoaded(false);
        }, [src, r2Src]);

        useEffect(() => {
            // Fallback cuối: nếu sau 1.5s ảnh vẫn chưa hiện, tự động hiện lên
            const timer = setTimeout(() => {
                if (localRef.current?.complete) {
                    setIsLoaded(true);
                }
            }, 1500);

            return () => clearTimeout(timer);
        }, [currentSrc]);

        const handleError = () => {
            // Tầng 0 (r2Src) → thử tầng 1 (wsrv.nl / src)
            if (fallbackLevel === 0 && r2Src && currentSrc === r2Src && src) {
                setCurrentSrc(src);
                setFallbackLevel(1);
                return;
            }
            // Tầng 1 (wsrv.nl hoặc r2 không có src) → thử tầng 2 (rawSrc)
            if (fallbackLevel <= 1 && rawSrc && currentSrc !== rawSrc) {
                setCurrentSrc(rawSrc);
                setFallbackLevel(2);
                return;
            }
            // Tầng 2 → fallbackSrc nếu có
            if (fallbackSrc && currentSrc !== fallbackSrc) {
                setCurrentSrc(fallbackSrc);
                setFallbackLevel(3);
            }
        };

        const baseClass = props.className || "";
        // Disable Next.js optimization khi đã xuống fallback raw (không cần proxy thêm)
        const shouldUnoptimize = props.unoptimized || fallbackLevel >= 2;

        return (
            <Image
                referrerPolicy="no-referrer"
                {...props}
                ref={handleRef}
                src={currentSrc || fallbackSrc || "data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs="}
                alt={alt || ""}
                onError={handleError}
                onLoad={(e) => {
                    setIsLoaded(true);
                    if (props.onLoad) props.onLoad(e);
                }}
                className={`${baseClass} ${isLoaded ? 'animate-fade-in-simple opacity-100' : 'opacity-0'}`}
                unoptimized={shouldUnoptimize}
            />
        );
    }
);

SmartImage.displayName = "SmartImage";

export default memo(SmartImage);

