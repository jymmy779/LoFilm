"use client";

import CategoriesSection from "./components/CategoriesSection/CategoriesSection";
import HeroSlider from "./components/HeroSlider/HeroSlider";
import MovieRow from "./components/MovieRow/MovieRow";
import FeaturedSlider from "./components/FeaturedSlider/FeaturedSlider";
import MoviePosterRow from "./components/MoviePosterRow/MoviePosterRow";
import TopMovieRow from "./components/TopMovieRow/TopMovieRow";

export default function HomeClient() {
    return (
        <>
            <HeroSlider />
            <CategoriesSection />
            <MovieRow
                title="Phim Hàn Quốc mới"
                apiUrl="https://phimapi.com/v1/api/quoc-gia/han-quoc?limit=20"
                viewAllLink="/"
            />
            <MovieRow
                title="Phim Trung Quốc mới"
                apiUrl="https://phimapi.com/v1/api/quoc-gia/trung-quoc?limit=20"
                viewAllLink="/"
            />
            <MovieRow
                title="Phim Âu Mỹ mới"
                apiUrl="https://phimapi.com/v1/api/quoc-gia/au-my?limit=20"
                viewAllLink="/"
            />

            <FeaturedSlider
                title="TV Shows Truyền Hình"
                apiUrl="https://phimapi.com/v1/api/danh-sach/tv-shows?limit=20"
                viewAllLink="/"
            />

            <MoviePosterRow
                title="Phim Chiếu Rạp Mới"
                apiUrl="https://phimapi.com/v1/api/danh-sach/phim-chieu-rap?limit=20"
                viewAllLink="/"
            />
            <MoviePosterRow
                title="Phim Bộ Mới Nhất"
                apiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo?limit=20"
                viewAllLink="/"
            />
            <TopMovieRow
                title="Top 30 Phim Lẻ Hôm Nay"
                apiUrl="https://phimapi.com/v1/api/danh-sach/phim-le?limit=30"
                viewAllLink="/"
            />
            <TopMovieRow
                title="Top 30 Phim Bộ Hôm Nay"
                apiUrl="https://phimapi.com/v1/api/danh-sach/phim-bo?limit=30"
                viewAllLink="/"
            />
            <FeaturedSlider
                title="Hoạt Hình Anime Hay"
                apiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=20"
                viewAllLink="/"
            />
            <MoviePosterRow
                title="Phim Kinh Dị"
                apiUrl="https://phimapi.com/v1/api/the-loai/kinh-di?limit=20"
                viewAllLink="/"
            />
            <MoviePosterRow
                title="Phim Hoạt Hình"
                apiUrl="https://phimapi.com/v1/api/danh-sach/hoat-hinh?limit=20"
                viewAllLink="/"
            />
        </>
    );
}
