import React from "react";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg" | "xl";
    className?: string;
}

export default function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
    const sizeMap = {
        sm: { outer: "w-6 h-6 border-2", inner: "w-3.5 h-3.5 border-2", dot: "w-1 h-1" },
        md: { outer: "w-10 h-10 border-4", inner: "w-6 h-6 border-2", dot: "w-1.5 h-1.5" },
        lg: { outer: "w-14 h-14 border-4", inner: "w-8 h-8 border-2", dot: "w-2 h-2" },
        xl: { outer: "w-20 h-20 border-4", inner: "w-12 h-12 border-4", dot: "w-3 h-3" },
    };

    const s = sizeMap[size] || sizeMap.md;

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer ring (High-speed Clockwise) */}
            <div
                className={`${s.outer} border-[#D497FF]/20 border-t-[#D497FF] rounded-full animate-spin`}
                style={{ animationDuration: "0.45s" }}
            />

            {/* Inner ring (High-speed Counter-clockwise) */}
            <div
                className={`absolute ${s.inner} border-white/10 border-b-[#D497FF] rounded-full animate-spin`}
                style={{ animationDirection: "reverse", animationDuration: "0.65s" }}
            />

            {/* Simple center dot without glow */}
            <div className={`absolute ${s.dot} bg-[#D497FF] rounded-full`} />
        </div>
    );
}
