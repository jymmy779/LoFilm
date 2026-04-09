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
import { getImageUrl, sortAndSlicePosterRowMovies } from "@/app/utils/movieUtils";
import Skeleton from "react-loading-skeleton";
import Container from "@/app/components/Container";
import MoviePosterCard from "@/app/components/MovieCard/MoviePosterCard";
import { enrichMoviesMetadata } from "@/app/utils/enrichmentUtils";
import { createClient } from "@/app/utils/supabase/client";

interface MoviePosterRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
}

export default function MoviePosterRow({ title, apiUrl, viewAllLink, initialMovies }: MoviePosterRowProps) {
    const seeded = !!(initialMovies && initialMovies.length > 0);
    const [movies, setMovies] = useState<Movie[]>(() => initialMovies ?? []);
    const [isLoading, setIsLoading] = useState(!seeded);
    const [user, setUser] = useState<any>(null);
    const navId = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    const supabase = createClient();

    const enrichEpisodeTotals = async (sortedItems: Movie[], isMounted: () => boolean) => {
        await enrichMoviesMetadata({
            items: sortedItems,
            setItems: setMovies,
            isMounted,
            chunkSize: 3,
            delay: 60
        });
    };

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) setUser(session.user);
        };
        fetchUser();
    }, [supabase]);

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
                    const sortedItems = sortAndSlicePosterRowMovies(items);

                    setMovies(sortedItems);
                    setIsLoading(false);

                    void enrichEpisodeTotals(sortedItems, mounted);
                }
            } catch (error) {
                if (isMounted) {
                    if (retryCount < 2) {
                        setTimeout(() => fetchMovies(retryCount + 1), 2000);
                    } else {
                        setIsLoading(false);
                    }
                }
            }
        };
        fetchMovies();
        return () => { isMounted = false; };
    }, [apiUrl, navId, seeded]);

    if (isLoading) {
        return (
            <Container as="section" className="relative z-30 mb-16 mt-8">
                <Skeleton width={200} height={32} className="mb-6 rounded" />
                <div className="flex gap-2.5 md:gap-4 lg:gap-[15px] overflow-hidden">
                    {[...Array(10)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-none w-[calc((100%-10px)/2)] sm:w-[calc((100%-13px*2)/3)] md:w-[calc((100%-13px*3)/4)] xl:w-[calc((100%-13px*5)/6)] 2xl:w-[calc((100%-15px*7)/8)]"
                        >
                            <Skeleton className="aspect-[2/3] rounded-2xl" />
                        </div>
                    ))}
                </div>
            </Container>
        );
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="movie-row-section relative z-30 mb-8 md:mb-12 lg:mb-16 mt-8">
            <div className="row-header flex items-center justify-between mb-6">
                <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-blue-200 via-blue-100 to-white drop-shadow-sm flex items-center gap-4">
                    {title}
                    <TransitionLink
                        href={viewAllLink || "/"}
                        className="group/more flex items-center justify-center bg-[#1a1c23] border border-white/10 rounded-full h-8 w-8 lg:h-10 lg:w-10 transition-all duration-500 hover:border-[#f1c40f]/50 hover:w-[110px] lg:hover:w-[130px] overflow-hidden"
                    >
                        <span className="max-w-0 overflow-hidden whitespace-nowrap text-[#f1c40f] text-[10px] lg:text-xs font-medium transition-all duration-500 group-hover/more:max-w-[80px] group-hover/more:mr-2 leading-none opacity-0 group-hover/more:opacity-100">
                            Xem thêm
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 320 512"
                            width="10"
                            height="10"
                            fill="currentColor"
                            className="text-[#f1c40f] transform transition-transform duration-300 group-hover/more:translate-x-0.5 flex-shrink-0"
                        >
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </TransitionLink>
                </h2>
            </div>

            <div className="row-content">
                <div className="relative group/slider swiper-carousel-container">
                    <Swiper
                        modules={[Navigation]}
                        slidesPerView={2}
                        spaceBetween={10}
                        navigation={{
                            nextEl: `.sw-next-${navId}`,
                            prevEl: `.sw-prev-${navId}`,
                        }}
                        breakpoints={{
                            // Cấu hình responsive cho số lượng slide...
                            640: { slidesPerView: 3, spaceBetween: 13 },
                            768: { slidesPerView: 4, spaceBetween: 13 },
                            1024: { slidesPerView: 5, spaceBetween: 13 },
                            1200: { slidesPerView: 6, spaceBetween: 13 },
                            1400: { slidesPerView: 7, spaceBetween: 15 },
                            1536: { slidesPerView: 8, spaceBetween: 15 }
                        }}
                        className="swiper-carousel"
                    >
                        {movies.map((movie, index) => (
                            <SwiperSlide key={movie._id}>
                                <MoviePosterCard 
                                    movie={movie} 
                                    priority={index < 8} 
                                    isFirst={index === 0} 
                                    isLast={index === movies.length - 1}
                                    user={user}
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    {/* Navigation Buttons */}
                    <button className={`hidden xl:block sw-button sw-prev sw-prev-${navId} absolute -left-6 lg:-left-12 top-[40%] -translate-y-1/2 z-40 text-white/50 hover:text-white transition-colors disabled:opacity-0 cursor-pointer`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="47" height="47" fill="currentColor">
                            <path d="M41.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s-12.5-32.8 0-45.3L109.3 256 246.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"></path>
                        </svg>
                    </button>
                    <button className={`hidden xl:block sw-button sw-next sw-next-${navId} absolute -right-6 lg:-right-12 top-[40%] -translate-y-1/2 z-40 text-white/50 hover:text-white transition-colors disabled:opacity-0 cursor-pointer`}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="47" height="47" fill="currentColor">
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </button>
                </div>
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
