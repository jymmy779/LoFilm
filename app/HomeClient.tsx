"use client";

import React, { useEffect } from "react";
import type { HomePrefetch } from "@/app/types/home-prefetch";
import CategoriesSection from "./components/CategoriesSection/CategoriesSection";
import HeroSlider from "./components/HeroSlider/HeroSlider";
import MovieRow from "./components/MovieRow/MovieRow";
import FeaturedSlider from "./components/FeaturedSlider/FeaturedSlider";
import MoviePosterRow from "./components/MoviePosterRow/MoviePosterRow";
import TopMovieRow from "./components/TopMovieRow/TopMovieRow";
import ContinueWatchingRow from "./components/MovieRow/ContinueWatchingRow";
import RandomMovieRow from "./components/MovieRow/RandomMovieRow";
import LazyRow from "./components/Common/LazyRow";
import { toast } from "react-hot-toast";
import WideMovieRow from "./components/MovieRow/WideMovieRow";
import MovieRowSkeleton from "./components/MovieRow/MovieRowSkeleton";
import MoviePosterRowSkeleton from "./components/MoviePosterRow/MoviePosterRowSkeleton";
import TopMovieRowSkeleton from "./components/TopMovieRow/TopMovieRowSkeleton";
import FeaturedSliderSkeleton from "./components/FeaturedSlider/FeaturedSliderSkeleton";
import RandomMovieRowSkeleton from "./components/MovieRow/RandomMovieRowSkeleton";
import WideMovieRowSkeleton from "./components/MovieRow/WideMovieRowSkeleton";
import ReunificationEvent from "./components/ReunificationEvent";
import ReunificationEventSkeleton from "./components/SpecialSections/ReunificationEventSkeleton";

