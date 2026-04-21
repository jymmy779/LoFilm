"use client";

import { memo, useEffect, useState } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { filterDuplicateMovies, getEpisodeStatus, getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import Skeleton from "react-loading-skeleton";
import SmartImage from "@/app/components/Common/SmartImage";
import Container from "@/app/components/Container";
import { enrichMoviesMetadata } from "@/app/utils/enrichmentUtils";
import { useAdTrigger } from "@/app/hooks/useAdTrigger";
import MoviePreviewWrapper from "@/app/components/MovieCard/MoviePreviewWrapper";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";

interface TopMovieRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
}

// Sawtooth clip-path constants (hoisted outside)
const CLIP_PATH_EVEN = 'polygon(0% calc(5% + 16px), 1.2px calc(5% + 9.9px), 4.7px calc(5% + 4.7px), 9.9px calc(5% + 1.2px), 16px 5%, 100% 0, 100% 100%, 0% 100%)';
const CLIP_PATH_ODD = 'polygon(0 0, calc(100% - 16px) 5%, calc(100% - 9.9px) calc(5% + 1.2px), calc(100% - 4.7px) calc(5% + 4.7px), calc(100% - 1.2px) calc(5% + 9.9px), 100% calc(5% + 16px), 100% 100%, 0% 100%)';

