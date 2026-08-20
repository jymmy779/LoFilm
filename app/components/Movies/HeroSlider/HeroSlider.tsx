"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { getCategoryStyles } from "@/app/utils/uiUtils";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-fade";
import { Movie } from "@/app/types/movie";
import { decodeHtml, cleanContent } from "@/app/utils/textUtils";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import { getImageUrl, getRawImageUrl, getEpisodeStatus, generateCategorySlug, getMovieWatchUrl } from "@/app/utils/movieUtils";
import { getR2MovieThumbUrl, getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import Container from "@/app/components/UI/Container";
import Skeleton from "@/app/components/UI/Skeleton/Skeleton";
import FavoriteButton from "@/app/components/UI/Common/FavoriteButton";
import HeroSliderSkeleton from "./HeroSliderSkeleton";

interface HeroSliderProps {
    initialMovies?: Movie[];
}

let cachedHeroMovies: Movie[] = [];

const AUTOPLAY_DELAY = 6500;

export default function HeroSlider({ initialMovies }: HeroSliderProps) {
    const [movies, setMovies] = useState<Movie[]>(() => {
        if (cachedHeroMovies.length > 0) return cachedHeroMovies;
        return initialMovies && initialMovies.length > 0 ? initialMovies : [];
    });
    const [activeIndex, setActiveIndex] = useState(0);
    const swiperRef = useRef<SwiperType | null>(null);

    useEffect(() => {
        if (initialMovies && initialMovies.length > 0) {
            setMovies(initialMovies);
            cachedHeroMovies = initialMovies;
        }
    }, [initialMovies]);

    const handleSelectSlide = useCallback((index: number) => {
        if (swiperRef.current) {
            swiperRef.current.slideToLoop(index);
        }
    }, []);

    if (movies.length === 0) {
        return <HeroSliderSkeleton />;
    }

    const currentMovie = movies[activeIndex] || movies[0];
    const displayMovies = movies.slice(0, 8); // Top 8 movies for progress pills

    return (
        <section id="top_slider" className="w-full relative h-[520px] sm:h-[580px] md:h-[680px] lg:h-[780px] xl:h-[840px] overflow-hidden select-none bg-[#0F1115]">
            {/* === MAIN BACKGROUND SWIPER === */}
            <Swiper
                modules={[Autoplay, EffectFade]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                autoplay={{ delay: AUTOPLAY_DELAY, disableOnInteraction: false }}
                loop
                speed={1100}
                onSwiper={(swiper) => (swiperRef.current = swiper)}
                onSlideChange={(s) => setActiveIndex(s.realIndex)}
                className="w-full h-full"
            >
                {movies.map((movie, index) => (
                    <SwiperSlide key={movie._id || index}>
                        <div className="absolute inset-0">
                            {/* Backdrop Image */}
                            <SmartImage
                                r2Src={getR2MovieThumbUrl(movie.slug)}
                                src={getImageUrl(movie.thumb_url, { width: 1920, quality: 85 })}
                                rawSrc={getRawImageUrl(movie.thumb_url)}
                                fallbackSrc={movie.poster_url ? getImageUrl(movie.poster_url, { width: 1200, quality: 75 }) : undefined}
                                alt={movie.name}
                                priority={index === 0}
                                loading={index === 0 ? "eager" : "lazy"}
                                fetchPriority={index === 0 ? "high" : "auto"}
                                fill
                                sizes="100vw"
                                quality={index === 0 ? 80 : 75}
                                className="object-cover object-top md:object-center transform-gpu"
                            />

                            {/* Cinematic Scrim Gradients (Lightweight pure CSS) */}
                            {/* Bottom Fade: Chỉ phủ phần đáy vừa đủ để đọc chữ, giữ 60% phần ảnh bên trên sáng trong */}
                            <div className="absolute inset-x-0 bottom-0 h-[65%] sm:h-[60%] md:h-[65%] bg-gradient-to-t from-[#0F1115] via-[#0F1115]/70 to-transparent pointer-events-none z-10" />

                            {/* Left Fade: Chỉ hiển thị trên Desktop khi text nằm bên trái, không phủ trên mobile/tablet */}
                            <div className="hidden md:block absolute inset-y-0 left-0 w-3/5 lg:w-1/2 bg-gradient-to-r from-[#0F1115]/90 via-[#0F1115]/40 to-transparent pointer-events-none z-10" />

                            {/* Top Header Fade: Đủ tối và sâu để Header/Menu/Logo luôn nổi rõ ràng trên mọi hình ảnh */}
                            <div className="absolute inset-x-0 top-0 h-28 md:h-36 bg-gradient-to-b from-[#0F1115]/90 via-[#0F1115]/40 to-transparent pointer-events-none z-10" />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* Style animations */}
            <style jsx global>{`
                @keyframes heroFadeInUp {
                    0% {
                        opacity: 0;
                        transform: translateY(22px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
            `}</style>

            {/* === FOREGROUND CONTENT OVERLAY === */}
            <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-end">
                <Container className="w-full pb-6 sm:pb-8 md:pb-12 xl:pb-14 xl:pl-[100px]">
                    <div
                        key={currentMovie.slug || activeIndex}
                        className="max-w-2xl lg:max-w-3xl xl:max-w-4xl space-y-3 sm:space-y-4 md:space-y-5 pointer-events-auto"
                    >
                        
                        {/* 1. Meta Badges & Rating (Synced with FeaturedSlider) */}
                        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 animate-[heroFadeInUp_0.7s_cubic-bezier(0.22,1,0.36,1)_both]">
                            {(currentMovie.tmdb?.vote_average || 0) > 0 && (
                                <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-black bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-md shadow-sm flex items-center gap-1 leading-none">
                                    <span>★</span>
                                    <span>{(currentMovie.tmdb?.vote_average || 0).toFixed(1)}</span>
                                </div>
                            )}
                            <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold bg-[#A7F3D0] text-emerald-950 rounded-md shadow-sm leading-none">
                                {currentMovie.year || "2024"}
                            </div>
                            <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold bg-[#F5CAE3] text-pink-950 rounded-md shadow-sm leading-none">
                                {getEpisodeStatus(currentMovie)}
                            </div>
                            {currentMovie.quality && (
                                <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold bg-[#FAD078] text-amber-950 rounded-md shadow-sm leading-none">
                                    {currentMovie.quality}
                                </div>
                            )}
                            {((currentMovie as any).lang_tag || currentMovie.lang) && (
                                <div className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-bold bg-[#C084FC] text-purple-950 rounded-md shadow-sm leading-none">
                                    {((currentMovie as any).lang_tag || currentMovie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                </div>
                            )}
                        </div>

                        {/* 2. Movie Title */}
                        <div className="space-y-1 animate-[heroFadeInUp_0.75s_cubic-bezier(0.22,1,0.36,1)_0.08s_both]">
                            <TransitionLink href={`/phim/${currentMovie.slug}`} className="block group">
                                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-[1.15] font-montserrat tracking-tight group-hover:text-[#D497FF] transition-colors line-clamp-2 drop-shadow-md">
                                    {decodeHtml(currentMovie.name)}
                                </h2>
                            </TransitionLink>
                            <p className="text-white/50 text-xs sm:text-sm md:text-base font-medium truncate italic">
                                {decodeHtml(currentMovie.origin_name)}
                            </p>
                        </div>

                        {/* 3. Categories (Tablet & Desktop) */}
                        {currentMovie.category && currentMovie.category.length > 0 && (
                            <div className="hidden sm:flex flex-wrap gap-1.5 sm:gap-2 animate-[heroFadeInUp_0.8s_cubic-bezier(0.22,1,0.36,1)_0.16s_both]">
                                {(() => {
                                    const cats = currentMovie.category.slice(0, 4);
                                    const slugs = cats.map(c => generateCategorySlug(c.slug, c.name));
                                    const styles = getCategoryStyles(slugs);
                                    return cats.map((cat, i) => (
                                        <TransitionLink
                                            key={slugs[i] || i}
                                            href={`/the-loai/${slugs[i]}`}
                                            className={`px-2.5 py-1 text-[11px] md:text-xs font-semibold bg-white/5 hover:bg-white/15 border border-white/10 ${styles[i]?.text || 'text-white/80'} rounded-full transition-all`}
                                        >
                                            {cat.name}
                                        </TransitionLink>
                                    ));
                                })()}
                            </div>
                        )}

                        {/* 4. Description (Desktop only) */}
                        <div className="hidden md:block max-w-xl lg:max-w-2xl animate-[heroFadeInUp_0.85s_cubic-bezier(0.22,1,0.36,1)_0.24s_both]">
                            <p className="text-white/70 text-xs sm:text-sm leading-relaxed line-clamp-2 lg:line-clamp-3">
                                {cleanContent(currentMovie.content) || "Bộ phim hấp dẫn đang được phát sóng với chất lượng cao trên LoFilm..."}
                            </p>
                        </div>

                        {/* 5. CTA Action Buttons */}
                        <div className="flex items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2 animate-[heroFadeInUp_0.9s_cubic-bezier(0.22,1,0.36,1)_0.32s_both]">
                            {/* Watch Now Button */}
                            <TransitionLink
                                href={getMovieWatchUrl(currentMovie)}
                                className="h-10 sm:h-12 px-5 sm:px-7 rounded-full bg-[#D497FF] hover:brightness-110 text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(212,151,255,0.35)] hover:shadow-[0_0_30px_rgba(212,151,255,0.6)] transition-all duration-300 transform-gpu active:scale-95 cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14" fill="currentColor">
                                    <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                                </svg>
                                <span>Xem Ngay</span>
                            </TransitionLink>

                            {/* Detail Button */}
                            <TransitionLink
                                href={`/phim/${currentMovie.slug}`}
                                className="h-10 sm:h-12 px-4 sm:px-5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                                    <circle cx="12" cy="12" r="10" />
                                    <path d="M12 16v-4" />
                                    <path d="M12 8h.01" />
                                </svg>
                                <span className="hidden sm:inline">Chi tiết</span>
                            </TransitionLink>

                            {/* Favorite Button */}
                            <div className="h-10 sm:h-12 w-10 sm:w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center transition-all">
                                <FavoriteButton movie={currentMovie} iconSize={18} />
                            </div>
                        </div>

                    </div>

                    {/* === BOTTOM INTERACTIVE PILLS === */}
                    <div className="mt-5 sm:mt-7 pt-1">
                        {/* Desktop & Tablet: Clean Movie Tabs */}
                        <div className="hidden sm:flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar pointer-events-auto">
                            {displayMovies.map((movie, idx) => {
                                const isCurrent = idx === (activeIndex % displayMovies.length);
                                return (
                                    <button
                                        key={movie._id || idx}
                                        onClick={() => handleSelectSlide(idx)}
                                        className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1.5 md:py-2 rounded-lg text-left border transition-all duration-200 cursor-pointer flex-1 min-w-[120px] max-w-[190px] ${
                                            isCurrent
                                                ? "bg-white/15 border-[#D497FF]/60 text-white shadow-sm"
                                                : "bg-black/40 hover:bg-white/10 border-white/10 text-white/60 hover:text-white/90"
                                        }`}
                                    >
                                        {/* Slide Number */}
                                        <span className={`text-[11px] font-black italic ${isCurrent ? 'text-[#D497FF]' : 'text-white/40'}`}>
                                            0{idx + 1}
                                        </span>

                                        {/* Movie Mini Title */}
                                        <span className="text-xs font-bold truncate flex-1">
                                            {decodeHtml(movie.name)}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Mobile: Clean Indicators */}
                        <div className="flex sm:hidden items-center justify-center gap-1.5 pointer-events-auto">
                            {displayMovies.map((_, idx) => {
                                const isCurrent = idx === (activeIndex % displayMovies.length);
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectSlide(idx)}
                                        className={`h-1.5 rounded-full transition-all duration-300 ${
                                            isCurrent ? "w-7 bg-[#D497FF]" : "w-2 bg-white/20"
                                        }`}
                                    />
                                );
                            })}
                        </div>
                    </div>

                </Container>
            </div>
        </section>
    );
}
