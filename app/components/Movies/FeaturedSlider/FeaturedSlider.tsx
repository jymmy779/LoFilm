"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import axios from "axios";
import useSWR from "swr";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectCoverflow, Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/effect-coverflow";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { filterDuplicateMovies, getImageUrl, getRawImageUrl, getEpisodeStatus, getMovieWatchUrl } from "@/app/utils/movieUtils";
import { getR2MovieThumbUrl } from "@/app/utils/r2ImageUrl";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import FavoriteButton from "@/app/components/UI/Common/FavoriteButton";
import Container from "@/app/components/UI/Container";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import FeaturedSliderSkeleton from "./FeaturedSliderSkeleton";
import SwiperNavButtons from "@/app/components/UI/Common/SwiperNavButtons";

interface FeaturedSliderProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    navId?: string;
    initialMovies?: Movie[];
    titleGradient?: string;
}

function FeaturedSlider({
    title,
    apiUrl,
    viewAllLink,
    navId = "featured-coverflow",
    initialMovies,
    titleGradient = "from-white via-[#E9D5FF] to-[#D497FF]"
}: FeaturedSliderProps) {
    const seeded = !!(initialMovies && initialMovies.length > 0);

    const fetcher = async (url: string) => {
        const res = await axios.get(url);
        if (res.data?.status === "success" || res.data?.status === true) {
            return filterDuplicateMovies(res.data.data.items || []).slice(0, 10);
        }
        return [];
    };

    const { data: swrMovies, isLoading: isSwrLoading } = useSWR<Movie[]>(
        seeded ? null : `/api/proxy?url=${encodeURIComponent(apiUrl)}`,
        fetcher,
        { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 60000 }
    );

    const movies = (seeded ? initialMovies! : (swrMovies || [])).slice(0, 10);
    const isLoading = seeded ? false : isSwrLoading;

    if (isLoading) {
        return <FeaturedSliderSkeleton />;
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="relative select-none overflow-hidden">
            {/* Header */}
            <div className="row-header flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-3 sm:gap-4">
                    <h2 className={`text-xl sm:text-2xl lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r ${titleGradient} drop-shadow-sm`}>
                        {title}
                    </h2>
                    <TransitionLink
                        href={viewAllLink || "/"}
                        className="group/more flex items-center justify-center bg-[#0F1115] border border-white/10 rounded-full h-8 w-8 lg:h-9 lg:w-9 transition-[width,border-color] duration-300 hover:border-[#D497FF]/50 hover:w-[110px] lg:hover:w-[125px] overflow-hidden"
                    >
                        <span className="max-w-0 overflow-hidden whitespace-nowrap text-[#D497FF] text-[10px] lg:text-xs font-bold transition-[max-width,margin,opacity] duration-300 group-hover/more:max-w-[75px] group-hover/more:mr-1.5 leading-none opacity-0 group-hover/more:opacity-100">
                            Xem thêm
                        </span>
                        <ChevronRight size={14} className="text-[#D497FF] transform transition-transform duration-300 group-hover/more:translate-x-0.5 flex-shrink-0" />
                    </TransitionLink>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-2">
                    <button
                        className={`btn-prev-${navId} w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#12151C] hover:bg-[#D497FF] text-white hover:text-black border border-white/10 hover:border-transparent flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer active:scale-90`}
                        aria-label="Previous slide"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <button
                        className={`btn-next-${navId} w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#12151C] hover:bg-[#D497FF] text-white hover:text-black border border-white/10 hover:border-transparent flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer active:scale-90`}
                        aria-label="Next slide"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* 3D Coverflow Stage */}
            <div className="relative py-2 sm:py-4 overflow-hidden rounded-3xl">
                <Swiper
                    modules={[EffectCoverflow, Navigation, Autoplay]}
                    effect="coverflow"
                    grabCursor={true}
                    centeredSlides={true}
                    slidesPerView="auto"
                    loop={true}
                    speed={600}
                    autoplay={{
                        delay: 5000,
                        disableOnInteraction: false,
                        pauseOnMouseEnter: true
                    }}
                    coverflowEffect={{
                        rotate: 8,
                        stretch: 0,
                        depth: 70,
                        modifier: 1,
                        slideShadows: false,
                    }}
                    navigation={{
                        nextEl: `.btn-next-${navId}`,
                        prevEl: `.btn-prev-${navId}`,
                    }}
                    className="featured-coverflow-swiper"
                >
                    {movies.map((movie, index) => {
                        const imgUrl = getImageUrl(movie.thumb_url, { width: 1280, quality: index < 3 ? 85 : 80 });

                        return (
                            <SwiperSlide
                                key={`coverflow-${movie._id || index}`}
                                className="!w-[72vw] sm:!w-[400px] md:!w-[480px] lg:!w-[560px] xl:!w-[640px] 2xl:!w-[720px] transition-all duration-500"
                            >
                                <div className="group/card relative aspect-[16/9] sm:aspect-[16/8.8] md:aspect-[16/8.6] rounded-2xl sm:rounded-3xl overflow-hidden bg-[#0F1115] border border-white/10 shadow-2xl transition-all duration-500">
                                    {/* Backdrop Image */}
                                    <SmartImage
                                        r2Src={getR2MovieThumbUrl(movie.slug)}
                                        src={imgUrl}
                                        rawSrc={getRawImageUrl(movie.thumb_url)}
                                        fallbackSrc={movie.poster_url ? getImageUrl(movie.poster_url, { width: 1000, quality: 75 }) : undefined}
                                        alt={movie.name}
                                        fill
                                        priority={index < 2}
                                        loading={index < 2 ? "eager" : "lazy"}
                                        sizes="(max-width: 640px) 75vw, (max-width: 1024px) 560px, 720px"
                                        className="object-cover object-top transition-transform duration-700 group-hover/card:scale-105 transform-gpu"
                                    />

                                    {/* Clean Scrim at bottom only (Keeping 70% of image 100% bright) */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/60 via-35% to-transparent pointer-events-none" />



                                    {/* Top Badges */}
                                    <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap items-center gap-1.5 sm:gap-2 z-20 pointer-events-none">
                                        <div className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 lg:px-3 lg:py-1 flex items-center justify-center bg-gradient-to-r from-pink-500 to-rose-400 text-white text-[10px] sm:text-[11px] lg:text-xs font-bold rounded shadow-sm leading-none">
                                            ★ {(movie.tmdb?.vote_average || 8.0).toFixed(1)}
                                        </div>
                                        <div className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 lg:px-3 lg:py-1 flex items-center justify-center bg-[#A7F3D0] text-emerald-950 text-[10px] sm:text-[11px] lg:text-xs font-bold rounded shadow-sm leading-none">
                                            {movie.year || 2024}
                                        </div>
                                        <div className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 lg:px-3 lg:py-1 flex items-center justify-center bg-[#F5CAE3] text-pink-950 text-[10px] sm:text-[11px] lg:text-xs font-bold rounded shadow-sm leading-none">
                                            {getEpisodeStatus(movie)}
                                        </div>
                                        {movie.quality && (
                                            <div className="px-2 py-0.5 sm:px-2.5 sm:py-0.5 lg:px-3 lg:py-1 flex items-center justify-center bg-[#FAD078] text-amber-950 text-[10px] sm:text-[11px] lg:text-xs font-bold rounded shadow-sm leading-none">
                                                {movie.quality}
                                            </div>
                                        )}
                                    </div>

                                    {/* Bottom Info Content */}
                                    <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 md:p-5 lg:p-6 z-20 flex items-end justify-between gap-2.5 sm:gap-4">
                                        <div className="flex-1 min-w-0 space-y-0.5 sm:space-y-1">
                                            <TransitionLink
                                                href={`/phim/${movie.slug}`}
                                                className="text-[13px] sm:text-base md:text-xl lg:text-2xl font-bold text-white group-hover/card:text-[#D497FF] transition-colors leading-tight block drop-shadow-md"
                                                title={movie.name}
                                            >
                                                {decodeHtml(movie.name)}
                                            </TransitionLink>
                                            <p
                                                className="text-[10px] sm:text-xs md:text-sm text-white/70 font-medium italic truncate block"
                                                title={movie.origin_name}
                                            >
                                                {decodeHtml(movie.origin_name)}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
                                            <FavoriteButton
                                                movie={movie}
                                                iconSize={16}
                                                className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 flex items-center justify-center text-white transition-colors cursor-pointer"
                                            />
                                            <TransitionLink
                                                href={getMovieWatchUrl(movie)}
                                                className="h-8 sm:h-9 md:h-10 px-3 sm:px-4 md:px-5 rounded-full bg-[#D497FF] hover:brightness-110 text-black font-extrabold text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-[0_0_20px_rgba(212,151,255,0.35)] hover:shadow-[0_0_30px_rgba(212,151,255,0.6)] transition-all duration-300 transform-gpu active:scale-95 cursor-pointer flex-shrink-0"
                                            >
                                                <Play size={13} fill="currentColor" />
                                                <span>Xem ngay</span>
                                            </TransitionLink>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                <SwiperNavButtons
                    prevClassName={`btn-prev-${navId}`}
                    nextClassName={`btn-next-${navId}`}
                    variant="ghost"
                />
            </div>
        </Container>
    );
}

export default memo(FeaturedSlider);
