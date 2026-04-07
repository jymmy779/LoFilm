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
import { filterDuplicateMovies, getImageUrl } from "@/app/utils/movieUtils";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

const MotionImage = motion.create(Image);

interface HeroSliderProps {
    initialMovies?: Movie[];
}

import { useAdTrigger } from "@/app/hooks/useAdTrigger";

export default function HeroSlider({ initialMovies }: HeroSliderProps) {
    const { triggerAd } = useAdTrigger();
    const [movies, setMovies] = useState<Movie[]>(() =>
        initialMovies && initialMovies.length > 0 ? initialMovies : []
    );
    const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);

    const [activeIndex, setActiveIndex] = useState(0);

    const handleHeroClick = (e: React.MouseEvent, movieSlug: string) => {
        if (e.metaKey || e.ctrlKey || (e.button && e.button === 1)) return;
        e.preventDefault();
        triggerAd(`/phim/${movieSlug}`, "hero_slider");
    };

    const scheduleContentEnrich = (first8: Movie[]) => {
        const runEnrich = async () => {
            const fetchSingle = async (m: Movie) => {
                // Nếu đã có content từ server prefetch thì không gọi lại nữa
                if (m.content) return;

                try {
                    const r = await axios.get(`/api/proxy?url=${encodeURIComponent(`https://phimapi.com/phim/${m.slug}`)}`);
                    const content = r.data.movie?.content ?? "";
                    if (content) {
                        setMovies((prev) =>
                            prev.map((item) => item.slug === m.slug ? { ...item, content } : item)
                        );
                    }
                } catch (error) {
                    console.error(`Lỗi fetch content cho ${m.slug}:`, error);
                }
            };

            // Ưu tiên phim đầu tiên
            if (first8.length > 0) {
                await fetchSingle(first8[0]);
            }

            // Các phim còn lại
            if (first8.length > 1) {
                const rest = first8.slice(1);
                rest.forEach(m => fetchSingle(m));
            }
        };

        if (typeof requestIdleCallback !== "undefined") {
            requestIdleCallback(() => runEnrich(), { timeout: 800 });
        } else {
            setTimeout(runEnrich, 1);
        }
    };

    useEffect(() => {
        if (initialMovies && initialMovies.length > 0) {
            scheduleContentEnrich(initialMovies);
            return;
        }

        axios.get(`/api/proxy?url=${encodeURIComponent("https://phimapi.com/danh-sach/phim-moi-cap-nhat-v3?page=1")}`)
            .then((res) => {
                const items: Movie[] = res.data.items || [];
                const filtered = filterDuplicateMovies(items);
                const first8 = filtered.slice(0, 8);
                setMovies(first8);
                scheduleContentEnrich(first8);
            })
            .catch((err) => {
                console.error("Lỗi fetch phim:", err);
            });
        // Chỉ chạy một lần khi mount; initialMovies đến từ server snapshot
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (movies.length === 0) {
        return (
            <div className="relative w-full h-[500px] md:h-[700px] lg:h-[850px] bg-[#0f1115]">
                <Skeleton className="w-full h-full" containerClassName="h-full" />
                <Container className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full">
                    <div className="max-w-xl">
                        <Skeleton height={60} width="90%" className="mb-4" />
                        <Skeleton height={20} width="60%" className="mb-8" />
                        <Skeleton count={3} />
                    </div>
                </Container>
            </div>
        );
    }

    const currentMovie = movies[activeIndex];

    return (
        <section id="top_slider" className=" w-full relative h-[500px] md:h-[700px] lg:h-[850px] overflow-hidden">
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
                                    <MotionImage
                                        src={getImageUrl(movie.thumb_url, { quality: index === 0 ? 80 : 70 })}
                                        alt={movie.name}
                                        initial={false}
                                        priority={index === 0}
                                        loading={index === 0 ? "eager" : "lazy"}
                                        fill
                                        sizes="100vw"
                                        animate={{
                                            x: isActive ? 0 : 40,
                                            scale: isActive ? 1 : 1.05
                                        }}
                                        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                                        className="object-cover object-top transform-gpu"
                                    />

                                    {/* Overlays for readability */}
                                    <div className="absolute inset-x-0 top-0 h-20 md:h-30 bg-gradient-to-b from-[#0A1628] to-transparent pointer-events-none" />
                                    <div className="absolute inset-y-0 right-0 md:w-1/6 bg-gradient-to-l from-[#0A1628] to-transparent pointer-events-none" />
                                    <div className="absolute inset-y-0 left-0 md:w-1/4 bg-gradient-to-r from-[#0A1628] md:from-[#0A1628] md:via-[#0A1628]/60 to-transparent" />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 md:h-1/3 bg-gradient-to-t from-[#0A1628] via-[#0A1628]/60 md:via-[#0A1628]/60 to-transparent pointer-events-none" />
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
                                        <h2 
                                            className="text-2xl xl:text-4xl font-bold text-white leading-tight drop-shadow-2xl [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)] line-clamp-1 md:line-clamp-2 cursor-pointer hover:text-[#f5a623] transition-colors"
                                            onClick={(e) => handleHeroClick(e, currentMovie.slug)}
                                        >
                                            {decodeHtml(currentMovie.name)}
                                        </h2>
                                    </div>

                                    {/* Origin name & Tags */}
                                    <div className="space-y-2 md:mb-[16px] mb-0">
                                        <p className="font-bold text-xs md:text-sm md:mb-[16px] mb-0 italic h-5 truncate [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]">
                                            {decodeHtml(currentMovie.origin_name)}
                                        </p>

                                        {/* Tags */}
                                        <div className="flex flex-wrap items-center justify-center min-[700px]:justify-start gap-2 h-7 overflow-hidden">
                                            {(currentMovie.tmdb?.vote_average || 0) > 0 && (
                                                <span className="lg:px-2 lg:py-1 px-1 py-0.5 text-[10px] lg:text-xs border rounded bg-white/20 lg:bg-white/10 border-[#f5a623] text-[#f5a623] transition-colors">
                                                    ★ {(currentMovie.tmdb?.vote_average || 0).toFixed(1)}
                                                </span>
                                            )}
                                            <span className="lg:px-2 lg:py-1 px-1 py-0.5 text-[10px] lg:text-xs text-white border rounded bg-white/20 lg:bg-white/10 transition-colors">
                                                {currentMovie.year}
                                            </span>
                                            {currentMovie.episode_current && (
                                                <span className="lg:px-2 lg:py-1 px-1 py-0.5 text-[10px] lg:text-xs text-white border rounded bg-white/20 lg:bg-white/10 transition-colors">
                                                    {currentMovie.episode_current}
                                                </span>
                                            )}
                                            {currentMovie.quality && (
                                                <span className="lg:px-2 lg:py-1 px-1 py-0.5 text-[10px] lg:text-xs text-white border rounded bg-white/20 lg:bg-white/10 transition-colors">
                                                    {currentMovie.quality}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Categories */}
                                    {currentMovie.category && currentMovie.category.length > 0 && (
                                        <div className="min-[700px]:flex flex-wrap hidden justify-center min-[700px]:justify-start gap-1.5">
                                            {currentMovie.category.slice(0, 3).map((cat) => (
                                                <TransitionLink
                                                    key={cat.slug}
                                                    href={`/the-loai/${cat.slug}`}
                                                    className="lg:px-2 lg:py-1 px-1 py-0.5 text-[10px] lg:text-xs flex items-center justify-center bg-white/15 hover:text-[#f5a623] rounded"
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
                                    <div className="flex min-[700px]:flex hidden items-center justify-center min-[700px]:justify-start gap-5 pt-4">
                                        <div
                                            onClick={(e) => handleHeroClick(e, currentMovie.slug)}
                                            className="relative flex items-center justify-center w-10 h-10 md:w-12 md:h-12 lg:w-15 lg:h-15 rounded-full bg-gradient-to-tr from-[#f5a623] to-[#ffcc33] text-[#0a1628] ring-4 ring-[#f5a623]/20 shadow-[0_4px_15px_rgba(245,166,35,0.4)] hover:shadow-[0_0_30px_rgba(245,166,35,0.8)] hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="20" height="20" fill="currentColor" className="ml-1 relative z-10">
                                                <path d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" />
                                            </svg>
                                        </div>
                                        <div
                                            onClick={(e) => handleHeroClick(e, currentMovie.slug)}
                                            className="lg:px-6 lg:py-2.5 md:px-4 py-1.5 px-3 bg-white/10 hover:bg-white/20 text-white text-xs md:text-sm font-medium rounded-full transition-all duration-300 border border-white/10 cursor-pointer"
                                        >
                                            Chi tiết phim
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Thumbnail Swiper (Right side on Desktop, Bottom on Mobile) */}
                    <div className="w-[340px] min-[700px]:w-[400px] lg:w-[480px] pointer-events-auto">
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
                                    <div className="relative cursor-pointer rounded-full min-[700px]:rounded overflow-hidden aspect-square min-[700px]:aspect-video border-2 border-transparent hover:border-white/40 [.swiper-slide-thumb-active_&]:border-[#f5a623] transition-all duration-300 opacity-60 hover:opacity-90 [.swiper-slide-thumb-active_&]:opacity-100">
                                        <Image
                                            src={getImageUrl(movie.thumb_url, { width: 120, quality: 70 })}
                                            alt={movie.name}
                                            fill
                                            priority={index < 3}
                                            loading={index < 3 ? "eager" : "lazy"}
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
