"use client";

import React, { useEffect } from "react";
import type { HomePrefetch } from "@/app/types/home-prefetch";
import CategoriesSection from "./components/Movies/CategoriesSection/CategoriesSection";
import HeroSlider from "./components/Movies/HeroSlider/HeroSlider";
import MovieRow from "./components/Movies/MovieRow/MovieRow";
import FeaturedSlider from "./components/Movies/FeaturedSlider/FeaturedSlider";
import MoviePosterRow from "./components/Movies/MoviePosterRow/MoviePosterRow";
import TopMovieRow from "./components/Movies/TopMovieRow/TopMovieRow";
import ContinueWatchingRow from "./components/Movies/MovieRow/ContinueWatchingRow";
import RandomMovieRow from "./components/Movies/MovieRow/RandomMovieRow";
import LazyRow from "./components/UI/Common/LazyRow";
import { toast } from "react-hot-toast";
import WideMovieRow from "./components/Movies/MovieRow/WideMovieRow";
import MovieRowSkeleton from "./components/Movies/MovieRow/MovieRowSkeleton";
import MoviePosterRowSkeleton from "./components/Movies/MoviePosterRow/MoviePosterRowSkeleton";
import TopMovieRowSkeleton from "./components/Movies/TopMovieRow/TopMovieRowSkeleton";
import FeaturedSliderSkeleton from "./components/Movies/FeaturedSlider/FeaturedSliderSkeleton";
import RandomMovieRowSkeleton from "./components/Movies/MovieRow/RandomMovieRowSkeleton";
import WideMovieRowSkeleton from "./components/Movies/MovieRow/WideMovieRowSkeleton";
import ReunificationEvent from "./components/Movies/SpecialSections/ReunificationEvent";
import ReunificationEventSkeleton from "./components/Movies/SpecialSections/ReunificationEventSkeleton";
import SocialStatsSection from "./components/Social/SocialStats/SocialStatsSection";

