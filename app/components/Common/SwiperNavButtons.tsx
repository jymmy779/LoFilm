"use client";

import React from "react";

interface SwiperNavButtonsProps {
    prevClassName: string;
    nextClassName: string;
    variant?: "default" | "amber" | "large";
}

export default function SwiperNavButtons({ prevClassName, nextClassName, variant = "default" }: SwiperNavButtonsProps) {
    const isAmber = variant === "amber";
    const isLarge = variant === "large";

    const baseStyles = "absolute top-1/2 -translate-y-[calc(50%+24px)] z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-0 disabled:pointer-events-none cursor-pointer shadow-lg";
    
    const variantStyles = isAmber 
        ? "bg-white text-black hover:bg-amber-400" 
        : "bg-white text-black hover:bg-gray-100";

    const sizeStyles = isLarge ? "w-12 h-12" : "w-10 h-10";
    const iconSize = isLarge ? 20 : 16;

    return (
        <>
            <button className={`${prevClassName} ${baseStyles} ${variantStyles} ${sizeStyles} left-0 md:-left-4 lg:-left-5`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={iconSize} height={iconSize} fill="currentColor">
                    <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path>
                </svg>
            </button>
            <button className={`${nextClassName} ${baseStyles} ${variantStyles} ${sizeStyles} right-0 md:-right-4 lg:-right-5`}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={iconSize} height={iconSize} fill="currentColor">
                    <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                </svg>
            </button>
        </>
    );
}
