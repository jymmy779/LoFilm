import { Metadata } from "next";
import { Suspense } from "react";
import MovieListClient from "./MovieListClient";
import CatalogSkeleton from "@/app/components/Movies/MovieCatalog/CatalogSkeleton";
import { fetchCatalogData } from "@/app/utils/serverFetch";
import { getAbsoluteUrl } from "@/app/config/site";
import { INTERNAL_API_URL } from "@/app/utils/apiConfig";

export const revalidate = 60; // Đồng bộ 60 giây toàn hệ thống

export const metadata: Metadata = {
    title: "Phim Lẻ Mới Nhất 2026 | LoFilm - Xem Phim Lẻ 4K Vietsub Miễn Phí",
    description: "Tổng hợp các phim lẻ, phim một tập mới nhất từ khắp nơi trên thế giới, cập nhật liên tục mỗi ngày trên LoFilm. Xem phim lẻ 4K, Vietsub, thuyết minh chất lượng cao hoàn toàn miễn phí.",
    keywords: [
        "phim le", "phim le moi", "phim le hay", "phim le vietsub",
        "phim le chieu rap", "xem phim le online", "phim le 4k",
        "lofilm phim le", "phim le 2026", "phim mot tap hay"
    ],
    alternates: {
        canonical: getAbsoluteUrl('/danh-sach/phim-le'),
    },
};

export default function SingleMoviePage() {
    return (
        <Suspense fallback={<CatalogSkeleton />}>
            <SingleMovieData />
        </Suspense>
    );
}

async function SingleMovieData() {
    const initialData = await fetchCatalogData(
        `${INTERNAL_API_URL}/danh-sach/phim-le`,
        1,
        32
    );

    return <MovieListClient initialData={initialData} />;
}
