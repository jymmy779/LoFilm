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
import SmartImage from "@/app/components/Common/SmartImage";
import Container from "@/app/components/Container";
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

import TopMovieRowSkeleton from "./TopMovieRowSkeleton";

function TopMovieRow({ title, apiUrl, viewAllLink, initialMovies }: TopMovieRowProps) {
    const seeded = !!(initialMovies && initialMovies.length > 0);
    const [movies, setMovies] = useState<Movie[]>(() => initialMovies ?? []);
    const [isLoading, setIsLoading] = useState(!seeded);
    const navId = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

    useEffect(() => {
        let isMounted = true;
        const mounted = () => isMounted;

        if (seeded && initialMovies!.length > 0) {
            setIsLoading(false);
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
        return <TopMovieRowSkeleton />;
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="top-movie-row-section relative z-30">
            <div className="row-header flex items-center justify-between mb-8">
                <h2 className="text-[22px] lg:text-[32px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-orange-100 to-white drop-shadow-sm flex items-center gap-4">
                    {title}
                </h2>
            </div>

            <div className="row-content relative group/slider">
                <Swiper
                    modules={[Navigation]}
                    spaceBetween={8}
                    navigation={{
                        nextEl: `.sw-next-${navId}`,
                        prevEl: `.sw-prev-${navId}`,
                    }}
                    breakpoints={{
                        0: { slidesPerView: 2, spaceBetween: 8 },
                        480: { slidesPerView: 2.5, spaceBetween: 10 },
                        640: { slidesPerView: 3, spaceBetween: 10 },
                        768: { slidesPerView: 4, spaceBetween: 10 },
                        1024: { slidesPerView: 5, spaceBetween: 10 },
                        1200: { slidesPerView: 6, spaceBetween: 10 },
                        1400: { slidesPerView: 7, spaceBetween: 12 },
                        1536: { slidesPerView: 8, spaceBetween: 12 }
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
                                    className="sw-item group/item cursor-pointer mt-4 transform-gpu flex flex-col h-full"
                                >
                                    <TransitionLink
                                        href={`/phim/${movie.slug}`}
                                        className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-4 bg-[#0a1628] transition-[box-shadow] duration-500 ease-out transform-gpu cursor-pointer"
                                        style={{
                                            WebkitClipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD,
                                            clipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD
                                        }}
                                    >
                                        <div className="w-full h-full transition-transform duration-700 ease-out group-hover/item:scale-110">
                                            <div className="w-full h-full relative">
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

                                        {/* Play Icon Highlight */}
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 bg-black/30 z-10">
                                            <div className="w-10 h-10 rounded-full bg-[#f5a623] text-[#0a1628] flex items-center justify-center shadow-lg transform scale-90 group-hover/item:scale-100 transition-transform duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.54-2.33 2.77-1.613l11.74 6.813a1.614 1.614 0 010 2.825L7.27 20.493c-1.23.717-2.77-.187-2.77-1.613V5.653z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>



                                        {/* Glassmorphism Badges */}
                                        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center flex-wrap gap-1 px-2 z-20 translate-y-1 group-hover/item:translate-y-0 transition-transform duration-300 transform-gpu">
                                            <div className="h-5 px-1.5 bg-gray-500 rounded-md text-white text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
                                                {movie.quality || "HD"}
                                            </div>
                                            <div className="h-5 px-1.5 bg-green-600 rounded-md text-white text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
                                                {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                            </div>
                                            <div className="h-5 px-1.5 bg-amber-600 rounded-md text-white text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
                                                {getEpisodeStatus(movie)}
                                            </div>
                                        </div>
                                    </TransitionLink>

                                    {/* Movie Info */}
                                    <div className="flex gap-2 items-center pr-2">
                                        <div className="ranking-number md:text-4xl text-3xl lg:text-5xl font-black italic select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex-shrink-0 w-6 md:w-8 lg:w-10 flex items-center justify-start"
                                            style={{
                                                color: '#FED877',
                                                backgroundImage: 'linear-gradient(135deg, #FFEFBA 0%, #FED877 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                            }}>
                                            {index + 1}
                                        </div>
                                        <div className="flex flex-col flex-nowrap gap-1.5 min-w-0">
                                            <TransitionLink
                                                href={`/phim/${movie.slug}`}
                                                className="text-white text-sm md:text-base leading-tight hover:text-[#FED877] transition-colors line-clamp-1 lg:font-bold cursor-pointer"
                                            >
                                                {decodeHtml(movie.name)}
                                            </TransitionLink>
                                            <p className="text-white/40 text-[10px] md:text-xs truncate font-medium">
                                                {decodeHtml(movie.origin_name)}
                                            </p>
                                            <div className="info-line flex flex-nowrap items-center gap-1.5 mt-1">
                                                <div className="tag-small px-1.5 py-0.5 bg-[#1a2035]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-bold leading-none whitespace-nowrap">
                                                    {(() => {
                                                        const epMatch = movie.episode_current?.match(/\d+/);
                                                        return epMatch ? `T${epMatch[0]}` : (movie.quality || "HD");
                                                    })()}
                                                </div>
                                                <div className="tag-small px-1.5 py-0.5 bg-[#1a2035]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-medium leading-none whitespace-nowrap">
                                                    {(() => {
                                                        const phanMatch = movie.name?.match(/Phần\s+(\d+)/i) || movie.origin_name?.match(/Season\s+(\d+)/i);
                                                        return phanMatch ? `Phần ${phanMatch[1]}` : (movie.year || "2024");
                                                    })()}
                                                </div>
                                                <div className="tag-small px-1.5 py-0.5 bg-[#1a2035]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-medium leading-none whitespace-nowrap">
                                                    {getEpisodeStatus(movie)}
                                                </div>
                                            </div>
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
