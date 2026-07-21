"use client";

import React from "react";
import HeroSliderSkeleton from "./components/HeroSlider/HeroSliderSkeleton";
import MovieRowSkeleton from "./components/MovieRow/MovieRowSkeleton";

export default function HomeSkeleton() {
    return (
        <main className="min-h-screen bg-[#0F1115] pb-20">
            <div className="xl:-ml-[100px] xl:w-[calc(100%+100px)]">
                <HeroSliderSkeleton />
            </div>
            <div className="flex flex-col gap-6 md:gap-[50px] mt-6">
                <div className="max-w-[1200px] mx-auto w-full px-4 xl:px-0">
                    <MovieRowSkeleton />
                </div>
            </div>
        </main>
    );
}
