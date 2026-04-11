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

export default function HomeClient({ prefetched }: { prefetched: HomePrefetch }) {
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
            // Xóa param trên URL cho đẹp
            window.history.replaceState({}, '', window.location.pathname);
        }
    }, []);

    return (
        <>
            <HeroSlider initialMovies={prefetched.hero} />

            <CategoriesSection initialCategories={prefetched.categories} />

            <ContinueWatchingRow initialHistory={prefetched.initialHistory} />

            <RandomMovieRow />

            <LazyRow estimatedHeight="500px">
                {/* Phim Hàn Quốc bây giờ được load lazy */}
                <MovieRow
                    title="Phim Hàn Quốc mới"
                    apiUrl="https://phimapi.com/v1/api/quoc-gia/han-quoc?limit=20"
                    viewAllLink="/quoc-gia/han-quoc"
                    initialMovies={prefetched.movieRowHan}
                    sortByYear={true}
                    shouldEnrich={true}
                    revalidate={30}
                />
            </LazyRow>

            {/* Các dãy bên dưới dùng LazyRow để giảm TBT (Total Blocking Time) */}
            <LazyRow estimatedHeight="300px">
                <MovieRow
                    title="Phim Trung Quốc mới"
                    apiUrl="https://phimapi.com/v1/api/quoc-gia/trung-quoc?limit=20"
                    viewAllLink="/quoc-gia/trung-quoc"
                    initialMovies={prefetched.movieRowTrung}
                    sortByYear={true}
                    shouldEnrich={true}
                    revalidate={30}
                />
            </LazyRow>

            <LazyRow estimatedHeight="300px">
                <MovieRow
                    title="Phim Âu Mỹ mới"
                    apiUrl="https://phimapi.com/v1/api/quoc-gia/au-my?limit=20"
                    viewAllLink="/quoc-gia/au-my"
                    initialMovies={prefetched.movieRowAuMy}
                    sortByYear={true}
                    shouldEnrich={true}
                    revalidate={30}
                />
            </LazyRow>

            <LazyRow estimatedHeight="420px">
                <FeaturedSlider
                    title="TV Shows Truyền Hình"
                    apiUrl="https://phimapi.com/v1/api/danh-sach/tv-shows?limit=20"
                    viewAllLink="/danh-sach/tv-shows"
                    navId="featured-tv"
                    initialMovies={prefetched.featuredTv}
                />
            </LazyRow>

            <LazyRow estimatedHeight="480px">
                <MoviePosterRow
                    title="Phim Chiếu Rạp Mới"
                    apiUrl="https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=20"
                    viewAllLink="/danh-sach/phim-chieu-rap"
                    initialMovies={prefetched.posterChieuRap}
                    sortByYear={true}
                    revalidate={30}
                />
            </LazyRow>

            <LazyRow estimatedHeight="480px">
                <MoviePosterRow
                    title="Phim Bộ Mới Nhất"
                    apiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo?limit=30"
                    viewAllLink="/danh-sach/phim-bo"
                    initialMovies={prefetched.posterPhimBo}
                    sortByYear={true}
                    revalidate={600}
                />
            </LazyRow>

            <LazyRow estimatedHeight="220px">
                <TopMovieRow
                    title="Top 30 Phim Lẻ Hôm Nay"
                    apiUrl="https://phimapi.com/v1/api/danh-sach/phim-le?limit=30"
                    viewAllLink="/danh-sach/phim-le"
                    initialMovies={prefetched.topPhimLe}
                />
            </LazyRow>

            <LazyRow estimatedHeight="220px">
                <TopMovieRow
                    title="Top 30 Phim Bộ Hôm Nay"
                    apiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo?limit=30"
                    viewAllLink="/danh-sach/phim-bo"
                    initialMovies={prefetched.topPhimBo}
                />
            </LazyRow>

            <LazyRow estimatedHeight="420px">
                <FeaturedSlider
                    title="Hoạt Hình Anime Hay"
                    apiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=20"
                    viewAllLink="/danh-sach/hoat-hinh"
                    navId="featured-anime"
                    initialMovies={prefetched.featuredAnime}
                />
            </LazyRow>

            <LazyRow estimatedHeight="480px">
                <MoviePosterRow
                    title="Phim Kinh Dị"
                    apiUrl="https://phimapi.com/v1/api/the-loai/kinh-di?limit=20"
                    viewAllLink="/the-loai/kinh-di"
                    initialMovies={prefetched.posterKinhDi}
                />
            </LazyRow>

            <LazyRow estimatedHeight="480px">
                <MoviePosterRow
                    title="Phim Hoạt Hình"
                    apiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=30"
                    viewAllLink="/danh-sach/hoat-hinh"
                    initialMovies={prefetched.posterHoatHinh}
                />
            </LazyRow>
        </>
    );
}
