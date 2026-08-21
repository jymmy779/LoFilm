import React from "react";
import HeroSliderSkeleton from "./components/Movies/HeroSlider/HeroSliderSkeleton";
import MovieRowSkeleton from "./components/Movies/MovieRow/MovieRowSkeleton";
import FeaturedSliderSkeleton from "./components/Movies/FeaturedSlider/FeaturedSliderSkeleton";
import TopMovieRowSkeleton from "./components/Movies/TopMovieRow/TopMovieRowSkeleton";

export default function HomeSkeleton() {
    return (
        <div className="w-full">
            <HeroSliderSkeleton />
            <div className="flex flex-col gap-6 md:gap-[50px] pb-20 mt-6">
                <MovieRowSkeleton />
                <FeaturedSliderSkeleton />
                <TopMovieRowSkeleton />
            </div>
        </div>
    );
}
