"use client"

import { useEffect, useRef, useState } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectFade, Thumbs, FreeMode } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";

import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/thumbs";
import "swiper/css/free-mode";
import { Movie } from "@/app/types/movie";
import { decodeHtml, cleanContent } from "@/app/utils/textUtils";
import SmartImage from "@/app/components/Common/SmartImage";
import { getImageUrl, getRawImageUrl, filterDuplicateMovies } from "@/app/utils/movieUtils";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import { motion, AnimatePresence } from "framer-motion";
import FavoriteButton from "@/app/components/Common/FavoriteButton";

const MotionSmartImage = motion.create(SmartImage);

interface HeroSliderProps {
    initialMovies?: Movie[];
}


import HeroSliderSkeleton from "./HeroSliderSkeleton";

// Global cache for HeroSlider
let cachedHeroMovies: Movie[] = [];
let hasFetchedHeroOnce = false;

export default function HeroSlider({ initialMovies }: HeroSliderProps) {
    const [movies, setMovies] = useState<Movie[]>(() => {
        if (cachedHeroMovies.length > 0) return cachedHeroMovies;
        return initialMovies && initialMovies.length > 0 ? initialMovies : [];
    });
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
    const [activeIndex, setActiveIndex] = useState(0);



    useEffect(() => {
        // Nếu đã có dữ liệu từ server (initialMovies) hoặc đã cache, không cần fetch lại ở client
        // để tránh việc dữ liệu mới từ API (không có content) ghi đè lên dữ liệu đã được enrich
        if (hasFetchedHeroOnce && cachedHeroMovies.length > 0) return;

        if (initialMovies && initialMovies.length > 0) {
            cachedHeroMovies = initialMovies;
            hasFetchedHeroOnce = true;
            setMovies(initialMovies);
            return;
        }

        axios.get(`/api/proxy?url=${encodeURIComponent("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?limit=40")}`)
            .then((res) => {
                const items: Movie[] = res.data.items || [];
                const filtered = filterDuplicateMovies(items);
                const first8 = filtered.slice(0, 8);
                
                cachedHeroMovies = first8;
                hasFetchedHeroOnce = true;
                setMovies(first8);
            })
            .catch((err) => {
                console.error("Lỗi fetch phim:", err);
            });
    }, [initialMovies]);

    if (movies.length === 0) {
        return <HeroSliderSkeleton />;
    }

    const currentMovie = movies[activeIndex];

    return (
        <section id="top_slider" className="animate-fade-in w-full relative h-[500px] md:h-[700px] lg:h-[850px] overflow-hidden">
            {/* === MAIN SWIPER (Background only) === */}
            <Swiper
                modules={[Autoplay, EffectFade, Thumbs]}
                effect="fade"
                fadeEffect={{ crossFade: true }}
                autoplay={{ delay: 6000, disableOnInteraction: false, pauseOnMouseEnter: false }}
                thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
                loop
                onSlideChange={(s) => setActiveIndex(s.realIndex)}
                className="w-full h-full"
            >
                {movies.map((movie, index) => (
                    <SwiperSlide key={movie._id}>
                        {({ isActive }) => (
                            <>
                                <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_70%,transparent_100%)] lg:overflow-hidden [transform:translateZ(0)]">
                                    <MotionSmartImage
                                        src={getImageUrl(movie.thumb_url, { width: 1920, quality: 85 })}
                                        rawSrc={getRawImageUrl(movie.thumb_url)}
                                        alt={movie.name}
                                        initial={false}
                                        priority={index === 0}
                                        loading={index === 0 ? "eager" : "lazy"}
                                        fetchPriority={index === 0 ? "high" : "auto"}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 100vw, 100vw"
                                        quality={index === 0 ? 80 : 75}
                                        animate={{
                                            x: isActive ? 0 : 40,
                                            scale: isActive ? 1 : 1.05
                                        }}
                                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="object-cover object-top transform-gpu"
                                    />

                                    {/* Dotted Texture Overlay */}
                                    <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(0,0,0,0.35)_0.8px,transparent_0.8px)] [background-size:3px_3px] opacity-30 z-10 pointer-events-none" />
                                    {/* Cinematic Vignette Overlay (Netflix Scrim style) */}
                                    {/* Loại bỏ radial-gradient để ảnh tự nhiên hơn */}

                                    {/* Additional subtle fades for text readability (Netflix-inspired Scrims) */}
                                    <div className="absolute inset-x-0 top-0 h-25 md:h-32 bg-gradient-to-b from-[#0A1628]/90 via-[#0A1628]/40 to-transparent z-20 pointer-events-none" />
                                    <div className="absolute inset-x-0 bottom-0 md:h-1/3 h-2/3 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/40 to-transparent z-20 pointer-events-none" />
                                    <div className="absolute inset-y-0 left-0 w-1 md:w-1/2 bg-gradient-to-r from-[#0A1628]/95 via-[#0A1628]/40 to-transparent z-20 pointer-events-none" />
                                    <div className="absolute inset-y-0 right-0 w-1 md:w-1/3 bg-gradient-to-l from-[#0A1628]/80 via-[#0A1628]/20 to-transparent z-20 pointer-events-none" />
                                </div>
                            </>
                        )}
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* === COMBINED CONTENT & THUMBS OVERLAY === */}
            <Container className="absolute inset-x-0 bottom-0 z-30 pb-16 pointer-events-none left-1/2 -translate-x-1/2">
                <div className="relative top-[-65px] md:top-[-150px] flex flex-col min-[700px]:flex-row items-center min-[700px]:items-end justify-center min-[700px]:justify-between w-full gap-4 lg:gap-8 xl:gap-12">

                    {/* Content (Left side on Desktop, Top on Mobile) */}
                    <div className="w-full max-w-[300px] md:max-w-md xl:max-w-2xl pointer-events-auto text-center min-[700px]:text-left">
                        <AnimatePresence mode="wait">
                            {currentMovie && (
                                <motion.div
                                    key={activeIndex}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                        transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] }
                                    }}
                                    exit={{
                                        opacity: 0,
                                        x: -30,
                                        transition: { duration: 0.1, ease: "easeIn" }
                                    }}
                                    className="space-y-4 transform-gpu will-change-[transform,opacity]"
                                >
                                    {/* Title */}
                                    <div className="min-h-[76px] m-0 md:mb-[16px] flex items-end justify-center min-[700px]:justify-start">
                                        <TransitionLink
                                            href={`/phim/${currentMovie.slug}`}
                                            className="block"
                                        >
                                            <h2 className="text-2xl xl:text-4xl font-bold text-white leading-tight drop-shadow-2xl [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)] line-clamp-1 md:line-clamp-2 hover:text-[#f5a623] transition-colors">
                                                {decodeHtml(currentMovie.name)}
                                            </h2>
                                        </TransitionLink>
                                    </div>

                                    {/* Origin name & Tags */}
                                    <div className="space-y-2 md:mb-[16px] mb-0">
                                        <p className="font-bold text-xs md:text-sm md:mb-[16px] mb-0 italic h-5 truncate [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]">
                                            {decodeHtml(currentMovie.origin_name)}
                                        </p>

                                        {/* Tags */}
                                        <div className="flex flex-wrap items-center justify-center min-[700px]:justify-start gap-2 h-7 overflow-hidden">
                                            {(currentMovie.tmdb?.vote_average || 0) > 0 && (
                                                <span className="lg:px-2 lg:py-1 px-1.5 py-0.5 text-[10px] lg:text-xs font-bold bg-amber-500/20 text-amber-200 border border-amber-400/30 rounded shadow-lg shadow-black/10 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-300">
                                                    ★ {(currentMovie.tmdb?.vote_average || 0).toFixed(1)}
                                                </span>
                                            )}
                                            <span className="lg:px-2 lg:py-1 px-1.5 py-0.5 text-[10px] lg:text-xs font-bold bg-white/20 text-white border border-white/20 rounded shadow-lg shadow-black/10 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-300">
                                                {currentMovie.year}
                                            </span>
                                            {currentMovie.episode_current && (
                                                <span className="lg:px-2 lg:py-1 px-1.5 py-0.5 text-[10px] lg:text-xs font-bold bg-white/20 text-white border border-white/20 rounded shadow-lg shadow-black/10 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-300">
                                                    {currentMovie.episode_current}
                                                </span>
                                            )}
                                            {currentMovie.quality && (
                                                <span className="lg:px-2 lg:py-1 px-1.5 py-0.5 text-[10px] lg:text-xs font-bold bg-white/20 text-white border border-white/20 rounded shadow-lg shadow-black/10 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)] transition-colors duration-300">
                                                    {currentMovie.quality}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    {currentMovie.category && currentMovie.category.length > 0 && (
                                        <div className="min-[700px]:flex flex-wrap hidden justify-center min-[700px]:justify-start gap-2">
                                            {currentMovie.category.slice(0, 3).map((cat) => (
                                                <TransitionLink
                                                    key={cat.slug}
                                                    href={`/the-loai/${cat.slug}`}
                                                    className="px-2.5 py-1 text-[10px] lg:text-xs font-medium flex items-center justify-center bg-white/10 border border-white/10 hover:border-[#f5a623]/50 hover:text-[#f5a623] rounded transition-[border-color,color] duration-300 leading-none"
                                                >
                                                    {cat.name}
                                                </TransitionLink>
                                            ))}
                                        </div>
                                    )}

                                    {/* Description */}
                                    <div className="min-h-[60px] lg:block hidden max-w-lg mx-auto lg:mx-0">
                                        {currentMovie.content ? (
                                            <p className=" text-xs xl:text-sm leading-relaxed drop-shadow-2xl [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)] line-clamp-3">
                                                {cleanContent(currentMovie.content) || "Nội dung phim đang được cập nhật..."}
                                            </p>
                                        ) : (
                                            <div className="flex flex-col gap-2">
                                                <Skeleton count={2} />
                                                <Skeleton width="60%" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Buttons */}
                                    <div className="flex min-[700px]:flex hidden items-center justify-center min-[700px]:justify-start gap-8 pt-4">
                                        <TransitionLink
                                            href={`/phim/${currentMovie.slug}`}
                                            className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-15 lg:h-15 rounded-full bg-gradient-to-tr from-[#f5a623] to-[#ffcc33] text-[#0a1628] ring-4 ring-[#f5a623]/20 shadow-[0_4px_15px_rgba(245,166,35,0.4)] hover:shadow-[0_0_30px_rgba(245,166,35,0.8)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20" height="20" fill="currentColor" className="ml-1 relative z-10">
                                                <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                                            </svg>
                                        </TransitionLink>
                                        <div className="flex items-center bg-white/10 hover:bg-white/20 rounded-full border border-white/10 overflow-hidden transition-all duration-300">
                                            <FavoriteButton
                                                movie={currentMovie}
                                                iconSize={18}
                                                className="p-3 px-5 h-full border-r border-white/10 hover:bg-white/5 transition-colors"
                                            />
                                            <TransitionLink
                                                href={`/phim/${currentMovie.slug}`}
                                                className="p-3 px-7 h-full flex items-center justify-center text-white cursor-pointer hover:text-[#f5a623] transition-colors"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="18" height="18" fill="currentColor">
                                                    <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64z" />
                                                </svg>
                                            </TransitionLink>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Thumbnail Swiper (Right side on Desktop, Bottom on Mobile) */}
                    <div className="w-[340px] min-[700px]:w-[400px] lg:w-[480px] min-h-[44px] min-[700px]:min-h-[32px] lg:min-h-[52px] pointer-events-auto">
                        <Swiper
                            modules={[FreeMode, Thumbs]}
                            onSwiper={setThumbsSwiper}
                            spaceBetween={10}
                            slidesPerView={8}
                            breakpoints={{
                                640: { slidesPerView: 7.5 },
                                1024: { slidesPerView: 5 },
                            }}
                            freeMode
                            watchSlidesProgress
                            loop
                            className="w-full"
                        >
                            {movies.map((movie, index) => (
                                <SwiperSlide key={movie._id}>
                                    <div className="relative cursor-pointer rounded-full min-[700px]:rounded overflow-hidden aspect-square min-[700px]:aspect-video border-2 border-white/20 hover:border-white/40 [.swiper-slide-thumb-active_&]:border-[#f5a623] transition-all duration-300 opacity-60 hover:opacity-90 [.swiper-slide-thumb-active_&]:opacity-100 bg-[#14233e]/40">
                                        <SmartImage
                                            src={getImageUrl(movie.thumb_url, { width: 100, quality: 60 })}
                                            rawSrc={getRawImageUrl(movie.thumb_url)}
                                            alt={movie.name}
                                            fill
                                            sizes="100px"
                                            className="object-cover"
                                        />
                                    </div>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>

                </div>
            </Container>
        </section>
    );
}
