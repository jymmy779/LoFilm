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

            // Check if already loaded from cache before React attached onLoad
            if (localRef.current?.complete) {
                setIsLoaded(true);
            } else {
                setIsLoaded(false);
            }
        }, [src]);

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
