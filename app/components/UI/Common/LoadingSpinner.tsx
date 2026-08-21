import React from "react";

interface LoadingSpinnerProps {
    size?: "xs" | "sm" | "md" | "lg" | "xl";
    color?: "default" | "white" | "orange" | "black" | "blue" | "red" | "emerald";
    className?: string;
}

export default function LoadingSpinner({ size = "md", color = "default", className = "" }: LoadingSpinnerProps) {
    const sizeMap = {
        xs: { outer: "w-4 h-4 border-2", inner: "w-2.5 h-2.5 border-2", dot: "w-[3px] h-[3px]" },
        sm: { outer: "w-6 h-6 border-2", inner: "w-3.5 h-3.5 border-2", dot: "w-1 h-1" },
        md: { outer: "w-10 h-10 border-4", inner: "w-6 h-6 border-2", dot: "w-1.5 h-1.5" },
        lg: { outer: "w-14 h-14 border-4", inner: "w-8 h-8 border-2", dot: "w-2 h-2" },
        xl: { outer: "w-20 h-20 border-4", inner: "w-12 h-12 border-4", dot: "w-3 h-3" },
    };

    const colorMap = {
        default: { outer: "border-[#D497FF]/20 border-t-[#D497FF]", inner: "border-white/10 border-b-[#D497FF]", dot: "bg-[#D497FF]" },
        white: { outer: "border-white/20 border-t-white", inner: "border-white/10 border-b-white", dot: "bg-white" },
        orange: { outer: "border-orange-500/20 border-t-orange-500", inner: "border-orange-500/10 border-b-orange-500", dot: "bg-orange-500" },
        blue: { outer: "border-blue-500/20 border-t-blue-500", inner: "border-blue-500/10 border-b-blue-500", dot: "bg-blue-500" },
        red: { outer: "border-red-500/20 border-t-red-500", inner: "border-red-500/10 border-b-red-500", dot: "bg-red-500" },
        emerald: { outer: "border-emerald-500/20 border-t-emerald-500", inner: "border-emerald-500/10 border-b-emerald-500", dot: "bg-emerald-500" },
        black: { outer: "border-black/20 border-t-black", inner: "border-black/10 border-b-black", dot: "bg-black" },
    };

    const s = sizeMap[size] || sizeMap.md;
    const c = colorMap[color] || colorMap.default;

    return (
        <div className={`relative flex items-center justify-center ${className}`}>
            {/* Outer ring (High-speed Clockwise) */}
            <div
                className={`${s.outer} ${c.outer} rounded-full animate-spin`}
                style={{ animationDuration: "0.45s" }}
            />

            {/* Inner ring (High-speed Counter-clockwise) */}
            <div
                className={`absolute ${s.inner} ${c.inner} rounded-full animate-spin`}
                style={{ animationDirection: "reverse", animationDuration: "0.65s" }}
            />

            {/* Simple center dot without glow */}
            <div className={`absolute ${s.dot} ${c.dot} rounded-full`} />
        </div>
    );
}
