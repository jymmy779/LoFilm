"use client";

import { memo } from "react";
import TransitionLink from "@/app/components/Transition/TransitionLink";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

import { Movie } from "@/app/types/movie";
import Container from "@/app/components/Container";
import MovieRowCard from "@/app/components/MovieCard/MovieRowCard";
import { useMovies } from "@/app/hooks/useMovies";
import SwiperNavButtons from "@/app/components/Common/SwiperNavButtons";

interface MovieRowProps {
    title: string;
    apiUrl: string;
    viewAllLink: string;
    initialMovies?: Movie[];
    sortByYear?: boolean;
    shouldEnrich?: boolean;
    revalidate?: number;
}

import { useAdTrigger } from "@/app/hooks/useAdTrigger";

import MovieRowSkeleton from "./MovieRowSkeleton";

function MovieRow({
    title,
    apiUrl,
    viewAllLink,
    initialMovies,
    sortByYear = false,
    shouldEnrich = false,
    revalidate
}: MovieRowProps) {
    const { openAdOnly } = useAdTrigger();
    const { movies, isLoading } = useMovies({ apiUrl, initialMovies, sortByYear, shouldEnrich, revalidate });

    const navId = title.replace(/\s+/g, '-').toLowerCase();

    const handleAdClick = () => {
        openAdOnly("movie_row");
    };

    if (isLoading) {
        return <MovieRowSkeleton />;
    }

    if (movies.length === 0) return null;

    return (
        <Container as="section" className="relative z-30 animate-fade-in">
            <div className="flex flex-col xl:flex-row gap-4 md:gap-6 lg:gap-8 bg-white/[0.03] p-4 md:p-6 lg:p-10 rounded-[2rem] border border-white/5 hover:border-white/10 transition-[border-color] duration-500 shadow-2xl">

                {/* === LEFT SIDE: TITLE & LINK === */}
                <div className="w-full xl:w-[260px] xl:flex-shrink-0 flex xl:flex-col justify-between xl:justify-center gap-4">
                    <h2 className="text-[20px] lg:text-[28px] font-bold !leading-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-200 via-pink-100 to-white drop-shadow-sm">
                        {title}
                    </h2>

                    <TransitionLink
                        href={viewAllLink}
                        className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm tracking-wider w-max md:mt-2"
                    >
                        <span className="md:block hidden">Xem toàn bộ</span>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width="12" height="12" fill="currentColor">
                            <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"></path>
                        </svg>
                    </TransitionLink>
                </div>

                {/* === RIGHT SIDE: SWIPER === */}
                <div className="w-full xl:w-[calc(100%-292px)] relative group/slider">
                    <Swiper
                        modules={[Navigation]}
                        slidesPerView={"auto"}
                        spaceBetween={8}
                        breakpoints={
                            {
                                1280: { spaceBetween: 16 },
                                767: { spaceBetween: 14 },
                                576: { spaceBetween: 12 },
                            }
                        }
                        navigation={{
                            nextEl: `.btn-next-${navId}`,
                            prevEl: `.btn-prev-${navId}`,
                        }}
                        className="swiper-carousel"
                    >
                        {movies.map((movie, index) => {
                            const eager = index < 3;

                            return (
                                <SwiperSlide key={movie._id} className="!w-[160px] sm:!w-[200px] md:!w-[240px] lg:!w-[280px]">
                                    <MovieRowCard
                                        movie={movie}
                                        priority={eager}
                                        onClick={handleAdClick}
                                    />
                                </SwiperSlide>
                            );
                        })}
                    </Swiper>

                    <SwiperNavButtons
                        prevClassName={`btn-prev-${navId}`}
                        nextClassName={`btn-next-${navId}`}
                    />

                </div>
            </div>
        </Container>
    );
}

export default memo(MovieRow);
