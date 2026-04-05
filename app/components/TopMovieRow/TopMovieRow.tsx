"use client";

import { useEffect, useState } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import axios from "axios";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { decodeHtml } from "@/app/utils/textUtils";
import { filterDuplicateMovies, getEpisodeStatus, getImageUrl } from "@/app/utils/movieUtils";
import Skeleton from "react-loading-skeleton";
import Image from "next/image";
import Container from "@/app/components/Container";

interface TopMovieRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
}

export default function TopMovieRow({ title, apiUrl, viewAllLink, initialMovies }: TopMovieRowProps) {
    const seeded = !!(initialMovies && initialMovies.length > 0);
    const [movies, setMovies] = useState<Movie[]>(() => initialMovies ?? []);
    const [isLoading, setIsLoading] = useState(!seeded);
    const navId = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");

    const enrichEpisodeTotals = async (topItems: Movie[], isMounted: () => boolean) => {
        const enriched = [...topItems];
        const chunkSize = 5;

        for (let i = 0; i < topItems.length; i += chunkSize) {
            if (!isMounted()) break;
            const chunk = topItems.slice(i, i + chunkSize);
            await Promise.all(
                chunk.map(async (movie: Movie, chunkIdx: number) => {
                    const isMultiEpisode = ["series", "hoathinh", "tvshows"].includes(movie.type || "");
                    if (isMultiEpisode && !movie.episode_current?.includes("/")) {
                        try {
                            const detailRes = await axios.get(`/api/proxy?url=${encodeURIComponent(`https://phimapi.com/phim/${movie.slug}`)}`);
                            if (detailRes.data?.movie?.episode_total) {
                                const globalIdx = i + chunkIdx;
                                enriched[globalIdx] = { ...enriched[globalIdx], episode_total: detailRes.data.movie.episode_total };
                            }
                        } catch (e) {
                            console.error(`Lỗi tải detail cho ${movie.slug}:`, e);
                        }
                    }
                })
            );
            setMovies([...enriched]);
        }
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
            <Container as="section" className="relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
                <Skeleton width={300} height={40} className="mb-8 rounded-lg" />
                <div className="flex gap-[10px] sm:gap-[13px] xl:gap-[15px] overflow-hidden">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-none mt-4 w-[calc((100%-10px)/2)] sm:w-[calc((100%-13px*2)/3)] md:w-[calc((100%-13px*3)/4)] xl:w-[calc((100%-13px*5)/6)] 2xl:w-[calc((100%-15px*7)/8)]"
                        >
                            <div className="bg-white/5 rounded-2xl overflow-hidden aspect-[2/3] mb-4">
                                <Skeleton className="w-full h-full" />
                            </div>
                            <div className="flex gap-2 items-start h-16">
                                <div className="flex-shrink-0 w-10 md:w-13">
                                    <Skeleton height={42} width="100%" />
                                </div>
                                <div className="flex-1 flex flex-col gap-1.5 pt-2">
                                    <Skeleton height={16} width="100%" />
                                    <Skeleton height={12} width="60%" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Container>
        );
    }

    if (movies.length === 0) return null;

    // Sawtooth clip-path constants (hoisted outside render loop)
    const clipPathEven = 'polygon(0% calc(5% + 16px), 1.2px calc(5% + 9.9px), 4.7px calc(5% + 4.7px), 9.9px calc(5% + 1.2px), 16px 5%, 100% 0, 100% 100%, 0% 100%)';
    const clipPathOdd = 'polygon(0 0, calc(100% - 16px) 5%, calc(100% - 9.9px) calc(5% + 1.2px), calc(100% - 4.7px) calc(5% + 4.7px), calc(100% - 1.2px) calc(5% + 9.9px), 100% calc(5% + 16px), 100% 100%, 0% 100%)';

    return (
        <Container as="section" className="top-movie-row-section relative z-30 mb-16 mt-8">
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
                        576: { slidesPerView: 3, spaceBetween: 13 },
                        767: { slidesPerView: 4, spaceBetween: 13 },
                        // Laptop: Hiện 6 cái...
                        1200: { slidesPerView: 6, spaceBetween: 13 },
                        // Desktop: Hiện 7 cái...
                        1400: { slidesPerView: 7, spaceBetween: 15 },
                        // Màn hình lớn nhất: Hiện 8 cái... 
                        1536: { slidesPerView: 8, spaceBetween: 15 }
                    }}
                    className="swiper-carousel"
                >
                    {movies.map((movie, index) => {
                        const posterImg = getImageUrl(movie.poster_url);
                        const isEven = index % 2 !== 0;

                        return (
                            <SwiperSlide key={movie._id} className="transform-gpu">
                                <div className="sw-item group/item cursor-pointer mt-4 transform-gpu">
                                    <TransitionLink
                                        href={`/phim/${movie.slug}`}
                                        className="v-thumbnail relative block aspect-[2/3] rounded-2xl overflow-hidden mb-4 bg-white/5 border border-white/5 transition-[transform,box-shadow] duration-500 ease-out group-hover/item:shadow-[0_15px_35px_rgba(0,0,0,0.6)] transform-gpu"
                                        style={{
                                            WebkitClipPath: isEven ? clipPathEven : clipPathOdd,
                                            clipPath: isEven ? clipPathEven : clipPathOdd
                                        }}
                                    >

                                        <div className="w-full h-full transition-transform duration-500 ease-out group-hover/item:scale-[1.07]">
                                            <div className="w-full h-full relative group-hover/item:animate-[top-movie-shake_0.15s_ease-in-out_3]">
                                                <Image
                                                    src={posterImg}
                                                    alt={movie.name}
                                                    fill
                                                    priority={index < 8}
                                                    loading={index < 8 ? "eager" : "lazy"}
                                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                                                    className="object-cover transform-gpu"
                                                />
                                            </div>
                                        </div>
                                        <div className="absolute inset-x-0 bottom-[-1px] h-1/2 bg-gradient-to-t from-black/95 via-black/40 to-transparent pointer-events-none" />

                                        {/* Badges: Quality, Language, Status */}
                                        <div className="pin-new absolute bottom-2 left-0 right-0 flex items-center justify-center flex-wrap gap-x-1 gap-y-1 px-2">
                                            {/* Badge Quality - Xám */}
                                            <div className="h-5 px-1 bg-gray-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                                                {movie.quality || "HD"}
                                            </div>

                                            {/* Badge Language - Xanh (Vietsub, LT, TM) */}
                                            <div className="h-5 px-1 bg-green-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
                                                {(movie.lang || "Vietsub").replace(/Lồng Tiếng/g, "LT").replace(/Thuyết Minh/g, "TM")}
                                            </div>

                                            {/* Badge Status - Cam (Full, Trailer, HT) */}
                                            <div className="h-5 px-1 bg-orange-600 rounded-full text-white text-[10px]  border border-white/10 flex items-center justify-center whitespace-nowrap min-w-fit">
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
                                            <h3 className="text-white text-sm md:text-base leading-tight hover:text-[#FED877] transition-colors line-clamp-1 lg:font-bold">
                                                {decodeHtml(movie.name)}
                                            </h3>
                                            <p className="text-white/40 text-[10px] md:text-xs truncate font-medium">
                                                {decodeHtml(movie.origin_name)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </SwiperSlide>
                        );
                    })}
                </Swiper>

                {/* Navigation Buttons */}
                <button className={`xl:block hidden sw-button sw-prev sw-prev-${navId} absolute -left-6 lg:-left-12 top-[35%] -translate-y-1/2 z-40 text-white/30 hover:text-white transition-colors disabled:opacity-0 cursor-pointer`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="47" height="47" fill="currentColor">
                        <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s-12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path>
                    </svg>
                </button>
                <button className={`xl:block hidden sw-button sw-next sw-next-${navId} absolute -right-6 lg:-right-12 top-[35%] -translate-y-1/2 z-40 text-white/30 hover:text-white transition-colors disabled:opacity-0 cursor-pointer`}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="47" height="47" fill="currentColor">
                        <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                    </svg>
                </button>
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