function TopMovieRow({ title, apiUrl, viewAllLink, initialMovies }: TopMovieRowProps) {
    const { openAdOnly } = useAdTrigger();
    const seeded = !!(initialMovies && initialMovies.length > 0);
    const [movies, setMovies] = useState<Movie[]>(() => initialMovies ?? []);
    const [isLoading, setIsLoading] = useState(!seeded);
    const navId = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

    const handleAdClick = () => {
        openAdOnly("top_movie");
    };

    const enrichEpisodeTotals = async (topItems: Movie[], isMounted: () => boolean) => {
        await enrichMoviesMetadata({
            items: topItems,
            setItems: setMovies,
            isMounted,
            chunkSize: 3,
            delay: 60
        });
    };

    useEffect(() => {
        let isMounted = true;
        const mounted = () => isMounted;

        if (seeded && initialMovies!.length > 0) {
            setIsLoading(false);
            void enrichEpisodeTotals(initialMovies!, mounted);
            return () => { isMounted = false; };
        }

        const fetchMovies = async (retryCount = 0) => {
            if (!isMounted) return;
            try {
                const response = await axios.get(`/api/proxy?url=${encodeURIComponent(apiUrl)}`);
                if (isMounted && (response.data?.status === "success" || response.data?.status === true) && response.data?.data?.items) {
                    const items: Movie[] = response.data.data.items;

                    const filtered = filterDuplicateMovies(items);
                    const topItems = filtered.slice(0, 30);
                    setMovies(topItems);
                    setIsLoading(false);

                    await enrichEpisodeTotals(topItems, mounted);
                    return;
                }
            } catch (error: any) {
                if (isMounted) {
                    if (retryCount < 3 && (error.code === "ERR_NETWORK" || !error.response)) {
                        console.warn(`Thử lại TopMovieRow lần ${retryCount + 1}...`);
                        setTimeout(() => fetchMovies(retryCount + 1), 1000 * (retryCount + 1));
                        return;
                    }
                    console.error("Lỗi khi tải top phim:", error);
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };
        fetchMovies();
        return () => { isMounted = false; };
    }, [apiUrl, navId, seeded]);

    if (isLoading) {
        return (
            <Container as="section" className="relative z-30 mb-16 mt-8">
                <div className="flex items-center justify-between mb-8">
                    <Skeleton width={300} height={32} className="rounded-lg md:h-10" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 min-[1200px]:grid-cols-6 min-[1400px]:grid-cols-7 2xl:grid-cols-8 gap-[10px] sm:gap-[13px] min-[1400px]:gap-[15px] overflow-hidden pt-[5px] pb-[20px]">
                    {[...Array(8)].map((_, i) => {
                        const isEven = i % 2 !== 0;
                        const visibilityClass = i < 2 ? "" : 
                            i === 2 ? "hidden sm:block" :
                            i === 3 ? "hidden md:block" :
                            i === 4 ? "hidden lg:block" :
                            i === 5 ? "hidden min-[1200px]:block" :
                            i === 6 ? "hidden min-[1400px]:block" :
                            "hidden 2xl:block";

                        return (
                            <div
                                key={i}
                                className={`flex flex-col mt-4 w-full ${visibilityClass}`}
                            >
                                {/* Poster Skeleton */}
                                <div
                                    className="v-thumbnail relative aspect-[2/3] rounded-2xl overflow-hidden mb-4 skeleton-shimmer border border-white/5 w-full"
                                    style={{
                                        WebkitClipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD,
                                        clipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD
                                    }}
                                />

                                {/* Ranking & Info Skeleton */}
                                <div className="flex gap-2 items-start pr-2">
                                    <div className="h-10 w-8 md:w-10 lg:w-13 rounded-md skeleton-shimmer opacity-20 flex-shrink-0" />
                                    <div className="flex flex-col gap-2 min-w-0 pt-2 lg:pt-3 w-full">
                                        <div className="h-4 w-full rounded-md skeleton-shimmer opacity-40" />
                                        <div className="h-3 w-2/3 rounded-md skeleton-shimmer opacity-20" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Container>
        );
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="top-movie-row-section relative z-30 mb-16 mt-8 animate-fade-in">
            <div className="row-header flex items-center justify-between mb-8">
                <h2 className="text-[22px] lg:text-[32px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-100 to-white drop-shadow-sm flex items-center gap-4">
                    {title}
                </h2>
            </div>

            <div className="row-content relative group/slider">
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={10}
                    slidesPerView={2}
                    navigation={{
                        nextEl: `.sw-next-${navId}`,
                        prevEl: `.sw-prev-${navId}`,
                    }}
                    breakpoints={{
                        640: { slidesPerView: 3, spaceBetween: 13 },
                        768: { slidesPerView: 4, spaceBetween: 13 },
                        1024: { slidesPerView: 5, spaceBetween: 13 },
                        1200: { slidesPerView: 6, spaceBetween: 13 },
                        1400: { slidesPerView: 7, spaceBetween: 15 },
                        1536: { slidesPerView: 8, spaceBetween: 15 }
                    }}
                    className="swiper-carousel"
                >
                    {movies.map((movie, index) => {
                        const isEven = index % 2 !== 0;

                        return (
                            <SwiperSlide key={movie._id} className="transform-gpu">
                                <MoviePreviewWrapper
                                    movie={movie}
                                    adZone="top_movie"
                                    className="sw-item group/item cursor-pointer mt-4 transform-gpu"
                                >
                                    <TransitionLink
                                        href={`/phim/${movie.slug}`}
                                        onClick={handleAdClick}
                                        className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-4 bg-white/5 border border-white/5 transition-[transform,box-shadow] duration-500 ease-out group-hover/item:shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform-gpu cursor-pointer"
                                        style={{
                                            WebkitClipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD,
                                            clipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD
                                        }}
                                    >
                                        <div className="w-full h-full transition-transform duration-500 ease-out group-hover/item:scale-[1.07]">
                                            <div className="w-full h-full relative group-hover/item:animate-[top-movie-shake_0.15s_ease-in-out_3]">
                                                <SmartImage
                                                    src={getImageUrl(movie.poster_url, { width: 250, quality: 75 })}
                                                    rawSrc={getRawImageUrl(movie.poster_url)}
                                                    alt={movie.name}
                                                    fill
                                                    priority={false}
                                                    loading="lazy"
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                                                    className="object-cover transform-gpu"
                                                />
                                            </div>
                                        </div>
                                        <div className="absolute inset-x-0 bottom-[-1px] h-1/2 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                                        <div className="pin-new absolute bottom-2 left-0 right-0 flex items-center justify-center flex-wrap gap-x-1 gap-y-1 px-2">
                                            <div className="h-5 px-1 bg-gray-600 rounded-full text-white text-[10px] border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                                                {movie.quality || "HD"}
                                            </div>
                                            <div className="h-5 px-1 bg-green-600 rounded-full text-white text-[10px] border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                                                {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                            </div>
                                            <div className="h-5 px-1 bg-orange-600 rounded-full text-white text-[10px] border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                                                {getEpisodeStatus(movie)}
                                            </div>
                                        </div>
                                    </TransitionLink>

                                    {/* Movie Info */}
                                    <div className="flex gap-2 items-start pr-2">
                                        <div className="ranking-number md:text-4xl text-3xl lg:text-5xl font-black italic select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex-shrink-0 w-8 md:w-10 lg:w-13 flex items-center justify-start"
                                            style={{
                                                color: '#FED877',
                                                backgroundImage: 'linear-gradient(135deg, #FFEFBA 0%, #FED877 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                            }}>
                                            {index + 1}
                                        </div>
                                        <div className="flex flex-col gap-1 min-w-0 pt-2 lg:pt-3">
                                            <TransitionLink
                                                href={`/phim/${movie.slug}`}
                                                onClick={handleAdClick}
                                                className="text-white text-sm md:text-base leading-tight hover:text-[#FED877] transition-colors line-clamp-1 lg:font-bold cursor-pointer"
                                            >
                                                {decodeHtml(movie.name)}
                                            </TransitionLink>
                                            <p className="text-white/40 text-[10px] md:text-xs truncate font-medium">
                                                {decodeHtml(movie.origin_name)}
                                            </p>
                                        </div>
                                    </div>
                                </MoviePreviewWrapper>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                <SwiperNavButtons
                    prevClassName={`sw-prev-${navId}`}
                    nextClassName={`sw-next-${navId}`}
                    variant="ghost"
                />
            </div>

            <style jsx global>{`
                .swiper-carousel .swiper-wrapper {
                    padding-bottom: 20px;
                    padding-top: 5px;
                }
                @keyframes top-movie-shake {
                    0%, 100% { transform: rotate(0.2deg); }
                    50% { transform: rotate(-0.2deg); }
                }
            `}</style>
        </Container>
    );
}

export default memo(TopMovieRow);