import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export default function HomeClient({ prefetched, activeEvent, initialTopics }: { prefetched: HomePrefetch, activeEvent?: string, initialTopics?: any[] }) {
    const isEventPeriod = activeEvent === 'reunification';

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'verified') {
            toast.success("Xác thực thành công! Chào mừng bạn đến với thế giới điện ảnh LoFilm! ✨🎬", {
                duration: 5000,
                icon: '🎬',
                style: {
                    borderRadius: '16px',
                    background: '#0F1115',
                    color: '#fff',
                    border: '1px solid rgba(251, 191, 36, 0.2)'
                }
            });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    return (
        <>
            <h1 className="sr-only">LoFilm - Xem Phim Online Chất Lượng Cao 4K, Vietsub Miễn Phí</h1>
            <div className="xl:-ml-[100px] xl:w-[calc(100%+100px)]">
                <HeroSlider initialMovies={prefetched.hero} />
            </div>

            <div className="flex flex-col gap-6 md:gap-[50px] pb-20">
                <CategoriesSection initialTopics={initialTopics} />

                {isEventPeriod && (
                    <LazyRow id="event-row" estimatedHeight="600px" skeleton={<ReunificationEventSkeleton />}>
                        <ReunificationEvent />
                    </LazyRow>
                )}


                <ContinueWatchingRow initialHistory={prefetched.initialHistory} />

                <LazyRow id="random-movie-row" estimatedHeight="410px" skeleton={<RandomMovieRowSkeleton />}>
                    <RandomMovieRow />
                </LazyRow>

                <LazyRow id="row-han-quoc" estimatedHeight="370px" skeleton={<MovieRowSkeleton />}>
                    <MovieRow
                        title="Vũ trụ Oppa"
                        apiUrl={`${INTERNAL_API_URL}/quoc-gia/han-quoc?limit=60`}
                        viewAllLink="/quoc-gia/han-quoc"
                        initialMovies={prefetched.movieRowHan}
                        sortByYear={true}
                        revalidate={120}
                    />
                </LazyRow>

                <LazyRow id="row-trung-quoc" estimatedHeight="370px" skeleton={<MovieRowSkeleton />}>
                    <MovieRow
                        title="C-Biz chuẩn gu"
                        apiUrl={`${INTERNAL_API_URL}/quoc-gia/trung-quoc?limit=60`}
                        viewAllLink="/quoc-gia/trung-quoc"
                        initialMovies={prefetched.movieRowTrung}
                        sortByYear={true}
                        revalidate={120}
                    />
                </LazyRow>

                <LazyRow id="row-au-my" estimatedHeight="370px" skeleton={<MovieRowSkeleton />}>
                    <MovieRow
                        title="Hollywood cực cháy"
                        apiUrl={`${INTERNAL_API_URL}/quoc-gia/au-my?limit=60`}
                        viewAllLink="/quoc-gia/au-my"
                        initialMovies={prefetched.movieRowAuMy}
                        sortByYear={true}
                        revalidate={120}
                    />
                </LazyRow>

                <SocialStatsSection />

                <LazyRow id="slider-tv-shows" estimatedHeight="650px" skeleton={<FeaturedSliderSkeleton />}>
                    <FeaturedSlider
                        title="Showbiz cực cuốn"
                        apiUrl={`${INTERNAL_API_URL}/danh-sach/tv-shows?limit=60`}
                        viewAllLink="/danh-sach/tv-shows"
                        navId="featured-tv"
                        initialMovies={prefetched.featuredTv}
                        titleGradient="from-white via-yellow-200 to-amber-400"
                    />
                </LazyRow>

                <LazyRow id="poster-chieu-rap" estimatedHeight="540px" skeleton={<MoviePosterRowSkeleton />}>
                    <MoviePosterRow
                        title="Hội mọt phim rạp"
                        apiUrl={`${INTERNAL_API_URL}/danh-sach/phim-chieu-rap?limit=60`}
                        viewAllLink="/danh-sach/phim-chieu-rap"
                        initialMovies={prefetched.posterChieuRap}
                        sortByYear={true}
                        revalidate={120}
                        titleGradient="from-white via-lime-200 to-lime-400"
                    />
                </LazyRow>

                <LazyRow id="poster-phim-bo" estimatedHeight="540px" skeleton={<MoviePosterRowSkeleton />}>
                    <MoviePosterRow
                        title="Động phim bộ"
                        apiUrl={`${INTERNAL_API_URL}/danh-sach/phim-bo?year=2024&limit=60`}
                        viewAllLink="/danh-sach/phim-bo"
                        initialMovies={prefetched.posterPhimBo}
                        sortByYear={true}
                        revalidate={120}
                        titleGradient="from-white via-sky-200 to-sky-400"
                    />
                </LazyRow>

                <LazyRow id="top-phim-le" estimatedHeight="520px" skeleton={<TopMovieRowSkeleton />}>
                    <TopMovieRow
                        title="Phim lẻ đang lên xu hướng"
                        apiUrl={`${INTERNAL_API_URL}/danh-sach/phim-le?limit=60`}
                        viewAllLink="/danh-sach/phim-le"
                        initialMovies={prefetched.topPhimLe}
                        titleGradient="from-white via-rose-200 to-rose-400"
                    />
                </LazyRow>

                <LazyRow id="top-phim-bo" estimatedHeight="520px" skeleton={<TopMovieRowSkeleton />}>
                    <TopMovieRow
                        title="Top phim bộ cực hot"
                        apiUrl={`${INTERNAL_API_URL}/danh-sach/phim-bo?limit=60`}
                        viewAllLink="/danh-sach/phim-bo"
                        initialMovies={prefetched.topPhimBo}
                        titleGradient="from-white via-emerald-200 to-emerald-400"
                    />
                </LazyRow>

                <LazyRow id="lofilm-nominated" estimatedHeight="520px" skeleton={<TopMovieRowSkeleton />}>
                    <TopMovieRow
                        title="Editor's choice"
                        apiUrl=""
                        viewAllLink="/danh-sach/phim-moi"
                        initialMovies={prefetched.nominated}
                        titleGradient="from-white via-indigo-200 to-indigo-400"
                    />
                </LazyRow>

                <LazyRow id="slider-anime" estimatedHeight="650px" skeleton={<FeaturedSliderSkeleton />}>
                    <FeaturedSlider
                        title="Hệ WeeBoo chính hiệu"
                        apiUrl={`${INTERNAL_API_URL}/danh-sach/hoat-hinh?country=nhat-ban&limit=60`}
                        viewAllLink="/danh-sach/hoat-hinh?country=nhat-ban"
                        navId="featured-anime"
                        initialMovies={prefetched.featuredAnime}
                        titleGradient="from-white via-pink-200 to-pink-400"
                    />
                </LazyRow>

                <LazyRow id="poster-kinh-di" estimatedHeight="540px" skeleton={<MoviePosterRowSkeleton />}>
                    <MoviePosterRow
                        title="Hệ tâm linh cực cháy"
                        apiUrl={`${INTERNAL_API_URL}/the-loai/kinh-di?limit=60`}
                        viewAllLink="/the-loai/kinh-di"
                        initialMovies={prefetched.posterKinhDi}
                        titleGradient="from-white via-red-200 to-red-500"
                    />
                </LazyRow>

                <LazyRow id="poster-hoat-hinh" estimatedHeight="540px" skeleton={<MoviePosterRowSkeleton />}>
                    <MoviePosterRow
                        title="Xứ sở hoạt hình"
                        apiUrl={`${INTERNAL_API_URL}/danh-sach/hoat-hinh?limit=60`}
                        viewAllLink="/danh-sach/hoat-hinh"
                        initialMovies={prefetched.posterHoatHinh}
                        titleGradient="from-white via-cyan-200 to-cyan-400"
                    />
                </LazyRow>

                <LazyRow id="row-phim-ngan" estimatedHeight="410px" skeleton={<WideMovieRowSkeleton />}>
                    <WideMovieRow
                        title="Phim ngắn siêu cuốn"
                        apiUrl={`${INTERNAL_API_URL}/the-loai/phim-ngan?limit=60`}
                        viewAllLink="/the-loai/phim-ngan"
                        initialMovies={prefetched.phimNgan}
                        revalidate={30}
                    />
                </LazyRow>
            </div>
        </>
    );
}