export default function HomeClient({ prefetched }: { prefetched: HomePrefetch }) {
    const today = new Date();
    const month = today.getMonth() + 1;
    const date = today.getDate();
    const isEventPeriod = (month === 4 && date >= 25) || (month === 5 && date <= 2);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('status') === 'verified') {
            toast.success("Xác thực thành công! Chào mừng bạn đến với thế giới điện ảnh LoFilm! ✨🎬", {
                duration: 5000,
                icon: '🎬',
                style: {
                    borderRadius: '16px',
                    background: '#14233e',
                    color: '#fff',
                    border: '1px solid rgba(251, 191, 36, 0.2)'
                }
            });
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    return (
        <>
            <HeroSlider initialMovies={prefetched.hero} />

            <div className="flex flex-col gap-6 md:gap-[50px] pb-20">
                <CategoriesSection initialCategories={prefetched.categories} />

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
                        title="Phim Hàn Quốc mới"
                        apiUrl="https://phimapi.com/v1/api/quoc-gia/han-quoc?limit=60"
                        viewAllLink="/quoc-gia/han-quoc"
                        initialMovies={prefetched.movieRowHan}
                        sortByYear={true}
                        revalidate={30}
                    />
                </LazyRow>

                <LazyRow id="row-trung-quoc" estimatedHeight="370px" skeleton={<MovieRowSkeleton />}>
                    <MovieRow
                        title="Phim Trung Quốc mới"
                        apiUrl="https://phimapi.com/v1/api/quoc-gia/trung-quoc?limit=60"
                        viewAllLink="/quoc-gia/trung-quoc"
                        initialMovies={prefetched.movieRowTrung}
                        sortByYear={true}
                        revalidate={30}
                    />
                </LazyRow>

                <LazyRow id="row-au-my" estimatedHeight="370px" skeleton={<MovieRowSkeleton />}>
                    <MovieRow
                        title="Phim Âu Mỹ mới"
                        apiUrl="https://phimapi.com/v1/api/quoc-gia/au-my?limit=60"
                        viewAllLink="/quoc-gia/au-my"
                        initialMovies={prefetched.movieRowAuMy}
                        sortByYear={true}
                        revalidate={30}
                    />
                </LazyRow>

                <LazyRow id="slider-tv-shows" estimatedHeight="650px" skeleton={<FeaturedSliderSkeleton />}>
                    <FeaturedSlider
                        title="TV Shows Truyền Hình"
                        apiUrl="https://phimapi.com/v1/api/danh-sach/tv-shows?limit=60"
                        viewAllLink="/danh-sach/tv-shows"
                        navId="featured-tv"
                        initialMovies={prefetched.featuredTv}
                    />
                </LazyRow>

                <LazyRow id="poster-chieu-rap" estimatedHeight="540px" skeleton={<MoviePosterRowSkeleton />}>
                    <MoviePosterRow
                        title="Phim Chiếu Rạp Mới"
                        apiUrl="https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=60"
                        viewAllLink="/danh-sach/phim-chieu-rap"
                        initialMovies={prefetched.posterChieuRap}
                        sortByYear={true}
                        revalidate={30}
                    />
                </LazyRow>

                <LazyRow id="poster-phim-bo" estimatedHeight="540px" skeleton={<MoviePosterRowSkeleton />}>
                    <MoviePosterRow
                        title="Phim Bộ Mới Nhất"
                        apiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo?year=2024&limit=60"
                        viewAllLink="/danh-sach/phim-bo"
                        initialMovies={prefetched.posterPhimBo}
                        sortByYear={true}
                        revalidate={30}
                    />
                </LazyRow>

                <LazyRow id="top-phim-le" estimatedHeight="520px" skeleton={<TopMovieRowSkeleton />}>
                    <TopMovieRow
                        title="Top 30 Phim Lẻ Hôm Nay"
                        apiUrl="https://phimapi.com/v1/api/danh-sach/phim-le?limit=60"
                        viewAllLink="/danh-sach/phim-le"
                        initialMovies={prefetched.topPhimLe}
                    />
                </LazyRow>

                <LazyRow id="top-phim-bo" estimatedHeight="520px" skeleton={<TopMovieRowSkeleton />}>
                    <TopMovieRow
                        title="Top 30 Phim Bộ Hôm Nay"
                        apiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo?limit=60"
                        viewAllLink="/danh-sach/phim-bo"
                        initialMovies={prefetched.topPhimBo}
                    />
                </LazyRow>

                <LazyRow id="lofilm-nominated" estimatedHeight="520px" skeleton={<TopMovieRowSkeleton />}>
                    <TopMovieRow
                        title="LoFilm Đề Cử"
                        apiUrl=""
                        viewAllLink="/danh-sach/phim-moi"
                        initialMovies={prefetched.nominated}
                    />
                </LazyRow>

                <LazyRow id="slider-anime" estimatedHeight="650px" skeleton={<FeaturedSliderSkeleton />}>
                    <FeaturedSlider
                        title="Hoạt Hình Anime Hay"
                        apiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh?country=nhat-ban&limit=60"
                        viewAllLink="/danh-sach/hoat-hinh?country=nhat-ban"
                        navId="featured-anime"
                        initialMovies={prefetched.featuredAnime}
                    />
                </LazyRow>

                <LazyRow id="poster-kinh-di" estimatedHeight="540px" skeleton={<MoviePosterRowSkeleton />}>
                    <MoviePosterRow
                        title="Phim Kinh Dị"
                        apiUrl="https://phimapi.com/v1/api/the-loai/kinh-di?limit=60"
                        viewAllLink="/the-loai/kinh-di"
                        initialMovies={prefetched.posterKinhDi}
                    />
                </LazyRow>

                <LazyRow id="poster-hoat-hinh" estimatedHeight="540px" skeleton={<MoviePosterRowSkeleton />}>
                    <MoviePosterRow
                        title="Phim Hoạt Hình"
                        apiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=60"
                        viewAllLink="/danh-sach/hoat-hinh"
                        initialMovies={prefetched.posterHoatHinh}
                    />
                </LazyRow>

                <LazyRow id="row-phim-ngan" estimatedHeight="410px" skeleton={<WideMovieRowSkeleton />}>
                    <WideMovieRow
                        title="Phim Ngắn Đặc Sắc"
                        apiUrl="https://phimapi.com/v1/api/the-loai/phim-ngan?limit=60"
                        viewAllLink="/the-loai/phim-ngan"
                        initialMovies={prefetched.phimNgan}
                        revalidate={30}
                    />
                </LazyRow>
            </div>
        </>
    );
}
