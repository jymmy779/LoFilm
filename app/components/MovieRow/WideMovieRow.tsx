"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getImageUrl } from "@/app/utils/movieUtils";
import Container from "@/app/components/Container";
import WideMovieCard from "@/app/components/MovieCard/WideMovieCard";
import WideMovieCardSkeleton from "@/app/components/MovieCard/WideMovieCardSkeleton";
import { useMovies } from "@/app/hooks/useMovies";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";
import { useAdTrigger } from "@/app/hooks/useAdTrigger";

interface WideMovieRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
    revalidate?: number;
}

import WideMovieRowSkeleton from "./WideMovieRowSkeleton";

function WideMovieRow({
    title,
    apiUrl,
    viewAllLink,
    initialMovies,
    revalidate
}: WideMovieRowProps) {
    const { openAdOnly } = useAdTrigger();
    const { movies, isLoading } = useMovies({ apiUrl, initialMovies, sortByYear: true, revalidate });

    const navId = title.replace(/\s+/g, '-').toLowerCase();

    const handleAdClick = () => {
        openAdOnly("wide_movie_row");
    };

    if (isLoading) {
        return <WideMovieRowSkeleton />;
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="relative z-30 animate-fade-in">
            {/* Header */}
            <div className="row-header flex items-center justify-between mb-4 md:mb-6">
                <h2 className="category-name text-xl md:text-2xl lg:text-3xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-200 to-white drop-shadow-sm">
                    {title}
                </h2>
                <div className="cat-more">
                    <TransitionLink
                        href={viewAllLink}
                        className="line-center text-white/50 hover:text-white transition-all flex items-center gap-1.5 text-[11px] md:text-sm font-medium hover:gap-2.5"
                    >
                        <span>Xem thêm</span>
                        <svg stroke="currentColor" fill="currentColor" strokeWidth="0" viewBox="0 0 320 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg">
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </TransitionLink>
                </div>
            </div>

            {/* Content Swiper */}
            <div className="row-content relative group/slider">
                <div className="cards-slide-wrapper top-up">
                    <Swiper
                        modules={[Navigation]}
                        slidesPerView={1.2}
                        spaceBetween={10}
                        breakpoints={{
                            480: { slidesPerView: 1.5, spaceBetween: 12 },
                            640: { slidesPerView: 2.1, spaceBetween: 14 },
                            1024: { slidesPerView: 2.6, spaceBetween: 16 },
                            1440: { slidesPerView: 3.2, spaceBetween: 20 },
                            1600: { slidesPerView: 3.6, spaceBetween: 20 }
                        }}
                        navigation={{
                            nextEl: `.sw-next-${navId}`,
                            prevEl: `.sw-prev-${navId}`,
                        }}
                        watchSlidesProgress={true}
                        touchEventsTarget="container"
                        simulateTouch={true}
                        touchStartPreventDefault={true}
                        passiveListeners={true}
                        className="swiper-carousel"
                    >
                        {movies.map((movie, index) => (
                            <SwiperSlide key={movie._id}>
                                <div onClick={handleAdClick} className="block relative group cursor-pointer overflow-hidden rounded-xl md:rounded-2xl bg-slate-900/40 transition-all duration-300 transform-gpu">
                                    <WideMovieCard movie={movie} priority={index < 2} />
                                </div>
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <SwiperNavButtons
                        variant="ghost"
                        prevClassName={`sw-prev-${navId}`}
                        nextClassName={`sw-next-${navId}`}
                    />
                </div>
            </div>
        </Container>
    );
}

export default memo(WideMovieRow);
