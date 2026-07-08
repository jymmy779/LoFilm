import React, { useState, useEffect, forwardRef, memo } from "react";
import Image, { ImageProps } from "next/image";

interface SmartImageProps extends Omit<ImageProps, "onError"> {
    fallbackSrc?: string;
    rawSrc?: string;
}

/**
 * A smarter Image component that handles proxy failures by falling back to the raw URL
 * or a placeholder image if necessary.
 */
const SmartImage = forwardRef<HTMLImageElement, SmartImageProps>(
    ({ src, rawSrc, fallbackSrc, alt, ...props }, ref) => {
        const [currentSrc, setCurrentSrc] = useState<any>(src);
        const [hasError, setHasError] = useState(false);
        const [isLoaded, setIsLoaded] = useState(false);

        const localRef = React.useRef<HTMLImageElement | null>(null);

        const handleRef = React.useCallback((node: HTMLImageElement | null) => {
            localRef.current = node;
            if (typeof ref === 'function') {
                ref(node);
            } else if (ref) {
                ref.current = node;
            }
        }, [ref]);

        useEffect(() => {
            setCurrentSrc(src);
            setHasError(false);
            setIsLoaded(false);
        }, [src]);

        useEffect(() => {
            // Check if already loaded from cache before React attached onLoad
            // This needs to run whenever currentSrc changes (e.g. fallback to rawSrc)
            if (localRef.current?.complete) {
                // Sometimes complete is true for a 0x0 image before src is set, but Next.js usually handles this.
                // We double check naturalWidth to ensure it's actually loaded if possible, 
                // but localRef.current.complete is usually enough for cached images.
                if (localRef.current.naturalWidth > 0 || localRef.current.naturalHeight > 0) {
                    setIsLoaded(true);
                } else if (localRef.current.src && localRef.current.src !== window.location.href) {
                     // It's complete but naturalWidth is 0? Might be a broken image or just cached 1x1.
                     setIsLoaded(true);
                }
            }
        }, [currentSrc]);

        const handleError = () => {
            if (!hasError) {
                if (rawSrc && currentSrc !== rawSrc) {
                    // Try the raw URL if proxy fails
                    setCurrentSrc(rawSrc);
                    setHasError(true);
                } else if (fallbackSrc && currentSrc !== fallbackSrc) {
                    // Try global fallback
                    setCurrentSrc(fallbackSrc);
                    setHasError(true);
                }
            }
        };

        // Pass the transition classes directly to Image
        const baseClass = props.className || "";

        return (
            <Image
                {...props}
                ref={handleRef}
                src={currentSrc}
                alt={alt || ""}
                onError={handleError}
                onLoad={(e) => {
                    setIsLoaded(true);
                    if (props.onLoad) props.onLoad(e);
                }}
                className={`${baseClass} ${isLoaded ? 'animate-fade-in-simple opacity-100' : 'opacity-0'}`}
                unoptimized={hasError} // Disable optimization for raw/fallback to avoid further proxy issues
            />
        );
    }
);

SmartImage.displayName = "SmartImage";

export default memo(SmartImage);
