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

interface TopMovieRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
    titleGradient?: string;
}

// Sawtooth clip-path constants (hoisted outside)
const CLIP_PATH_EVEN = 'polygon(0% calc(5% + 16px), 1.2px calc(5% + 9.9px), 4.7px calc(5% + 4.7px), 9.9px calc(5% + 1.2px), 16px 5%, 100% 0, 100% 100%, 0% 100%)';
const CLIP_PATH_ODD = 'polygon(0 0, calc(100% - 16px) 5%, calc(100% - 9.9px) calc(5% + 1.2px), calc(100% - 4.7px) calc(5% + 4.7px), calc(100% - 1.2px) calc(5% + 9.9px), 100% calc(5% + 16px), 100% 100%, 0% 100%)';

import TopMovieRowSkeleton from "./TopMovieRowSkeleton";

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
            <div className="row-header flex items-center justify-between mb-8">
                <h2 className={`text-[22px] lg:text-[32px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r ${titleGradient} drop-shadow-sm flex items-center gap-4`}>
                    {title}
                </h2>
            </div>

            <div className="row-content relative group/slider">
                <Swiper
                    modules={[Navigation, Virtual]}
                    virtual={{ enabled: true }}
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
                    className="swiper-carousel top-movie-carousel"
                >
                    {movies.map((movie, index) => {
                        const isEven = index % 2 !== 0;

                        return (
                            <SwiperSlide key={movie._id} virtualIndex={index} className="transform-gpu">
                                <MoviePreviewWrapper
                                    movie={movie}
                                    adZone="top_movie"
                                    className="sw-item group/item cursor-pointer mt-4 transform-gpu flex flex-col h-full"
                                >
                                    <TransitionLink
                                        href={`/phim/${movie.slug}`}
                                        className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-4 bg-[#0F1115] transition-[box-shadow] duration-500 ease-out transform-gpu cursor-pointer"
                                        style={{
                                            WebkitClipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD,
                                            clipPath: isEven ? CLIP_PATH_EVEN : CLIP_PATH_ODD
                                        }}
                                    >
                                        <div className="w-full h-full transition-transform duration-700 ease-out group-hover/item:scale-110">
                                            <div className="w-full h-full relative">
                                                <SmartImage
                                                    r2Src={getR2MoviePosterUrl(movie.slug)}
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
                                            <div className="w-10 h-10 rounded-full bg-[#D497FF] text-black flex items-center justify-center shadow-lg shadow-[#D497FF]/50 transform scale-90 group-hover/item:scale-100 transition-transform duration-300">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
                                                    <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.54-2.33 2.77-1.613l11.74 6.813a1.614 1.614 0 010 2.825L7.27 20.493c-1.23.717-2.77-.187-2.77-1.613V5.653z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                        </div>



                                        {/* Glassmorphism Badges */}
                                        <div className="absolute bottom-2 left-0 right-0 flex items-center justify-center flex-wrap gap-1 px-2 z-20 translate-y-1 group-hover/item:translate-y-0 transition-transform duration-300 transform-gpu">
                                            <div className="h-5 px-1.5 bg-[#FAD078] rounded-md text-amber-950 shadow-sm text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
                                                {movie.quality || "HD"}
                                            </div>
                                            <div className="h-5 px-1.5 bg-[#C084FC] rounded-md text-purple-950 shadow-sm text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
                                                {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                            </div>
                                            <div className="h-5 px-1.5 bg-[#A7F3D0] rounded-md text-emerald-950 shadow-sm text-[9px] font-bold flex items-center justify-center whitespace-nowrap tracking-tighter leading-none">
                                                {getEpisodeStatus(movie)}
                                            </div>
                                        </div>
                                    </TransitionLink>

                                    {/* Movie Info */}
                                    <div className="flex gap-2 items-center pr-2">
                                        <div className="ranking-number md:text-4xl text-3xl lg:text-5xl font-black italic select-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] flex-shrink-0 w-6 md:w-8 lg:w-10 flex items-center justify-start"
                                            style={{
                                                color: '#D497FF',
                                                backgroundImage: 'linear-gradient(135deg, #FFFFFF 0%, #E9D5FF 45%, #D497FF 100%)',
                                                WebkitBackgroundClip: 'text',
                                                WebkitTextFillColor: 'transparent',
                                                opacity: 1
                                            }}>
                                            {index + 1}
                                        </div>
                                        <div className="flex flex-col flex-nowrap gap-1.5 min-w-0">
                                            <TransitionLink
                                                href={`/phim/${movie.slug}`}
                                                className="text-white text-sm md:text-base leading-tight hover:text-[#D497FF] transition-colors line-clamp-1 lg:font-bold cursor-pointer"
                                            >
                                                {decodeHtml(movie.name)}
                                            </TransitionLink>
                                            <p className="text-white/40 text-[10px] md:text-xs truncate font-medium">
                                                {decodeHtml(movie.origin_name)}
                                            </p>
                                            <div className="info-line flex flex-nowrap items-center gap-1 mt-1">
                                                {(() => {
                                                    const phanNameMatch = movie.name?.match(/Phần\s+(\d+)/i);
                                                    if (phanNameMatch) return (
                                                        <div className="tag-small px-1.5 py-0.5 bg-[#0F1115]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-bold leading-none whitespace-nowrap">
                                                            Phần {phanNameMatch[1]}
                                                        </div>
                                                    );
                                                    const seasonMatch = movie.origin_name?.match(/Season\s+(\d+)/i);
                                                    if (seasonMatch) return (
                                                        <div className="tag-small px-1.5 py-0.5 bg-[#0F1115]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-bold leading-none whitespace-nowrap">
                                                            Phần {seasonMatch[1]}
                                                        </div>
                                                    );
                                                    const slugPhanMatch = movie.slug?.match(/-phan-(\d+)/i);
                                                    if (slugPhanMatch) return (
                                                        <div className="tag-small px-1.5 py-0.5 bg-[#0F1115]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-bold leading-none whitespace-nowrap">
                                                            Phần {slugPhanMatch[1]}
                                                        </div>
                                                    );
                                                    const slugSeasonMatch = movie.slug?.match(/-season-(\d+)/i);
                                                    if (slugSeasonMatch) return (
                                                        <div className="tag-small px-1.5 py-0.5 bg-[#0F1115]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-bold leading-none whitespace-nowrap">
                                                            Phần {slugSeasonMatch[1]}
                                                        </div>
                                                    );
                                                    return null; // Ẩn tag nếu không có thông tin phần
                                                })()}
                                                <div className="tag-small px-1.5 py-0.5 bg-[#0F1115]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-medium leading-none whitespace-nowrap">
                                                    {movie.year || "2024"}
                                                </div>
                                                <div className="tag-small px-1.5 py-0.5 bg-[#0F1115]/80 rounded text-[9.5px] md:text-[10.5px] text-white/50 font-medium leading-none whitespace-nowrap">
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
                .top-movie-carousel .swiper-wrapper {
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

