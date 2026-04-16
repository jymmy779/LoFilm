import React, { useState, useEffect, forwardRef } from "react";
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

        useEffect(() => {
            setCurrentSrc(src);
            setHasError(false);
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

        return (
            <Image
                {...props}
                ref={ref}
                src={currentSrc}
                alt={alt || ""}
                onError={handleError}
                unoptimized={hasError} // Disable optimization for raw/fallback to avoid further proxy issues
            />
        );
    }
);

SmartImage.displayName = "SmartImage";

export default SmartImage;
