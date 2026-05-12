"use client";

import React from "react";

interface SwiperNavButtonsProps {
    prevClassName: string;
    nextClassName: string;
    variant?: "default" | "amber" | "large" | "ghost";
    className?: string;
}

export default function SwiperNavButtons({ prevClassName, nextClassName, variant = "default", className = "" }: SwiperNavButtonsProps) {
    const isAmber = variant === "amber";
    const isLarge = variant === "large";
    const isGhost = variant === "ghost";

    const baseStyles = isGhost 
        ? "xl:flex hidden sw-button absolute top-[42%] -translate-y-1/2 z-40 text-white/30 hover:text-white transition-colors disabled:opacity-0 cursor-pointer items-center justify-center"
        : "xl:flex hidden absolute top-1/2 -translate-y-[calc(50%+32px)] z-10 w-10 h-10 rounded-full items-center justify-center transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none cursor-pointer border border-white/10";
    
    const variantStyles = isGhost
        ? ""
        : isAmber 
            ? "bg-white text-black hover:bg-amber-400" 
            : "bg-white text-black hover:bg-gray-100";

    const sizeStyles = isGhost 
        ? "" 
        : isLarge ? "w-12 h-12" : "w-10 h-10";
        
    const iconSize = isGhost ? 47 : (isLarge ? 20 : 16);

    return (
        <>
            <button className={`${prevClassName} ${baseStyles} ${variantStyles} ${sizeStyles} ${className} ${isGhost ? "-left-6 lg:-left-12" : "left-0 md:-left-4 lg:-left-5"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={iconSize} height={iconSize} fill="currentColor">
                    <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s-12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path>
                </svg>
            </button>
            <button className={`${nextClassName} ${baseStyles} ${variantStyles} ${sizeStyles} ${className} ${isGhost ? "-right-6 lg:-right-12" : "right-0 md:-right-4 lg:-right-5"}`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={iconSize} height={iconSize} fill="currentColor">
                    <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                </svg>
            </button>
        </>
    );
}
