"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/UI/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Virtual } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import { getImageUrl } from "@/app/utils/movieUtils";
import Container from "@/app/components/UI/Container";
import MoviePosterCard from "@/app/components/Movies/MovieCard/MoviePosterCard";
import MovieCardSkeleton from "@/app/components/Movies/MovieCard/MovieCardSkeleton";
import { useMovies } from "@/app/hooks/useMovies";
import SwiperNavButtons from "@/app/components/UI/Common/SwiperNavButtons";
import { useAuth } from "@/app/components/User/Auth/AuthContext";

interface MoviePosterRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
    sortByYear?: boolean;
    revalidate?: number;
    titleGradient?: string;
}

import MoviePosterRowSkeleton from "./MoviePosterRowSkeleton";

function MoviePosterRow({ title, apiUrl, viewAllLink, initialMovies, sortByYear = false, revalidate, titleGradient = "from-white via-[#E9D5FF] to-[#D497FF]" }: MoviePosterRowProps) {
    const navId = title.toLowerCase().replace(/\s+/g, "-").replace(/[^\w-]/g, "");
    const { user } = useAuth();

    const { movies, isLoading } = useMovies({
        apiUrl,
        initialMovies,
        limit: 20,
        sortByYear,
        revalidate
    });

    if (isLoading) {
        return <MoviePosterRowSkeleton />;
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="movie-row-section relative z-30">
            <div className="row-header flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <h2 className={`text-[20px] lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r ${titleGradient} drop-shadow-sm`}>
                        {title}
                    </h2>
                    <TransitionLink
                        href={viewAllLink || "/"}
                        className="group/more flex items-center justify-center bg-[#0F1115] border border-white/10 rounded-full h-8 w-8 lg:h-10 lg:w-10 transition-[width,border-color,box-shadow] duration-500 hover:border-[#D497FF]/50 hover:w-[110px] lg:hover:w-[130px] overflow-hidden hover:shadow-lg hover:shadow-[#D497FF]/20"
                    >
                        <span className="max-w-0 overflow-hidden whitespace-nowrap text-[#D497FF] text-[10px] lg:text-xs font-bold transition-[max-width,margin,opacity] duration-500 group-hover/more:max-w-[80px] group-hover/more:mr-2 leading-none opacity-0 group-hover/more:opacity-100">
                            Xem thêm
                        </span>
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 320 512"
                            width="10"
                            height="10"
                            fill="currentColor"
                            className="text-[#D497FF] transform transition-transform duration-300 group-hover/more:translate-x-0.5 flex-shrink-0"
                        >
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </TransitionLink>
                </div>
            </div>

            <div className="row-content">
                <div className="relative group/slider swiper-carousel-container">
                    <Swiper
                        modules={[Navigation, Virtual]}
                        virtual={{ enabled: true }}
                        slidesPerView={2}
                        spaceBetween={8}
                        navigation={{
                            nextEl: `.sw-next-${navId}`,
                            prevEl: `.sw-prev-${navId}`,
                        }}
                        breakpoints={{
                            // Cấu hình responsive cho số lượng slide...
                            640: { slidesPerView: 3, spaceBetween: 10 },
                            768: { slidesPerView: 4, spaceBetween: 10 },
                            1024: { slidesPerView: 5, spaceBetween: 10 },
                            1200: { slidesPerView: 6, spaceBetween: 10 },
                            1400: { slidesPerView: 7, spaceBetween: 12 },
                            1536: { slidesPerView: 8, spaceBetween: 12 }
                        }}
                        className="swiper-carousel poster-carousel"
                    >
                        {movies.map((movie, index) => (
                            <SwiperSlide key={movie._id} virtualIndex={index}>
                                <MoviePosterCard
                                    movie={movie}
                                    priority={index < 8}
                                    isFirst={index === 0}
                                    isLast={index === movies.length - 1}
                                    user={user}
                                    adZone="movie_poster_row"
                                />
                            </SwiperSlide>
                        ))}
                    </Swiper>

                    <SwiperNavButtons
                        prevClassName={`sw-prev-${navId}`}
                        nextClassName={`sw-next-${navId}`}
                        variant="ghost"
                    />
                </div>
            </div>

            <style jsx global>{`
                .poster-carousel .swiper-wrapper {
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

export default memo(MoviePosterRow);

