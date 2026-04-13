"use client";

import TransitionLink from "@/app/components/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { getImageUrl } from "@/app/utils/movieUtils";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import Container from "@/app/components/Container";
import MoviePreviewWrapper from "@/app/components/MovieCard/MoviePreviewWrapper";
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

export default function WideMovieRow({
    title,
    apiUrl,
    viewAllLink,
    initialMovies,
    revalidate
}: WideMovieRowProps) {
    const { triggerAd } = useAdTrigger();
    const { movies, isLoading } = useMovies({ apiUrl, initialMovies, sortByYear: true, revalidate });

    const navId = title.replace(/\s+/g, '-').toLowerCase();

    const handleMovieClick = (e: React.MouseEvent, movieSlug: string) => {
        if (e.metaKey || e.ctrlKey || (e.button && e.button === 1)) return;
        e.preventDefault();
        triggerAd(`/phim/${movieSlug}`, "wide_movie_row");
    };

    if (isLoading) {
        return (
            <Container as="section" className="relative z-30 mb-6 md:mb-12 lg:mb-16 mt-6 md:mt-8">
                <div className="flex items-center justify-between mb-4 md:mb-6">
                    <Skeleton width={200} height={32} className="rounded-lg" />
                    <Skeleton width={80} height={20} className="rounded" />
                </div>
                <div className="flex gap-[10px] md:gap-4 lg:gap-5 overflow-hidden pt-[5px] pb-[20px]">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex-none w-[80%] sm:w-[45%] lg:w-[35%] xl:w-[28%]">
                            <Skeleton className="aspect-[21/9] rounded-xl md:rounded-2xl block" />
                        </div>
                    ))}
                </div>
            </Container>
        );
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="cards-row cards-slide wide relative z-30 mb-6 md:mb-12 lg:mb-16 mt-6 md:mt-8">
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
                                <div className="sw-cover relative group cursor-pointer overflow-hidden rounded-xl md:rounded-2xl bg-[#0f172a] border border-white/5 shadow-2xl transition-all duration-300 transform-gpu">
                                    <MoviePreviewWrapper movie={movie} adZone="wide_movie">
                                        {/* Background Thumbnail (Horizontal) */}
                                        <div onClick={(e) => handleMovieClick(e, movie.slug)} className="v-thumbnail v-thumbnail-hoz relative aspect-[21/9] overflow-hidden transform-gpu">
                                            <Image
                                                src={getImageUrl(movie.thumb_url, { width: 450, quality: 70 })}
                                                alt={movie.name}
                                                fill
                                                priority={index < 2}
                                                className="object-cover transition-transform duration-700 group-hover:scale-105 transform-gpu"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-[#0f172a]/30 to-transparent z-10" />
                                        </div>

                                        {/* Overlaid Content Info */}
                                        <div className="h-item absolute bottom-0 left-0 right-0 p-3 md:p-4 flex gap-3 md:gap-4 items-end z-20 transition-transform duration-300 group-hover:translate-y-[-2px] transform-gpu">
                                            {/* Small Vertical Poster */}
                                            <div className="v-thumb-m w-10 h-14 sm:w-14 sm:h-20 md:w-18 md:h-26 shrink-0 rounded md:rounded-lg overflow-hidden border border-white/10 shadow-2xl relative transform-gpu hidden sm:block">
                                                <Image
                                                    src={getImageUrl(movie.poster_url, { width: 100, quality: 60 })}
                                                    alt={movie.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            <div className="info flex-1 min-w-0 pb-0.5 md:pb-1">
                                                <h4 className="item-title text-[12px] md:text-base font-bold text-white truncate group-hover:text-yellow-400 transition-colors drop-shadow-md">
                                                    {decodeHtml(movie.name)}
                                                </h4>
                                                <h6 className="alias-title text-[8px] md:text-xs text-white/30 truncate mb-1 md:mb-2 font-medium">
                                                    {decodeHtml(movie.origin_name)}
                                                </h6>
                                                <div className="info-line flex flex-wrap gap-1 md:gap-2">
                                                    <div className="tag-small px-1.5 py-0.5 bg-white/5 rounded text-[8px] md:text-[10px] text-white/50 border border-white/5">
                                                        {movie.year}
                                                    </div>
                                                    <div className="tag-small px-1.5 py-0.5 bg-yellow-500/10 rounded text-[8px] md:text-[10px] text-yellow-500 font-bold border border-yellow-500/10">
                                                        {movie.episode_current?.replace(/Tập/, 'T.')}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </MoviePreviewWrapper>
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
