"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import axios from "axios";
import useSWR from "swr";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Virtual } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { filterDuplicateMovies, getEpisodeStatus, getImageUrl, getRawImageUrl } from "@/app/utils/movieUtils";
import SmartImage from "@/app/components/UI/Common/SmartImage";
import Container from "@/app/components/UI/Container";
import MoviePreviewWrapper from "@/app/components/Movies/MovieCard/MoviePreviewWrapper";
import SwiperNavButtons from "@/app/components/UI/Common/SwiperNavButtons";
import { getR2MoviePosterUrl } from "@/app/utils/r2ImageUrl";
import TopMovieRowSkeleton from "./TopMovieRowSkeleton";

interface TopMovieRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
    titleGradient?: string;
}

function TopMovieRow({ title, apiUrl, viewAllLink, initialMovies, titleGradient = "from-white via-[#E9D5FF] to-[#D497FF]" }: TopMovieRowProps) {
    const seeded = !!(initialMovies && initialMovies.length > 0);
    const navId = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

    const fetcher = async (url: string) => {
        const response = await axios.get(url);
        if (response.data?.status === "success" || response.data?.status === true) {
            return filterDuplicateMovies(response.data.data.items || []).slice(0, 30);
        }
        return [];
    };

    const { data: swrMovies, isLoading: isSwrLoading } = useSWR<Movie[]>(
        seeded ? null : `/api/proxy?url=${encodeURIComponent(apiUrl)}`,
        fetcher,
        { revalidateOnFocus: false, revalidateOnReconnect: true, dedupingInterval: 60000 }
    );

    const movies = seeded ? initialMovies! : (swrMovies || []);
    const isLoading = seeded ? false : isSwrLoading;

    if (isLoading) {
        return <TopMovieRowSkeleton />;
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="top-movie-row-section relative z-30">
            <div className="row-header flex items-center justify-between mb-6">
                <h2 className={`text-[22px] lg:text-[32px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r ${titleGradient} drop-shadow-sm flex items-center gap-4`}>
                    {title}
                </h2>
            </div>

            <div className="row-content relative group/slider">
                <Swiper
                    modules={[Navigation, Virtual]}
                    virtual={{ enabled: true }}
                    spaceBetween={10}
                    navigation={{
                        nextEl: `.sw-next-${navId}`,
                        prevEl: `.sw-prev-${navId}`,
                    }}
                    slidesPerView={2.3}
                    breakpoints={{
                        480: { slidesPerView: 2.8, spaceBetween: 10 },
                        640: { slidesPerView: 3.5, spaceBetween: 12 },
                        768: { slidesPerView: 4.5, spaceBetween: 12 },
                        1024: { slidesPerView: 5.5, spaceBetween: 14 },
                        1280: { slidesPerView: 6.5, spaceBetween: 14 },
                        1536: { slidesPerView: 7.5, spaceBetween: 16 },
                    }}
                    className="w-full"
                >
                    {movies.map((movie, index) => {
                        const rankNumber = index + 1;

                        return (
                            <SwiperSlide key={movie._id} virtualIndex={index}>
                                <MoviePreviewWrapper
                                    movie={movie}
                                    adZone="top_movie"
                                    className="group flex flex-col h-full cursor-pointer w-full"
                                >
                                    {/* Poster Container */}
                                    <div className="relative w-full flex-shrink-0">
                                        <TransitionLink
                                            href={`/phim/${movie.slug}`}
                                            className="relative aspect-[2/3] rounded-lg overflow-hidden bg-[#0F1115] border border-white/5 group-hover:border-[#D497FF]/40 transition-all duration-300 block w-full cursor-pointer"
                                        >
                                            <SmartImage
                                                r2Src={getR2MoviePosterUrl(movie.slug)}
                                                src={getImageUrl(movie.poster_url, { width: 340, quality: 75 })}
                                                rawSrc={getRawImageUrl(movie.poster_url)}
                                                alt={movie.name}
                                                fill
                                                priority={false}
                                                loading="lazy"
                                                sizes="(max-width: 640px) 45vw, (max-width: 1024px) 25vw, 240px"
                                                className="object-cover group-hover:scale-105 transition-transform duration-500 transform-gpu"
                                            />

                                            {/* Bottom Gradient Shadow */}
                                            <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none z-10" />


                                            {/* Badges on Bottom Right */}
                                            <div className="absolute bottom-2 right-2 flex flex-col items-end gap-1 z-20 pointer-events-none">
                                                <div className="h-4.5 px-1.5 bg-[#FAD078] rounded text-amber-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none">
                                                    {movie.quality || "HD"}
                                                </div>
                                                <div className="h-4.5 px-1.5 bg-[#A7F3D0] rounded text-emerald-950 shadow-sm text-[9px] font-bold flex items-center justify-center leading-none">
                                                    {getEpisodeStatus(movie)}
                                                </div>
                                            </div>
                                        </TransitionLink>

                                        {/* Netflix 3D Layered Rank Number */}
                                        <div
                                            className={`ranking-number absolute -bottom-2 sm:-bottom-3 -left-1.5 sm:-left-2 z-20 font-black italic select-none pointer-events-none leading-none tracking-tighter ${
                                                rankNumber >= 10
                                                    ? "text-4xl sm:text-5xl md:text-6xl lg:text-7xl"
                                                    : "text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
                                            }`}
                                            style={{
                                                backgroundImage: rankNumber === 1
                                                    ? 'linear-gradient(180deg, #FFFBEB 0%, #FBBF24 60%, #D97706 100%)'
                                                    : rankNumber === 2
                                                    ? 'linear-gradient(180deg, #FFFFFF 0%, #E2E8F0 50%, #94A3B8 100%)'
                                                    : rankNumber === 3
                                                    ? 'linear-gradient(180deg, #FFF1F2 0%, #FB7185 60%, #E11D48 100%)'
                                                    : 'linear-gradient(180deg, #FFFFFF 0%, #E9D5FF 50%, #D497FF 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.9))'
                                            }}
                                        >
                                            {rankNumber}
                                        </div>
                                    </div>

                                    {/* Movie Info (Fixed Height to prevent layout shift) */}
                                    <div className="pt-2 space-y-1 flex flex-col justify-between">
                                        <div>
                                            <TransitionLink
                                                href={`/phim/${movie.slug}`}
                                                className="text-white text-xs sm:text-sm font-bold leading-tight hover:text-[#D497FF] transition-colors line-clamp-2 cursor-pointer block h-[32px] sm:h-[36px]"
                                                title={movie.name}
                                            >
                                                {decodeHtml(movie.name)}
                                            </TransitionLink>
                                            <p
                                                className="text-white/40 text-[10px] sm:text-[11px] line-clamp-1 font-medium italic mt-0.5 h-[16px]"
                                                title={movie.origin_name}
                                            >
                                                {decodeHtml(movie.origin_name)}
                                            </p>
                                        </div>

                                        <div className="info-line flex flex-wrap items-center gap-1 pt-0.5 h-[16px]">
                                            {(() => {
                                                let partNum = "1";
                                                const nameStr = `${movie.name || ""} ${movie.origin_name || ""}`;
                                                const slugStr = movie.slug || "";

                                                const explicitMatch = nameStr.match(/(?:Phần|Phan|Mùa|Mua|Season|Part|Volume|Vol|Movie|Film)\s*[:\-\s]?\s*0*(\d+)/i);
                                                const colonMatch = nameStr.match(/(?<!Số\s*)[\w\s]+\s+([2-9]|\d{2})\s*[:\-]/i);
                                                const slugMatch = slugStr.match(/-(?:phan|mua|season|part|vol|movie)-0*(\d+)/i);
                                                const endNumberMatch = nameStr.match(/(?<!Số\s*)\b([2-9])\s*$/i);

                                                if (explicitMatch) partNum = explicitMatch[1];
                                                else if (colonMatch) partNum = colonMatch[1];
                                                else if (slugMatch) partNum = slugMatch[1];
                                                else if (endNumberMatch) partNum = endNumberMatch[1];

                                                return (
                                                    <div className="tag-small px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] sm:text-[9.5px] text-white/50 font-medium leading-none whitespace-nowrap">
                                                        Phần {partNum}
                                                    </div>
                                                );
                                            })()}
                                            <div className="tag-small px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[9px] sm:text-[9.5px] text-white/50 font-medium leading-none whitespace-nowrap">
                                                {movie.year || "2024"}
                                            </div>
                                            <div className="tag-small px-1.5 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded text-[9px] sm:text-[9.5px] text-[#D497FF] font-medium leading-none whitespace-nowrap truncate">
                                                {((movie as any).lang_tag || movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
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
        </Container>
    );
}

export default memo(TopMovieRow);
